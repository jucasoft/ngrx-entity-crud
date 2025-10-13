# Panoramica dei Workflow di GitHub Actions

Questa directory contiene tutti i workflow di GitHub Actions per il progetto `ngrx-entity-crud`. I workflow sono progettati per essere modulari e riutilizzabili, garantendo un processo di integrazione continua (CI) robusto e manutenibile.

## Workflow Principali

### 📄 `reusable-build.yml`

- **Scopo:** È il cuore del sistema di CI. Contiene la logica centralizzata per la build, i test e (opzionalmente) il linting.
- **Funzionamento:** Questo workflow non viene eseguito direttamente, ma viene **chiamato** da altri workflow che necessitano di eseguire i passaggi di base della CI. È parametrizzato per essere flessibile e adattarsi a diversi contesti.
- **Chiamato da:** `pr-checks.yml`, `build-on-push.yml`, `main.yml`, `npm-publish.yml`.

### 📄 `pr-checks.yml`

- **Scopo:** Garantire la qualità del codice prima che venga unito al branch principale.
- **Attivazione:** Si attiva su ogni **Pull Request** aperta verso il branch `master`.
- **Azione:** Esegue il `reusable-build.yml` per validare che le modifiche non introducano regressioni.

### 📄 `build-on-push.yml`

- **Scopo:** Fornire un feedback rapido agli sviluppatori sulle modifiche che inviano.
- **Attivazione:** Si attiva ad ogni **push** su qualsiasi branch del repository.
- **Azione:** Chiama `reusable-build.yml` per eseguire build e test.

### 📄 `main.yml`

- **Scopo:** Gestire il ciclo di integrazione per il branch `main` e la creazione di release basate su tag.
- **Attivazione:** Si attiva su **push** al branch `main` o su **push di tag** che seguono il versionamento semantico (es. `v1.2.3`).
- **Azione:** Esegue `reusable-build.yml` e contiene la logica per la pubblicazione (anche se parzialmente implementata in questo file).

### 📄 `npm-publish.yml`

- **Scopo:** Automatizzare la pubblicazione del pacchetto su **npm**.
- **Attivazione:** Si attiva quando viene creata una nuova **Release** tramite l'interfaccia di GitHub.
- **Azione:**
  1.  Esegue `reusable-build.yml` per creare il pacchetto.
  2.  Scarica l'artefatto della build.
  3.  Pubblica il pacchetto su npm, gestendo anche le versioni `beta`.

---

```

```
