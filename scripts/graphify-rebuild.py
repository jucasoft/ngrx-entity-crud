"""Aggiorna graphify-out/ (solo AST, niente LLM) con i file cambiati tra due revisioni.

Uso: python scripts/graphify-rebuild.py <from> <to>
Invocato da scripts/graphify-hook.sh negli hook husky (post-commit, post-merge,
post-checkout, post-rewrite). Esce 0 anche se non c'è niente da fare.
"""
import os
import subprocess
import sys
from pathlib import Path

# I documenti esistenti restano fuori: re-estrarli via AST cancellerebbe i loro nodi
# semantici (LLM). Per i documenti serve /graphify --update; se cancellati, vanno rimossi.
DOC_SUFFIXES = {'.md', '.mdx', '.qmd'}
# File di codice nella root del repo, usato per ancorare la root di extract().
ROOT_ANCHOR = 'package.json'


def patch_graphify_windows_paths():
    """graphify.watch._rebuild_code confronta str(path) con i source_file del grafo,
    salvati con '/'. Su Windows str() usa '\\' e i nodi dei file cancellati o
    modificati non vengono mai rimossi. Si sostituisce str() nel solo modulo
    graphify.watch (lo usa solo come funzione, mai in isinstance)."""
    import builtins
    from pathlib import PurePath
    import graphify.watch as watch

    def posix_str(obj='', *args):
        return obj.as_posix() if isinstance(obj, PurePath) else builtins.str(obj, *args)

    watch.str = posix_str


def patch_graphify_extract_root():
    """graphify.extract.extract ricava la root dei source_file dal prefisso comune dei
    file ricevuti: in modalità incrementale (pochi file) i percorsi e gli id escono
    relativi alla loro cartella, non al repo, e i nodi non combaciano più con il
    grafo completo. Aggiungere un file della root riporta la root al repo."""
    import graphify.extract as ex
    original = ex.extract
    anchor = Path(ROOT_ANCHOR).resolve()

    def extract_from_repo_root(paths, *args, **kwargs):
        paths = list(paths)
        if paths and anchor not in paths:
            paths.append(anchor)
        return original(paths, *args, **kwargs)

    ex.extract = extract_from_repo_root


def git_lines(*args):
    out = subprocess.run(['git', '-c', 'core.quotePath=false', *args],
                         capture_output=True, text=True, encoding='utf-8', check=True).stdout
    return [line for line in out.splitlines() if line.strip()]


def changed_files(rev_from, rev_to):
    try:
        names = git_lines('diff', '--name-only', rev_from, rev_to)
    except subprocess.CalledProcessError:
        # primo commit del repo: HEAD~1 non esiste
        names = git_lines('diff-tree', '--root', '--no-commit-id', '--name-only', '-r', rev_to)
    return [Path(n) for n in names]


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        return 2
    if not Path('graphify-out/graph.json').exists():
        return 0

    changed = [p for p in changed_files(sys.argv[1], sys.argv[2])
               if not (p.suffix.lower() in DOC_SUFFIXES and p.exists())]
    if not changed:
        print('[graphify] nessun file di codice cambiato')
        return 0

    if os.name == 'nt':
        patch_graphify_windows_paths()
    patch_graphify_extract_root()
    from graphify.watch import _rebuild_code
    ok = _rebuild_code(Path('.'), changed_paths=changed, force=True, block_on_lock=True)
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
