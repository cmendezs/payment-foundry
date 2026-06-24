# Payment Foundry

[English](README.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Português](README.pt.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

Allineamento interfunzionale, non solo codice.

---

## Che cos'è

La maggior parte degli assistenti IA per la programmazione genera un'integrazione PSP direttamente da un prompt: un modulo di pagamento, un gestore di webhook, fatto. Il codice può funzionare, ma le decisioni sottostanti (ambito PCI, regole antifrode, valuta di regolamento, strategia di retry) non sono mai state effettivamente prese dalle persone responsabili.

Payment Foundry esegue un engagement strutturato al posto di tutto ciò. Un agente IA di livello senior (l'Engagement Manager) guida il vostro team tecnico dallo scoping all'implementazione, e lungo il percorso raccoglie i requisiti dei ruoli che dovranno convivere con il risultato: Compliance, Antifrode, Sicurezza, Finanza, Backend, Frontend, Architettura e il Responsabile dei Pagamenti.

Una sessione. Otto prospettive. Un Implementation Brief che i vostri ingegneri possono eseguire.

---

## Cosa ottenete

| Capacità | Cosa fa |
|---|---|
| Flusso di engagement strutturato | Guida il vostro team attraverso scoping, requisiti, implementazione e revisione in un ordine fisso e logico |
| Raccolta dei requisiti degli stakeholder | Registra le decisioni e i vincoli di ogni ruolo in un file dedicato man mano che la sessione procede |
| Esempi di codice basati sul PSP | Ogni esempio di codice è reale ed eseguibile, adattato da contenuto di riferimento PSP verificato, mai pseudocodice |
| Revisioni degli specialisti | Otto sotto-agenti rispondono approvare, segnalare o bloccare, con motivazione, nei punti decisionali critici |
| Implementation Brief | Un singolo documento che copre decisioni, codice, punti aperti e tutto ciò che non è verificato |
| Estensibile a nuovi PSP | Aggiungete un nuovo PSP seguendo la struttura esistente `psps/<nome>/`, nessuna modifica alle istruzioni principali necessaria |

---

## Come si svolge una sessione

```
/start-session
      |
      v
  Scoping e vincoli  ->  Requisiti degli stakeholder (un ruolo alla volta)
      |
      v
  /validate-context  ->  Verificare il contenuto di riferimento PSP rispetto alle fonti ufficiali
      |
      v
  Pagamenti principali -> Webhook -> Prodotti e Prezzi -> Tasse -> Piattaforma -> Capital
                                          -> Terminale -> Emissione carte -> Treasury -> Stablecoin -> Crypto Onramp (secondo l'ambito)
      |
      v
  Revisioni degli specialisti (approvare / segnalare / bloccare)
      |
      v
/wrap-up  ->  Brief + Guida dettagliata + Checklist go-live (outputs/<engagement>/)
```

---

## PSP supportati

| PSP | Stato | Linee di prodotto |
|---|---|---|
| Stripe | Disponibile | Pagamenti (incl. Payment Links), Prodotti e Prezzi, Billing, Tasse, Piattaforma (Connect), Capital, Terminale, Emissione carte (Issuing), Treasury, Stablecoin, Crypto Onramp, Frodi e Contestazioni (Radar), Reporting |

Altri PSP sono in programma. Per richiederne uno o contribuire, aprite una issue o una pull request.

---

## Prerequisiti

- Uno degli agenti IA di programmazione supportati: Claude Code, Google Antigravity, AWS Kiro o Mistral Vibe. Vedere `setup/other-agents.md` per le note di configurazione per ogni strumento
- Un PSP supportato (v1: solo Stripe)
- Chiavi API Stripe di test (publishable + secret)

---

## Guida rapida (quattro passaggi)

### 1. Clonare e accedere alla directory

```bash
git clone https://github.com/cmendezs/payment-foundry.git
cd payment-foundry
```

### 2. Configurare l'ambiente

```bash
cp .env.example .env
# Aprite .env e inserite le vostre chiavi di test Stripe
# Vedere setup/environment-keys.md per i dettagli
```

### 3. Leggere la checklist della prima sessione

Aprite `setup/first-session-checklist.md` e completatela prima della vostra prima sessione. Richiede circa dieci minuti e previene i problemi di configurazione più comuni.

### 4. Avviare e iniziare l'engagement

```bash
claude
```

Poi nella sessione Claude Code:

```
/start-session
```

Usate Google Antigravity, AWS Kiro o Mistral Vibe? Lo stesso flusso `/start-session`, `/validate-context` e `/wrap-up` è disponibile in ciascuno di essi, vedere `setup/other-agents.md` per i passaggi di avvio equivalenti e le posizioni degli skill.

---

## Comandi Slash

Tre comandi coprono l'intero ciclo di vita dell'engagement.

| Comando | Quando eseguirlo | Cosa fa |
|---|---|---|
| `/start-session` | All'inizio di ogni engagement | Identifica il PSP, definisce l'ambito dell'engagement, raccoglie i requisiti degli stakeholder un ruolo alla volta e propone la sequenza di implementazione |
| `/validate-context` | Dopo `/start-session`, prima dell'inizio dell'implementazione | Verifica i fatti specifici del PSP nell'ambito (stato, prezzi, restrizioni di capacità, stringhe header, versioni API) rispetto alle fonti ufficiali del PSP e registra ciò che è verificato, non verificato o bloccato |
| `/wrap-up` | Alla fine dell'engagement | Raccoglie i punti aperti, documenta i risultati dei sotto-agenti e produce tre artefatti sotto `outputs/<engagement>/`: un Implementation Brief esecutivo, una Guida Dettagliata all'Implementazione orientata al codice e una Checklist di Preparazione al Go-Live |

Tutto ciò che avviene tra `/start-session` e `/wrap-up` è gestito in modo conversazionale dall'Engagement Manager: consigli di implementazione, esempi di codice e revisioni degli specialisti quando emergono decisioni.

---

## Come funziona una sessione

Un engagement tipico attraversa queste fasi in ordine:

1. **Scoping** : caso d'uso, stack tecnologico, mercati, valute, tempistiche, dimensione del team
2. **Requisiti degli stakeholder** : Responsabile dei Pagamenti, Compliance, Antifrode, Backend, Frontend, Architettura, Sicurezza, Finanza, raccolti in modo conversazionale e salvati come file di riferimento
3. **Validazione del contesto** : `/validate-context` verifica i fatti specifici del PSP nell'ambito rispetto alle fonti ufficiali e registra gli elementi verificati, non verificati e bloccati
4. **Pagamenti principali** : Payment Intents, Payment Element, Payment Links, gestione della conferma
5. **Webhook** : gestione degli eventi, riconciliazione dello stato degli ordini, retry
6. **Catalogo Prodotti e Prezzi** (se Billing o Tasse nell'ambito) : primitive di catalogo condivise (`Product`, `Price`, `tax_code`, `tax_behavior`, `currency_options`), da definire una volta prima di ogni consumatore
7. **Tasse** (se applicabile) : registrazioni, calcolo automatico delle tasse su Invoices e Checkout, Tax IDs, reverse charge, marketplace facilitator sotto Connect
8. **Flussi piattaforma** (se applicabile) : Connect, pagamenti multi-parte, commissioni di piattaforma
9. **Capital** (se applicabile) : finanziamento offerto dalla piattaforma, idoneità, divulgazioni, instradamento dei rimborsi
10. **Flussi in presenza** (se applicabile) : Terminale, gestione dei lettori, Payment Intents in presenza
11. **Emissione carte** (se applicabile) : carte emesse, controlli di spesa, webhook di autorizzazione
12. **Treasury** (se applicabile) : conti finanziari, movimenti di denaro, modello di ledger pending vs. final, pairing con Issuing
13. **Estensioni stablecoin** (se applicabile) : accettazione tramite Optimized Checkout, saldi stablecoin Treasury, spese carte Issuing da saldo stablecoin, Open Issuance tramite Bridge
14. **Crypto Onramp** (se applicabile) : acquisto fiat-verso-crypto integrato, modalità di integrazione e di KYC, Stripe come merchant of record
15. **Revisioni degli specialisti** : ogni sotto-agente carica il proprio file di requisiti, esamina le decisioni pertinenti e produce un esito approvare / segnalare / bloccare con motivazione
16. **Artefatti dell'engagement** : Implementation Brief esecutivo, Guida Dettagliata all'Implementazione orientata al codice e Checklist di Preparazione al Go-Live per engagement

L'Engagement Manager propone questa sequenza all'inizio e la adatta a ciò che è effettivamente nell'ambito del vostro team.

---

## Sotto-agenti specialisti

Otto specialisti sono disponibili per la revisione interfunzionale. L'Engagement Manager li invoca nei punti decisionali appropriati: non dovete chiamarli direttamente.

| Specialista | Ambito di revisione |
|---|---|
| Responsabile dei Pagamenti | Monitoraggio KPI, rischio di migrazione, governance operativa |
| Responsabile Compliance | Ambito PCI, SCA/3DS2, residenza dei dati, traccia di audit |
| Responsabile Antifrode | Regole di rischio, strategia 3DS, processo di contestazioni e chargeback |
| Responsabile Sicurezza | Gestione dei segreti, validazione delle firme webhook, controlli antifrode |
| Solution Architect | Pattern di integrazione, modalità di fallimento, scalabilità |
| Sviluppatore Frontend | UX di pagamento, gestione degli errori, accessibilità, localizzazione |
| Sviluppatore Backend | Idempotenza, elaborazione webhook, retry, riconciliazione |
| Finanza e Tesoreria | Regolamento, multi-valuta, pagamenti, reporting, fiscalità |

Ogni specialista produce un esito: **approvare**, **segnalare** (procedere con condizioni) o **bloccare** (fermare fino alla risoluzione). L'Engagement Manager vi aiuta a risolvere le segnalazioni e i blocchi prima di procedere.

---

## Struttura del progetto

```
payment-foundry/
├── README.md                        # Siete qui
├── CLAUDE.md                        # Istruzioni dell'Engagement Manager
├── AGENTS.md                        # Puntatore istruzioni condivise, letto da Mistral Vibe, AWS Kiro e altri strumenti compatibili con AGENTS.md
├── .env.example                     # Copiare in .env e inserire le chiavi
│
├── setup/                           # Eseguire una volta prima della prima sessione
│   ├── installation-guide.md
│   ├── first-session-checklist.md
│   ├── environment-keys.md
│   └── other-agents.md              # Note per strumento: Claude Code, Antigravity, Kiro, Vibe
│
├── skills/
│   └── payment-foundry/             # Fonte di verità per i tre skill
│       ├── start-session/SKILL.md      # Comando /start-session
│       ├── validate-context/SKILL.md   # Comando /validate-context
│       └── wrap-up/SKILL.md            # Comando /wrap-up
│
├── scripts/
│   └── setup-agents.sh              # Distribuisce skills/payment-foundry/ a ogni strumento sottostante
│
├── .claude/skills/                  # Copia Claude Code (generata da scripts/setup-agents.sh)
├── .agents/skills/payment-foundry/  # Copia Google Antigravity / AWS Kiro (generata da scripts/setup-agents.sh)
├── .vibe/agents/payment-foundry.toml # Profilo sotto-agente Mistral Vibe (generato da scripts/setup-agents.sh)
│
├── sub-agents/                      # Definizioni degli specialisti
│   ├── README.md                    # Procedura di invocazione
│   ├── head-of-payments.md
│   ├── compliance-officer.md
│   ├── fraud-officer.md
│   ├── security-officer.md
│   ├── solution-architect.md
│   ├── frontend-developer.md
│   ├── backend-developer.md
│   └── finance-treasury.md
│
├── psps/                            # Contenuto di riferimento PSP, caricato a runtime
│   └── stripe/
│       ├── README.md                # Indice: quale file copre cosa
│       ├── payments.md              # Payment Intents, Payment Element, Payment Links
│       ├── products-and-prices.md   # Primitive di catalogo condivise (Product, Price, tax_code, tax_behavior)
│       ├── billing.md               # Abbonamenti, fatturazione, portale clienti, dunning
│       ├── tax.md                   # Stripe Tax: registrazioni, tasse automatiche, Tax IDs
│       ├── platform.md              # Connect: Standard / Express / Custom, trasferimenti, payout
│       ├── capital.md               # Stripe Capital (finanziamento Connect per i conti collegati)
│       ├── terminal.md              # In presenza / point-of-sale: lettori, connection token
│       ├── issuing.md               # Emissione carte: titolari, controlli di spesa, autorizzazioni
│       ├── treasury.md              # Banking integrato (conti finanziari, ACH/wire, OutboundPayments)
│       ├── stablecoins.md           # Trasversale: accettazione Optimized Checkout, saldi, Open Issuance
│       ├── crypto-onramp.md         # Acquisto fiat-verso-crypto integrato (Stripe come merchant of record)
│       ├── fraud-and-disputes.md    # Radar (incl. Fraud Teams), 3DS, chargeback
│       ├── reports.md               # API di reporting, Activity Report, Sigma
│       └── testing-and-ops.md       # Modalità test/live, test dei webhook, versionamento API
│
├── context/                         # Template di scoping e requisiti
│   ├── business-info.md              # Guida allo scoping /start-session
│   ├── go-live-checklist-template.md # Template sorgente per la checklist go-live
│   ├── head-of-payments-requirements.md
│   ├── compliance-officer-requirements.md
│   ├── fraud-officer-requirements.md
│   ├── backend-developer-requirements.md
│   ├── frontend-developer-requirements.md
│   ├── solution-architect-requirements.md
│   ├── security-officer-requirements.md
│   └── finance-treasury-requirements.md
│
└── outputs/
    ├── <engagement>-*-requirements.md      # Raccolti per sessione, per ruolo
    ├── <engagement>-context-validation.md  # Prodotto da /validate-context
    └── <engagement>/                       # Cartella per engagement, prodotta da /wrap-up
        ├── implementation-brief.md         # Livello esecutivo
        ├── implementation-detailed.md      # Manuale sviluppatore con codice
        └── go-live-checklist.md            # Adattato dal template
```

Le informazioni aziendali si trovano in `context/business-info.md` e vengono aggiornate direttamente tra gli engagement, mai copiate per engagement.

---

## Aggiungere un nuovo PSP

Create una cartella sotto `psps/<nome>/` con un `README.md` indice e un file per linea di prodotto. Seguite la stessa struttura di `psps/stripe/`. Nessuna modifica a `CLAUDE.md` o `sub-agents/` necessaria.

---

## Licenza

Questo progetto è distribuito sotto la licenza Apache License 2.0. Vedere il file `LICENSE` per i dettagli.
