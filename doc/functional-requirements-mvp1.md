# GeoSnap - Requisiti Funzionali

**Versione:** 1.0 (MVP1) | **Autore/Committente:** Massimo Bottelli | **Stato:** Pronto per la fase di requisiti tecnici | **Licenza di riuso:** Documento di progetto | Crediti: Massimo Bottelli 

---

## 1. Introduzione

Applicazione mobile-first di tipo videogioco didattico. Il giocatore posiziona le sagome delle nazioni sulla mappa di un continente, trascinandole dal "vassoio" alla posizione corretta, con meccanismo di aggancio (snap).

**Obiettivo primario:** didattico — imparare nomi e posizioni delle nazioni.
**Obiettivo secondario:** divertimento e sfida in famiglia, tramite sistema di punteggio.

## 2. Target e contesto d'uso

- **Target principale:** studenti scuole medie e superiori (11–19 anni circa).
- **Contesto d'uso:** anche giocatori familiari/adulti in sessioni di sfida.
- **Sessioni:** brevi, pochi minuti (partita completa continente: ~5–8 minuti).
- **Piattaforma:** mobile first, interazione touch. (La fruizione desktop è consentita ma non prioritaria.)
- **Lingua:** italiano (nomi delle nazioni in italiano).

## 3. Roadmap degli incrementi

| Incremento | Contenuto |
|---|---|
| **MVP1** | Partita completa a giocatore singolo, solo continente Europa, punteggio, nessun salvataggio |
| **MVP2** | Multiplayer locale a turni (2 giocatori, stesso dispositivo), modalità esperta, partita rapida, profilo utente con statistiche, ulteriori continenti |

Il presente documento dettaglia i requisiti di MVP1 e definisce i requisiti di MVP2 a livello funzionale.

---

## 4. Requisiti funzionali — MVP1

### 4.1 Avvio e flusso di partita

- **RF-01** All'avvio dell'applicazione la partita inizia direttamente, senza onboarding, tutorial o schermate di spiegazione.
- **RF-02** In MVP1 è disponibile solo il continente **Europa**; non è prevista schermata di selezione del continente.
- **RF-03** Flusso di partita:
  1. Comparsa della mappa dell'Europa a schermo, con in basso vassoio scorrevole orizzontalmente che contiene le sagome delle nazioni.
  2. Il giocatore trascina una sagoma dal vassoio sulla mappa.
  3. Al rilascio, la sagoma viene valutata: se prossima alla posizione corretta si aggancia (snap); altrimenti torna al vassoio.
  4. La partita termina quando tutte le nazioni giocabili sono state posizionate.
- **RF-04** Le sagome nel vassoio compaiono in **ordine casuale**, rimescolato a ogni nuova partita (evita memorizzazione della sequenza).

### 4.2 Contenuti geografici

- **RF-05** MVP1 include le nazioni europee, **esclusi i microstati**. Set giocabile indicativo: ~40 nazioni (elenco definitivo da congelare in fase di content design; esempi esclusi: Andorra, San Marino, Città del Vaticano, Monaco, Liechtenstein, Malta, Lussemburgo).
- **RF-06** I microstati esclusi dal gioco **compaiono comunque sulla mappa** come territorio grigio non interattivo, per mantenere la coerenza geografica della mappa (nessun "buco" visivo).
- **RF-07** Sono escluse le nazioni "speciali"/ambigue: la copertura si limita ai paesi europei geograficamente e politicamente non ambigui. (Groenlandia, Russia e Turchia: non incluse in MVP1; valutazione in MVP2 con gli altri continenti.)

### 4.3 Mappa e vassoio (UI)

- **RF-08** La mappa occupa la parte principale dello schermo.
- **RF-09** Il **vassoio** è una striscia orizzontale scorrevole (swipe) posizionata in basso, contenente le sagome delle nazioni non ancora posizionate.
- **RF-10** Ogni sagoma nel vassoio è accompagnata dal **nome della nazione** (etichetta leggibile).
- **RF-11** Le sagome nel vassoio hanno dimensioni proporzionali, ma con dimensione minima garantita per leggibilità e per l'area di tocco (hit area minima indipendente dalle dimensioni reali della nazione).
- **RF-12** Un **contatore di avanzamento** è sempre visibile (es. "12/44 posizionate").
- **RF-13** Il vassoio si svuota progressivamente man mano che le nazioni vengono posizionate.
- **RF-14** Al completamento dell'aggancio, la nazione assume un **colore di "posizionata"** e sulla mappa compare il **nome della nazione** (rinforzo didattico: nome + posizione visti insieme).

### 4.4 Interazione drag & drop e aggancio (snap)

- **RF-15** Trascinamento touch: la sagoma selezionata al tocco si stacca dal vassoio e segue il dito.
- **RF-16** **La valutazione dell'aggancio avviene solo al rilascio della sagoma.** Durante il trascinamento non si verifica né si mostra alcun comportamento predittivo: nessun aggancio, nessuna evidenziazione, nessun cambiamento di aspetto vicino alla posizione corretta. (Vedi anti-brute-force §4.6.)
- **RF-17** **Aggancio riuscito:** se al rilascio la sagoma è entro la tolleranza della posizione corretta, si aggancia con **animazione di aggancio ed effetto grafico positivo**.
- **RF-18** **Aggancio fallito:** se al rilascio la sagoma è fuori tolleranza, **torna al vassoio con animazione di ritorno**, feedback visivo neutro (non punitivo). Nessun malus assoluto.
- **RF-19** La tolleranza di aggancio è **proporzionale alle dimensioni della nazione** ed è **parametrica**, da calibrare in fase di tuning. Nessun valore fisso è specificato in questo documento.
- **RF-20** La sagoma si aggancia **solo alla propria posizione corretta**: non esiste aggancio a posizioni errate.

### 4.5 Zoom e pan

- **RF-21** La mappa supporta **zoom e pan liberamente**, con gesti touch (pizzicare per zoomare).
- **RF-22** Zoom e pan sono disponibili **solo quando non si sta trascinando una sagoma** (durante il drag i gesti di mappa sono disattivati; il flusso di recupero dopo un errore è: la sagoma torna al vassoio → il giocatore zooma/riposiziona la vista → riprende la sagoma e riprova).

### 4.6 Punteggio e anti-brute-force

- **RF-23** Ogni nazione posizionata assegna punti in base ai tentativi falliti precedenti su quella nazione:

| Esito posizionamento | Punti |
|---|---|
| Aggancio al 1° tentativo | 100 |
| Aggancio al 2° tentativo | 50 |
| Aggancio al 3° tentativo | 25 |
| Aggancio dal 4° tentativo in poi | 0 |

- **RF-24** Non esistono limiti ai tentativi né malus assoluti: la partita è sempre completabile. La strategia del brute force non è vietata ma è **antagonistica al punteggio** (completare "a tappeto" produce punteggio ≈ 0).
- **RF-25** Il punteggio corrente è visibile durante la partita.
- **RF-26** Ogni rilascio fallito è conteggiato come errore relativo alla nazione (base per statistiche MVP2).
- **RF-27** Non è previsto un punteggio legato al tempo in MVP1.

### 4.7 Feedback sensoriale

- **RF-28** **Nessun suono** nell'applicazione in MVP1.
- **RF-29** Il feedback è **esclusivamente visivo**: animazione + effetto grafico per l'aggancio riuscito; animazione di ritorno per il fallito; nessun effetto punitivo.

### 4.8 Aiuti

- **RF-30** Non sono previsti aiuti in MVP1 (nessuna guida di posizione, nessun skip, nessuna modalità allenamento).

### 4.9 Fine partita

- **RF-31** Al posizionamento dell'ultima nazione, si apre la **schermata di riepilogo** con:
  - Punteggio totale e punteggio massimo ottenibile (es. "2.150 / 4.400")
  - Percentuale di precisione (quota di nazioni posizionate al primo tentativo)
  - Tempo totale di partita (solo informativo)
  - Elenco delle nazioni con errori commessi
- **RF-32** Il **timer non è visibile durante la partita** (misurato e mostrato solo nel riepilogo).

### 4.10 Persistenza e ripetizione

- **RF-33** **Nessun salvataggio di partita in corso:** se il giocatore abbandona o esce, la partita è persa e la nuova partita riparte da zero.
- **RF-34** Il pulsante "Gioca ancora" nel riepilogo avvia una nuova partita completa, con **nuovo ordine casuale** delle sagome.

---

## 5. Requisiti funzionali — MVP2

### 5.1 Multiplayer locale a turni

- **RF-35** Modalità 2 giocatori **sullo stesso dispositivo (locale)**, non online (per ora).
- **RF-36** **Turni alternati:** ogni giocatore, nel proprio turno, posiziona una nazione a scelta; poi il turno passa all'altro giocatore.
- **RF-37** Il punteggio è individuale; al termine della partita si dichiara il vincitore per punteggio più alto (criteri di pareggio da definire in fase di design MVP2).

### 5.2 Modalità esperta

- **RF-38** Modalità in cui le sagome nel vassoio sono mostrate **senza nome della nazione**: il giocatore deve riconoscere la sagoma e sapere quale nazione sta posizionando.

### 5.3 Partita rapida

- **RF-39** Modalità con sottoinsieme casuale di nazioni (es. 15) per sessioni di 2–3 minuti. (Dimensione del sottoinsieme parametrica.)

### 5.4 Profilo utente e statistiche

- **RF-40** Profilo utente identificato **solo da un nickname**: nessun dato personale (nome, email, ecc.).
- **RF-41** Statistiche tracciate: storico dei punteggi, precisione per singola nazione (per evidenziare le nazioni confuse più spesso), avanzamento per continente.
- **RF-42** **Vincolo di persistenza:** tutti i dati utente sono salvati **localmente sul dispositivo**, senza backend/servizi remoti. La scelta della tecnologia di persistenza è demandata alla fase di requisiti tecnici.

### 5.5 Contenuti aggiuntivi

- **RF-43** Aggiunta degli altri continenti con relativa schermata di selezione continente.
- **RF-44** Eventuale inclusione di modalità "Mondo" (tutti i continenti mescolati) e rivalutazione delle nazioni ambigue (Groenlandia, Russia, Turchia, territori d'oltremare).
- **RF-45** Eventuale estensione del multiplayer a più di 2 giocatori e/o online.

---

## 6. Requisiti trasversali

- **RF-46** **Tema:** tema chiaro, colore accent **verde lime**, coerentemente applicato a titoli, bottoni ed elementi interattivi.
- **RF-47** **Accessibilità:** contrasti adeguati e palette distinguibile per daltonici (in particolare: nazioni posizionate vs. da posizionare); dimensioni testo leggibili su mobile.
- **RF-48** **Lingua:** italiano.
- **RF-49** **Onboarding:** assente per MVP1 (gioco autoesplicativo).

## 7. Parametri di tuning

I seguenti valori sono **parametrici** e calibrabili senza modifiche funzionali:

- Tolleranza di aggancio (proporzionale alle dimensioni della nazione)
- Scala punti per tentativi falliti (100 / 50 / 25 / 0)
- Dimensione minima sagome nel vassoio e hit area minima
- Dimensione sottoinsieme "partita rapida" (MVP2)

## 8. Crediti e contatti

- **Crediti:** Massimo Bottelli
- **Sito web:** massimobottelli.it
- **GitHub:** github.com/massimobottelli

## 9. Domande aperte per la fase di requisiti tecnici

1. Persistenza locale dei dati utente (RF-42): tecnologia consigliata.
2. Sorgente e formato dei dati geografici (sagome vettoriali delle nazioni, proiezione della mappa).
3. Gestione della mappa interattiva (zoom/pan) su mobile.
4. Strategia per hit area e rendering delle sagome con hit area minima garantita (RF-11).
5. Elenco definitivo delle ~40 nazioni europee giocabili (da congelare con il content owner).

---

*Documento di requisiti funzionali — da passare alla fase di analisi tecnica.*