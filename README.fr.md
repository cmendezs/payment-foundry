# Payment Foundry

[English](README.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Português](README.pt.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

Un alignement transversal, pas juste du code.

---

## Qu'est-ce que c'est

La plupart des assistants IA de développement génèrent une intégration PSP directement à partir d'un prompt : un formulaire de paiement, un gestionnaire de webhooks, terminé. Le code peut fonctionner, mais les décisions sous-jacentes (périmètre PCI, règles de fraude, devise de règlement, stratégie de relance) n'ont jamais été réellement prises par les personnes concernées.

Payment Foundry propose un engagement structuré à la place. Un agent IA de niveau senior (le Responsable d'Engagement) guide votre équipe technique du cadrage à l'implémentation, et capture en chemin les exigences des rôles qui devront vivre avec le résultat : Conformité, Fraude, Sécurité, Finance, Backend, Frontend, Architecture et le Responsable des Paiements.

Une session. Huit perspectives. Un Brief d'Implémentation que vos ingénieurs peuvent exécuter.

---

## Ce que vous obtenez

| Capacité | Ce que cela fait |
|---|---|
| Flux d'engagement structuré | Guide votre équipe à travers le cadrage, les exigences, l'implémentation et la revue dans un ordre fixe et logique |
| Capture des exigences des parties prenantes | Enregistre les décisions et contraintes de chaque rôle dans un fichier dédié au fur et à mesure de la session |
| Exemples de code ancrés sur le PSP | Chaque exemple de code est réel et exécutable, adapté à partir de contenu de référence PSP vérifié, jamais du pseudocode |
| Revues de spécialistes | Huit sous-agents répondent approuver, signaler ou bloquer, avec justification, aux points de décision critiques |
| Brief d'Implémentation | Un livrable écrit unique couvrant les décisions, le code, les points ouverts et tout ce qui est non vérifié |
| Extensible à de nouveaux PSPs | Ajoutez un nouveau PSP en suivant la structure existante `psps/<nom>/`, aucune modification des instructions principales nécessaire |

---

## Déroulement d'une session

```
/start-session
      |
      v
  Cadrage et contraintes  ->  Exigences des parties prenantes (un rôle à la fois)
      |
      v
  /validate-context  ->  Vérifier le contenu de référence PSP par rapport aux sources officielles
      |
      v
  Paiements principaux -> Webhooks -> Plateforme / Terminal / Émission de cartes (selon le périmètre)
      |
      v
  Revues de spécialistes (approuver / signaler / bloquer)
      |
      v
/wrap-up  ->  Brief + Guide détaillé + Checklist de mise en production (outputs/<engagement>/)
```

---

## PSPs supportés

| PSP | Statut | Lignes de produits |
|---|---|---|
| Stripe | Disponible | Paiements, Plateforme (Connect), Terminal, Émission de cartes (Issuing) |

D'autres PSPs sont prévus. Pour en demander un ou contribuer, ouvrez une issue ou une pull request.

---

## Prérequis

- Un des agents IA de développement supportés : Claude Code, Google Antigravity, AWS Kiro ou Mistral Vibe. Voir `setup/other-agents.md` pour les notes de configuration par outil
- Un PSP supporté (v1 : Stripe uniquement)
- Clés API Stripe de test (publishable + secret)

---

## Démarrage rapide (quatre étapes)

### 1. Cloner et accéder au répertoire

```bash
git clone https://github.com/cmendezs/payment-foundry.git
cd payment-foundry
```

### 2. Configurer votre environnement

```bash
cp .env.example .env
# Ouvrez .env et renseignez vos clés de test Stripe
# Voir setup/environment-keys.md pour plus de détails
```

### 3. Lire la checklist de première session

Ouvrez `setup/first-session-checklist.md` et suivez-la avant votre première session. Cela prend environ dix minutes et prévient les problèmes de configuration les plus courants.

### 4. Lancer et démarrer votre engagement

```bash
claude
```

Puis dans la session Claude Code :

```
/start-session
```

Vous utilisez Google Antigravity, AWS Kiro ou Mistral Vibe à la place ? Le même flux `/start-session`, `/validate-context` et `/wrap-up` est disponible dans chacun d'eux, voir `setup/other-agents.md` pour les étapes de lancement équivalentes et les emplacements des compétences.

---

## Commandes Slash

Trois commandes couvrent l'ensemble du cycle de vie de l'engagement.

| Commande | Quand l'exécuter | Ce qu'elle fait |
|---|---|---|
| `/start-session` | Au début de chaque engagement | Identifie le PSP, définit le périmètre de l'engagement, capture les exigences des parties prenantes un rôle à la fois, et propose la séquence d'implémentation |
| `/validate-context` | Après `/start-session`, avant le début de l'implémentation | Vérifie les faits spécifiques au PSP dans le périmètre (statut, tarification, restrictions de capacités, chaînes d'en-tête, versions d'API) par rapport aux sources officielles du PSP, et enregistre ce qui est vérifié, non vérifié ou bloqué |
| `/wrap-up` | À la fin de l'engagement | Collecte les points ouverts, documente les résultats des sous-agents, et produit trois artefacts sous `outputs/<engagement>/` : un Brief d'Implémentation exécutif, un Guide d'Implémentation Détaillé orienté code, et une Checklist de Préparation à la Mise en Production |

Tout ce qui se passe entre `/start-session` et `/wrap-up` est géré de manière conversationnelle par le Responsable d'Engagement : conseils d'implémentation, exemples de code et revues de spécialistes au fil des décisions.

---

## Comment fonctionne une session

Un engagement typique passe par ces étapes dans l'ordre :

1. **Cadrage** : cas d'usage, stack technique, marchés, devises, calendrier, taille de l'équipe
2. **Exigences des parties prenantes** : Responsable des Paiements, Conformité, Fraude, Backend, Frontend, Architecture, Sécurité, Finance, capturées de manière conversationnelle et sauvegardées comme fichiers de référence
3. **Validation du contexte** : `/validate-context` vérifie les faits spécifiques au PSP dans le périmètre par rapport aux sources officielles et enregistre les éléments vérifiés, non vérifiés et bloqués
4. **Paiements principaux** : Payment Intents, interface de paiement, gestion de la confirmation
5. **Webhooks** : gestion des événements, réconciliation de l'état des commandes, relances
6. **Flux plateforme** (si applicable) : Connect, paiements multi-parties
7. **Flux en personne** (si applicable) : Terminal, gestion des lecteurs
8. **Émission de cartes** (si applicable) : cartes émises, contrôles de dépenses, autorisations
9. **Revues de spécialistes** : chaque sous-agent charge son fichier d'exigences, examine les décisions pertinentes et produit un résultat approuver / signaler / bloquer avec justification
10. **Artefacts de l'engagement** : Brief d'Implémentation exécutif, Guide d'Implémentation Détaillé orienté code, et Checklist de Préparation à la Mise en Production par engagement

Le Responsable d'Engagement propose cette séquence au démarrage et l'adapte à ce qui est réellement dans le périmètre de votre équipe.

---

## Sous-agents spécialistes

Huit spécialistes sont disponibles pour la revue transversale. Le Responsable d'Engagement les invoque aux bons points de décision : vous n'avez pas besoin de les appeler directement.

| Spécialiste | Domaine de revue |
|---|---|
| Responsable des Paiements | Suivi des KPI, risque de migration, gouvernance opérationnelle |
| Responsable Conformité | Périmètre PCI, SCA/3DS2, résidence des données, piste d'audit |
| Responsable Fraude | Règles de risque, stratégie 3DS, processus de litiges et de rétrofacturation |
| Responsable Sécurité | Gestion des secrets, validation des signatures webhook, contrôles anti-fraude |
| Architecte Solution | Patterns d'intégration, modes de défaillance, scalabilité |
| Développeur Frontend | UX de paiement, gestion des erreurs, accessibilité, localisation |
| Développeur Backend | Idempotence, traitement des webhooks, relances, réconciliation |
| Finance et Trésorerie | Règlement, multi-devises, virements, reporting, fiscalité |

Chaque spécialiste produit un résultat : **approuver**, **signaler** (poursuivre sous conditions) ou **bloquer** (arrêter jusqu'à résolution). Le Responsable d'Engagement vous aide à résoudre les signalements et les blocages avant de passer à la suite.

---

## Structure du projet

```
payment-foundry/
├── README.md                        # Vous êtes ici
├── CLAUDE.md                        # Instructions du Responsable d'Engagement
├── AGENTS.md                        # Pointeur d'instructions partagées, lu par Mistral Vibe, AWS Kiro et autres outils compatibles AGENTS.md
├── .env.example                     # Copier vers .env et renseigner vos clés
│
├── setup/                           # À exécuter une fois avant votre première session
│   ├── installation-guide.md
│   ├── first-session-checklist.md
│   ├── environment-keys.md
│   └── other-agents.md              # Notes par outil : Claude Code, Antigravity, Kiro, Vibe
│
├── skills/
│   └── payment-foundry/             # Source de vérité pour les trois compétences
│       ├── start-session/SKILL.md      # Commande /start-session
│       ├── validate-context/SKILL.md   # Commande /validate-context
│       └── wrap-up/SKILL.md            # Commande /wrap-up
│
├── scripts/
│   └── setup-agents.sh              # Distribue skills/payment-foundry/ vers chaque outil ci-dessous
│
├── .claude/skills/                  # Copie Claude Code (générée par scripts/setup-agents.sh)
├── .agents/skills/payment-foundry/  # Copie Google Antigravity / AWS Kiro (générée par scripts/setup-agents.sh)
├── .vibe/agents/payment-foundry.toml # Profil de sous-agent Mistral Vibe (généré par scripts/setup-agents.sh)
│
├── sub-agents/                      # Définitions des spécialistes
│   ├── README.md                    # Procédure d'invocation
│   ├── head-of-payments.md
│   ├── compliance-officer.md
│   ├── fraud-officer.md
│   ├── security-officer.md
│   ├── solution-architect.md
│   ├── frontend-developer.md
│   ├── backend-developer.md
│   └── finance-treasury.md
│
├── psps/                            # Contenu de référence PSP, chargé à l'exécution
│   └── stripe/
│       ├── README.md                # Index : quel fichier couvre quoi
│       ├── payments.md
│       ├── platform.md
│       ├── terminal.md
│       └── issuing.md
│
├── context/                         # Modèles de cadrage et d'exigences
│   ├── business-info.md              # Guide de cadrage /start-session
│   ├── go-live-checklist-template.md # Modèle source pour la checklist de mise en production
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
    ├── <engagement>-*-requirements.md      # Capturés par session, par rôle
    ├── <engagement>-context-validation.md  # Produit par /validate-context
    └── <engagement>/                       # Dossier par engagement, produit par /wrap-up
        ├── implementation-brief.md         # Couche exécutive
        ├── implementation-detailed.md      # Manuel développeur avec code
        └── go-live-checklist.md            # Adapté à partir du modèle
```

Les informations de l'entreprise se trouvent dans `context/business-info.md` et sont mises à jour sur place à travers les engagements, jamais copiées par engagement.

---

## Ajouter un nouveau PSP

Créez un dossier sous `psps/<nom>/` avec un `README.md` index et un fichier par ligne de produits. Suivez la même structure que `psps/stripe/`. Aucune modification de `CLAUDE.md` ou de `sub-agents/` n'est nécessaire.

---

## Licence

Ce projet est sous licence Apache License 2.0. Voir le fichier `LICENSE` pour plus de détails.
