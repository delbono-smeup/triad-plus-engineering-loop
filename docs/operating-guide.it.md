# Triad Engineering Loop: guida operativa

## Scopo

Triad Engineering Loop trasforma un documento di requisiti di prodotto (PRD) in
modifiche software revisionate, verificabili e tracciabili. Pianificazione,
stato ed evidenze vivono in un workspace di controllo separato dai repository di
prodotto. Il metodo è un ciclo: una feature è completa solo con criteri,
metriche e quality gate superati, più una review indipendente.

## Ruoli e autorità

| Ruolo | Responsabilità ordinaria | Non deve fare di norma |
| --- | --- | --- |
| Proprietario del progetto | Fornisce il PRD, decide su prodotto e PR, avvia e chiude la demo. | Approvare manualmente ogni card o decisione ordinaria. |
| Orchestratore | Gestisce sequenza, stato, delega, evidenze, escalation e consegna. | Svolgere sviluppo o review di routine. |
| Sviluppatore | Implementa una card assegnata, aggiunge test e riporta evidenze. | Estendere lo scope o revisionare il proprio lavoro. |
| Evaluator | Solo per card Gauntlet, confronta in contesto fresco l’artefatto verificato con un quality bar concreto e restituisce un solo gap principale. | Implementare, approvare la consegna o vedere narrativa/storico dello sviluppatore nel primo giudizio. |
| Reviewer | Verifica indipendentemente card, diff, test, metriche, rischi e trail qualitativo completo. | Revisionare il proprio codice o rinunciare a un gate. |

I profili modello sono configurabili. In Codex è sensato usare un coordinatore a
ragionamento medio, uno sviluppatore a ragionamento massimo e un reviewer
separato a ragionamento medio. La skill non può imporre il modello: il runtime
deve esporre realmente tali profili.

L’orchestratore è l’arbitro operativo. Risolve i disaccordi ordinari da PRD,
card, policy ed evidenze. Escala solo se una decisione modifica intento di
prodotto, criteri, metriche, gate, architettura, sicurezza, budget o rischio
accettato.

## Ciclo di vita

```text
Baseline del PRD
  -> piano delle card dichiarato
  -> una card pronta
  -> sviluppo -> evidence di verifica esterna -> valutazione Gauntlet opzionale -> review indipendente
  -> approvata -> prossima card
     rework    -> nuovo sviluppo
     bloccata  -> decisione del proprietario
  -> consegna e push normale dei branch
  -> eventuale demo controllata dal proprietario
```

Il piano viene mostrato prima dell’avvio ma non attende una seconda approvazione
manuale. L’orchestratore prosegue, salvo modifica del piano da parte del
proprietario o condizione di escalation.

## 1. Workspace di controllo

Creare un workspace per iniziativa, fuori da ogni repository di prodotto. Un
repository Git privato è consigliato per conservarne storia e backup:

```text
projects/<project-id>/
  project.yaml
  artifacts/prd.md
  .loop/
    feature-plan.md
    work-queue.yaml
    quality-gates.yaml
    decision-policy.md
    run-state.yaml
    features/
    reviews/
    handoffs/
  worktrees/
```

Il repository di controllo non deve contenere sorgente di prodotto, worktree,
dipendenze generate, credenziali o file `.env`. Il manifest `project.yaml`
elenca repository target, branch di base, branch di progetto univoco e worktree
locale. I branch isolano il lavoro; pull request e merge restano decisioni del
proprietario.

## 2. Baseline operativa del PRD

Il PRD può provenire da file, sistema documentale, URL o repository Git. Al
bootstrap se ne copia il contenuto approvato in `artifacts/prd.md` e si registra
fonte, revisione quando disponibile, data di acquisizione, percorso e SHA-256.

Lo snapshot governa il loop; un documento esterno che cambia non aggiorna nulla
in silenzio. Prima di ogni ciclo l’orchestratore verifica lo SHA-256. Una
differenza blocca il lavoro finché il proprietario non ripristina la baseline o
non dichiara esplicitamente una rebaseline.

Una rebaseline conserva lo snapshot precedente, registra hash e revisioni prima
e dopo, motivo e card impattate. Se cambiano obiettivi, metriche o criteri di
accettazione, il piano delle card viene aggiornato e mostrato prima di proseguire.

## 3. Feature card e pianificazione

La feature card è l’unità di consegna. Definisce risultato osservabile,
repository/branch/worktree, scope e lavoro escluso, criteri pass/fail, metriche,
gate obbligatori, dipendenze, scenario di test pratico e rischi.

Il piano elenca tutte le card con dipendenze, metriche, gate e scenari. Per ogni
worktree l’orchestratore sceglie una sola card pronta alla volta. Il parallelismo
è consentito solo se worktree e superfici di modifica sono indipendenti.

## 4. Sviluppo, gate e review

L’orchestratore consegna allo sviluppatore card, estratto di PRD, istruzioni del
repository, gate e rischi. Lo sviluppatore riporta file modificati, test,
risultati esatti dei comandi, metriche e rischi aperti.

Se un gate obbligatorio fallisce, la card torna in `rework`; non viene inviata al
reviewer come successo. Un reviewer nuovo riceve card, diff, evidenze e storia
dei fallimenti, riesegue abbastanza controlli da verificare il risultato e dà una
raccomandazione indipendente:

| Esito | Azione dell’orchestratore |
| --- | --- |
| `approved` | Verifica le evidenze, crea il commit locale della card e libera la prossima card pronta. |
| `rework` | Registra il rilievo e restituisce la card allo sviluppatore. |
| `blocked` | Registra la decisione necessaria ed escala solo se materiale. |

Il limite di retry è configurabile. Un gate fallito o indisponibile non diventa
un pass: al limite si produce un’escalation documentata.

### Gauntlet qualitativo opzionale

Correttezza e ottimizzazione qualitativa restano separate. Ogni card usa per
default `optimization.mode: none`. Una card `gauntlet` dichiara invece un quality
bar osservabile, snapshotizzato e con hash, più enforcement `required` oppure
`aspirational`. Il riferimento può essere screenshot, golden output, benchmark,
implementazione di riferimento o rubric misurabile; “bello” o “production
ready” non sono quality bar sufficienti.

Quando termina lo sviluppatore, un runner esterno esegue i gate configurati e
scrive evidence atomica del preciso candidate fingerprint. Una patch successiva
la invalida. Solo dopo una verification valida l’Evaluator, in un contesto nuovo,
riceve un packet cieco con outcome, quality bar, artefatto reale, istruzioni di
osservazione e sintesi della verification: niente report/ragionamenti/storico
dello sviluppatore. Restituisce `candidate_wins`, `bar_wins` o `indeterminate`;
in caso di perdita indica un solo largest gap e una riparazione circoscritta.

Al bootstrap Triad rileva il runtime di verification disponibile. In modalità
`auto` usa un hook lifecycle asincrono installato e trusted quando il runtime lo
supporta; altrimenti l’orchestratore invoca esplicitamente lo stesso runner dopo
la conclusione dello sviluppatore. Le due vie producono la medesima evidence e
l’assenza dell’hook non può mai diventare un gate superato.

L’orchestratore applica plateau, tempo, budget e safety ceiling con evidence
osservabile. Un bar `required` blocca se non si vince senza waiver del
proprietario; uno `aspirational` può arrivare alla review con residual gap
registrato. L’Evaluator non sostituisce mai il Reviewer. Vedi
[evoluzione Gauntlet](gauntlet-evolution.md).

## 5. Eccezioni dell’orchestratore

Sviluppo e review appartengono normalmente ai rispettivi ruoli. Se uno
specialista è indisponibile o il loop non può altrimenti progredire,
l’orchestratore può svolgere un compito hands-on circoscritto senza attendere
approvazione. Registra trigger, motivo della mancata delega, scope, alternative,
rischio, validazione, review indipendente e ritorno ai ruoli ordinari.

Il codice dell’orchestratore richiede comunque review indipendente; la sua review
non la sostituisce senza una deroga esplicita del proprietario. L’handoff finale
contiene numero di eccezioni, dettaglio ed evidenze, e conferma il ritorno alla
delega normale. È una misura di visibilità, non un tetto automatico.

## 6. Commit, push e pull request

Dopo ogni card approvata l’orchestratore verifica la superficie in staging e
crea un commit locale per quella card. Dopo il superamento di tutte le card,
gate e verifiche di consegna, esegue normalmente il push dei branch di progetto.

Il loop non esegue force-push e non crea o aggiorna pull request senza richiesta
esplicita. Pubblicazione di package, cambi di versione nel registry e release
sono azioni separate e mai automatiche.

## 7. Progetti multi-repository

Quando repository diversi si scambiano dati, eventi, callback, servizi o
librerie di componenti, si creano prima le component card e poi una card finale
di integrazione. Essa dipende da tutte le card componenti, ha criteri sul flusso
dati e gate di sistema propri e registra la mappa esatta repository, branch e
commit usata per il test.

L’integrazione usa sempre worktree locali. Il consumer viene collegato al
worktree del provider con un comando dichiarato di setup/link; non si sostituisce
un artefatto di registry solo per rendere più comodo il test. La card finale
verifica, per esempio, input dati, evento del componente e callback dell’host ed
è soggetta a review indipendente.

I conflitti di merge tra branch distinti restano responsabilità dell’hosting Git.
Il loop protegge branch e worktree che possiede senza imporre lock sui file che
ridurrebbero inutilmente il parallelismo.

## 8. Consegna, feedback e demo

L’handoff di consegna registra card approvate, branch, commit, push, gate,
deroghe, rischi, integrazione, audit delle eccezioni, servizi demo e scenari di
test pratico. Al completamento il progetto è `delivered`.

Il test pratico del proprietario è informativo: non riscrive né riapre
silenziosamente le evidenze consegnate. Un difetto nello scope genera una nuova
follow-up card; un nuovo comportamento o obiettivo genera un progetto successore
e richiede solo le condizioni misurabili mancanti.

La demo remota, se dichiarata, è separata dalla consegna. Il risultato è
`ready_to_start`, ma nessun servizio parte automaticamente. Solo la richiesta
del proprietario avvia il comando; l’orchestratore verifica accesso locale e
remoto e registra gruppo di processo e URL. Il processo resta attivo finché il
proprietario non dichiara conclusa la demo. Viene quindi fermato esclusivamente
quel gruppo e viene verificato il rilascio della porta. Non esiste un TTL
automatico.

## 9. Standard minimo delle evidenze

Non dichiarare completamento dalla sola prosa degli agenti. Servono baseline PRD
stabile, card con criteri pass/fail, evidenze esatte di sviluppo e review,
risultati dei comandi sul branch/worktree reale, decisione indipendente, commit
per card, push alla consegna e handoff finale; per i casi applicabili servono
anche evidence immutabile legata al fingerprint, quality bar/trail di evaluation
e residual gap, oltre a evidenze di integrazione e demo.

## 10. Checklist del proprietario

Normalmente il proprietario fornisce solo:

1. ID del progetto, fonte del PRD, repository, branch e obiettivi misurabili;
2. risposte a reali escalation;
3. scelta su pull request o release;
4. comando di avvio e di chiusura della demo;
5. eventuale feedback post-consegna.

Sequenza, delega, rework, review indipendente, registrazione artefatti, commit e
push normale dei branch appartengono al loop.
