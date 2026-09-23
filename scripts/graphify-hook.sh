# Aggiorna graphify-out/ per i file cambiati tra due revisioni (solo AST, non fallisce mai).
# Uso (dagli hook husky): sh scripts/graphify-hook.sh <from> <to>

[ -f graphify-out/graph.json ] || exit 0

GIT_DIR=$(git rev-parse --git-dir 2>/dev/null) || exit 0
for s in rebase-merge rebase-apply MERGE_HEAD CHERRY_PICK_HEAD; do
  [ -e "$GIT_DIR/$s" ] && exit 0
done

# Interprete Python con graphify: quello salvato da /graphify, poi python3/python.
PY=""
if [ -f graphify-out/.graphify_python ]; then
  PY=$(sed '1s/^\xEF\xBB\xBF//' graphify-out/.graphify_python | tr -d '\r\n')
fi
if [ -z "$PY" ] || ! "$PY" -c "import graphify" >/dev/null 2>&1; then
  PY=""
  for c in python3 python; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c "import graphify" >/dev/null 2>&1; then
      PY=$c
      break
    fi
  done
fi
if [ -z "$PY" ]; then
  echo "[graphify] Python con graphify non trovato: grafo non aggiornato"
  exit 0
fi

"$PY" scripts/graphify-rebuild.py "$1" "$2" || echo "[graphify] aggiornamento fallito: sh scripts/graphify-hook.sh $1 $2 per i dettagli"
exit 0
