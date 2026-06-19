# Payment Foundry

[English](README.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Português](README.pt.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

Bereichsübergreifende Abstimmung, nicht nur Code.

---

## Was ist das

Die meisten KI-Programmierassistenten generieren eine PSP-Integration direkt aus einem Prompt: ein Zahlungsformular, ein Webhook-Handler, fertig. Der Code funktioniert vielleicht, aber die dahinterliegenden Entscheidungen (PCI-Umfang, Betrugsregeln, Abrechnungswährung, Wiederholungsstrategie) wurden nie wirklich von den zuständigen Personen getroffen.

Payment Foundry führt stattdessen ein strukturiertes Engagement durch. Ein KI-Agent auf Senior-Niveau (der Engagement Manager) begleitet Ihr technisches Team vom Scoping bis zur Implementierung und erfasst dabei die Anforderungen der Rollen, die mit dem Ergebnis leben müssen: Compliance, Betrugsbekämpfung, Sicherheit, Finanzen, Backend, Frontend, Architektur und der Leiter Zahlungsverkehr.

Eine Sitzung. Acht Perspektiven. Ein Implementation Brief, den Ihre Ingenieure direkt umsetzen können.

---

## Was Sie erhalten

| Fähigkeit | Was sie bewirkt |
|---|---|
| Strukturierter Engagement-Ablauf | Führt Ihr Team in einer festen, sinnvollen Reihenfolge durch Scoping, Anforderungen, Implementierung und Review |
| Erfassung der Stakeholder-Anforderungen | Dokumentiert die Entscheidungen und Einschränkungen jeder Rolle in einer dedizierten Datei im Verlauf der Sitzung |
| PSP-basierte Codebeispiele | Jedes Codebeispiel ist real und ausführbar, abgeleitet von verifiziertem PSP-Referenzinhalt, niemals Pseudocode |
| Spezialistenreviews | Acht Unter-Agenten antworten mit genehmigen, markieren oder blockieren, mit Begründung, an den entscheidenden Stellen |
| Implementation Brief | Ein einzelnes schriftliches Ergebnis, das Entscheidungen, Code, offene Punkte und alles Unverifizierte abdeckt |
| Erweiterbar für neue PSPs | Fügen Sie einen neuen PSP hinzu, indem Sie der bestehenden `psps/<name>/`-Struktur folgen, keine Änderungen an den Kernanweisungen nötig |

---

## Ablauf einer Sitzung

```
/start-session
      |
      v
  Scoping und Einschränkungen  ->  Stakeholder-Anforderungen (eine Rolle nach der anderen)
      |
      v
  /validate-context  ->  PSP-Referenzinhalte gegen autoritative Quellen prüfen
      |
      v
  Kernzahlungen -> Webhooks -> Plattform / Terminal / Kartenausgabe (je nach Umfang)
      |
      v
  Spezialistenreviews (genehmigen / markieren / blockieren)
      |
      v
/wrap-up  ->  Brief + Detaillierter Leitfaden + Go-Live-Checkliste (outputs/<engagement>/)
```

---

## Unterstützte PSPs

| PSP | Status | Produktlinien |
|---|---|---|
| Stripe | Verfügbar | Zahlungen, Plattform (Connect), Terminal, Kartenausgabe (Issuing) |

Weitere PSPs sind geplant. Um einen anzufordern oder beizutragen, eröffnen Sie eine Issue oder Pull Request.

---

## Voraussetzungen

- Einer der unterstützten KI-Programmieragenten: Claude Code, Google Antigravity, AWS Kiro oder Mistral Vibe. Siehe `setup/other-agents.md` für werkzeugspezifische Hinweise
- Ein unterstützter PSP (v1: nur Stripe)
- Stripe-Test-API-Schlüssel (publishable + secret)

---

## Erste Schritte (vier Schritte)

### 1. Repository klonen und Verzeichnis betreten

```bash
git clone https://github.com/cmendezs/payment-foundry.git
cd payment-foundry
```

### 2. Umgebung einrichten

```bash
cp .env.example .env
# Öffnen Sie .env und tragen Sie Ihre Stripe-Testschlüssel ein
# Siehe setup/environment-keys.md für Details
```

### 3. Checkliste für die erste Sitzung lesen

Öffnen Sie `setup/first-session-checklist.md` und arbeiten Sie sie vor Ihrer ersten Sitzung durch. Das dauert etwa zehn Minuten und verhindert die häufigsten Einrichtungsprobleme.

### 4. Starten und Engagement beginnen

```bash
claude
```

Dann in der Claude Code Sitzung:

```
/start-session
```

Sie verwenden stattdessen Google Antigravity, AWS Kiro oder Mistral Vibe? Der gleiche Ablauf mit `/start-session`, `/validate-context` und `/wrap-up` ist in jedem dieser Tools verfügbar, siehe `setup/other-agents.md` für die entsprechenden Startschritte und Skill-Speicherorte.

---

## Slash-Befehle

Drei Befehle decken den gesamten Engagement-Lebenszyklus ab.

| Befehl | Wann ausführen | Was er bewirkt |
|---|---|---|
| `/start-session` | Zu Beginn jedes Engagements | Identifiziert den PSP, definiert den Umfang des Engagements, erfasst Stakeholder-Anforderungen Rolle für Rolle und schlägt die Implementierungsreihenfolge vor |
| `/validate-context` | Nach `/start-session`, bevor die Implementierung beginnt | Prüft die PSP-spezifischen Fakten im Umfang (Status, Preise, Fähigkeitsbeschränkungen, Header-Strings, API-Versionen) gegen die autoritativen Quellen des PSP und dokumentiert, was verifiziert, unverifiziert oder blockiert ist |
| `/wrap-up` | Am Ende des Engagements | Sammelt offene Punkte, dokumentiert die Ergebnisse der Unter-Agenten und erstellt drei Artefakte unter `outputs/<engagement>/`: einen exekutiven Implementation Brief, einen codeorientierten Detaillierten Implementierungsleitfaden und eine Go-Live-Bereitschaftscheckliste |

Alles zwischen `/start-session` und `/wrap-up` wird vom Engagement Manager im Gespräch gesteuert: Implementierungsberatung, Codebeispiele und Spezialistenreviews bei anfallenden Entscheidungen.

---

## Wie eine Sitzung funktioniert

Ein typisches Engagement durchläuft diese Phasen der Reihe nach:

1. **Scoping** : Anwendungsfall, Tech-Stack, Märkte, Währungen, Zeitplan, Teamgröße
2. **Stakeholder-Anforderungen** : Leiter Zahlungsverkehr, Compliance, Betrugsbekämpfung, Backend, Frontend, Architektur, Sicherheit, Finanzen, im Gespräch erfasst und als Referenzdateien gespeichert
3. **Kontextvalidierung** : `/validate-context` prüft die PSP-spezifischen Fakten im Umfang gegen autoritative Quellen und dokumentiert verifizierte, unverifizierte und blockierte Elemente
4. **Kernzahlungen** : Payment Intents, Zahlungsoberfläche, Bestätigungsverarbeitung
5. **Webhooks** : Ereignisverarbeitung, Bestellstatus-Abgleich, Wiederholungen
6. **Plattformflüsse** (falls zutreffend) : Connect, Mehrteilnehmer-Auszahlungen
7. **Vor-Ort-Flüsse** (falls zutreffend) : Terminal, Lesegerätverwaltung
8. **Kartenausgabe** (falls zutreffend) : ausgegebene Karten, Ausgabenkontrollen, Autorisierungen
9. **Spezialistenreviews** : jeder Unter-Agent lädt seine Anforderungsdatei, prüft die relevanten Entscheidungen und gibt ein Ergebnis ab: genehmigen / markieren / blockieren mit Begründung
10. **Engagement-Artefakte** : exekutiver Implementation Brief, codeorientierter Detaillierter Implementierungsleitfaden und Go-Live-Bereitschaftscheckliste pro Engagement

Der Engagement Manager schlägt diese Reihenfolge zu Beginn vor und passt sie an das an, was für Ihr Team tatsächlich im Umfang liegt.

---

## Spezialisten-Unter-Agenten

Acht Spezialisten stehen für die bereichsübergreifende Prüfung zur Verfügung. Der Engagement Manager ruft sie an den richtigen Entscheidungspunkten auf: Sie müssen sie nicht direkt ansprechen.

| Spezialist | Prüfungsbereich |
|---|---|
| Leiter Zahlungsverkehr | KPI-Überwachung, Migrationsrisiko, operative Governance |
| Compliance-Beauftragter | PCI-Umfang, SCA/3DS2, Datenresidenz, Audit-Trail |
| Betrugsbeauftragter | Risikoregeln, 3DS-Strategie, Streitfall- und Rückbuchungsprozess |
| Sicherheitsbeauftragter | Geheimnisverwaltung, Webhook-Signaturvalidierung, Betrugskontrollen |
| Lösungsarchitekt | Integrationsmuster, Fehlermodi, Skalierbarkeit |
| Frontend-Entwickler | Zahlungs-UX, Fehlerbehandlung, Barrierefreiheit, Lokalisierung |
| Backend-Entwickler | Idempotenz, Webhook-Verarbeitung, Wiederholungen, Abgleich |
| Finanzen und Treasury | Abrechnung, Mehrwährungsfähigkeit, Auszahlungen, Reporting, Steuern |

Jeder Spezialist gibt ein Ergebnis ab: **genehmigen**, **markieren** (unter Bedingungen fortfahren) oder **blockieren** (stoppen bis zur Lösung). Der Engagement Manager hilft Ihnen, Markierungen und Blockierungen zu klären, bevor es weitergeht.

---

## Projektstruktur

```
payment-foundry/
├── README.md                        # Sie sind hier
├── CLAUDE.md                        # Anweisungen des Engagement Managers
├── AGENTS.md                        # Gemeinsamer Anweisungszeiger, gelesen von Mistral Vibe, AWS Kiro und anderen AGENTS.md-kompatiblen Tools
├── .env.example                     # Nach .env kopieren und Schlüssel eintragen
│
├── setup/                           # Einmalig vor der ersten Sitzung ausführen
│   ├── installation-guide.md
│   ├── first-session-checklist.md
│   ├── environment-keys.md
│   └── other-agents.md              # Hinweise pro Tool: Claude Code, Antigravity, Kiro, Vibe
│
├── skills/
│   └── payment-foundry/             # Quelle der Wahrheit für die drei Skills
│       ├── start-session/SKILL.md      # Befehl /start-session
│       ├── validate-context/SKILL.md   # Befehl /validate-context
│       └── wrap-up/SKILL.md            # Befehl /wrap-up
│
├── scripts/
│   └── setup-agents.sh              # Verteilt skills/payment-foundry/ an jedes Tool unten
│
├── .claude/skills/                  # Claude Code Kopie (erzeugt von scripts/setup-agents.sh)
├── .agents/skills/payment-foundry/  # Google Antigravity / AWS Kiro Kopie (erzeugt von scripts/setup-agents.sh)
├── .vibe/agents/payment-foundry.toml # Mistral Vibe Unter-Agent-Profil (erzeugt von scripts/setup-agents.sh)
│
├── sub-agents/                      # Definitionen der Spezialisten
│   ├── README.md                    # Aufrufprozedur
│   ├── head-of-payments.md
│   ├── compliance-officer.md
│   ├── fraud-officer.md
│   ├── security-officer.md
│   ├── solution-architect.md
│   ├── frontend-developer.md
│   ├── backend-developer.md
│   └── finance-treasury.md
│
├── psps/                            # PSP-Referenzinhalte, zur Laufzeit geladen
│   └── stripe/
│       ├── README.md                # Index: welche Datei was abdeckt
│       ├── payments.md
│       ├── platform.md
│       ├── terminal.md
│       └── issuing.md
│
├── context/                         # Scoping- und Anforderungsvorlagen
│   ├── business-info.md              # Scoping-Leitfaden /start-session
│   ├── go-live-checklist-template.md # Quellvorlage für die Go-Live-Checkliste
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
    ├── <engagement>-*-requirements.md      # Pro Sitzung und Rolle erfasst
    ├── <engagement>-context-validation.md  # Erstellt von /validate-context
    └── <engagement>/                       # Ordner pro Engagement, erstellt von /wrap-up
        ├── implementation-brief.md         # Exekutive Ebene
        ├── implementation-detailed.md      # Entwicklerhandbuch mit Code
        └── go-live-checklist.md            # Angepasst aus der Vorlage
```

Unternehmensinformationen befinden sich in `context/business-info.md` und werden über Engagements hinweg direkt aktualisiert, niemals pro Engagement kopiert.

---

## Einen neuen PSP hinzufügen

Erstellen Sie einen Ordner unter `psps/<name>/` mit einer `README.md`-Indexdatei und einer Datei pro Produktlinie. Folgen Sie der gleichen Struktur wie `psps/stripe/`. Keine Änderungen an `CLAUDE.md` oder `sub-agents/` erforderlich.

---

## Lizenz

Dieses Projekt ist unter der Apache License 2.0 lizenziert. Siehe die Datei `LICENSE` für Details.
