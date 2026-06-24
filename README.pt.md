# Payment Foundry

[English](README.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Português](README.pt.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

Alinhamento multifuncional, não apenas código.

---

## O que é isto

A maioria dos assistentes de programação com IA gera uma integração PSP diretamente a partir de um prompt: um formulário de pagamento, um handler de webhooks, pronto. O código pode funcionar, mas as decisões por trás dele (escopo PCI, regras de fraude, moeda de liquidação, estratégia de retry) nunca foram realmente tomadas pelas pessoas responsáveis.

Payment Foundry conduz um engagement estruturado em vez disso. Um agente IA de nível sénior (o Engagement Manager) guia a sua equipa técnica desde o scoping até à implementação, e ao longo do caminho captura os requisitos dos papéis que terão de conviver com o resultado: Conformidade, Fraude, Segurança, Finanças, Backend, Frontend, Arquitetura e o Responsável de Pagamentos.

Uma sessão. Oito perspetivas. Um Implementation Brief que os seus engenheiros podem executar.

---

## O que obtém

| Capacidade | O que faz |
|---|---|
| Fluxo de engagement estruturado | Guia a sua equipa através do scoping, requisitos, implementação e revisão numa ordem fixa e lógica |
| Captura de requisitos dos stakeholders | Regista as decisões e restrições de cada papel num ficheiro dedicado à medida que a sessão progride |
| Exemplos de código baseados no PSP | Cada exemplo de código é real e executável, adaptado de conteúdo de referência PSP verificado, nunca pseudocódigo |
| Revisões de especialistas | Oito sub-agentes respondem aprovar, sinalizar ou bloquear, com justificação, nos pontos de decisão críticos |
| Implementation Brief | Um único entregável escrito que cobre decisões, código, pontos em aberto e tudo o que não está verificado |
| Extensível a novos PSPs | Adicione um novo PSP seguindo a estrutura existente `psps/<nome>/`, sem alterações nas instruções principais |

---

## Como decorre uma sessão

```
/start-session
      |
      v
  Scoping e restrições  ->  Requisitos dos stakeholders (um papel de cada vez)
      |
      v
  /validate-context  ->  Verificar o conteúdo de referência PSP contra fontes oficiais
      |
      v
  Pagamentos principais -> Webhooks -> Produtos e Preços -> Impostos -> Plataforma -> Capital
                                            -> Terminal -> Emissão de cartões -> Treasury -> Stablecoins -> Crypto Onramp (conforme o escopo)
      |
      v
  Revisões de especialistas (aprovar / sinalizar / bloquear)
      |
      v
/wrap-up  ->  Brief + Guia detalhado + Checklist de go-live (outputs/<engagement>/)
```

---

## PSPs suportados

| PSP | Estado | Linhas de produto |
|---|---|---|
| Stripe | Disponível | Pagamentos (incl. Payment Links), Produtos e Preços, Billing, Impostos, Plataforma (Connect), Capital, Terminal, Emissão de cartões (Issuing), Treasury, Stablecoins, Crypto Onramp, Fraude e Disputas (Radar), Relatórios |

Mais PSPs estão planeados. Para solicitar um ou contribuir, abra uma issue ou pull request.

---

## Pré-requisitos

- Um dos agentes IA de programação suportados: Claude Code, Google Antigravity, AWS Kiro ou Mistral Vibe. Ver `setup/other-agents.md` para notas de configuração por ferramenta
- Um PSP suportado (v1: apenas Stripe)
- Chaves API de teste do Stripe (publishable + secret)

---

## Início rápido (quatro passos)

### 1. Clonar e aceder ao diretório

```bash
git clone https://github.com/cmendezs/payment-foundry.git
cd payment-foundry
```

### 2. Configurar o seu ambiente

```bash
cp .env.example .env
# Abra .env e preencha as suas chaves de teste do Stripe
# Ver setup/environment-keys.md para mais detalhes
```

### 3. Ler a checklist da primeira sessão

Abra `setup/first-session-checklist.md` e complete-a antes da sua primeira sessão. Demora cerca de dez minutos e previne os problemas de configuração mais comuns.

### 4. Lançar e iniciar o seu engagement

```bash
claude
```

Depois na sessão Claude Code:

```
/start-session
```

Usa Google Antigravity, AWS Kiro ou Mistral Vibe em vez disso? O mesmo fluxo `/start-session`, `/validate-context` e `/wrap-up` está disponível em cada um deles, ver `setup/other-agents.md` para os passos de lançamento equivalentes e as localizações dos skills.

---

## Comandos Slash

Três comandos cobrem todo o ciclo de vida do engagement.

| Comando | Quando executar | O que faz |
|---|---|---|
| `/start-session` | No início de cada engagement | Identifica o PSP, define o escopo do engagement, captura os requisitos dos stakeholders papel por papel e propõe a sequência de implementação |
| `/validate-context` | Após `/start-session`, antes do início da implementação | Verifica os factos específicos do PSP no escopo (estado, preços, restrições de capacidade, strings de cabeçalho, versões da API) contra as fontes oficiais do PSP e regista o que está verificado, não verificado ou bloqueado |
| `/wrap-up` | No final do engagement | Recolhe os pontos em aberto, documenta os resultados dos sub-agentes e produz três artefactos sob `outputs/<engagement>/`: um Implementation Brief executivo, um Guia de Implementação Detalhado orientado ao código e uma Checklist de Preparação para Go-Live |

Tudo o que acontece entre `/start-session` e `/wrap-up` é gerido de forma conversacional pelo Engagement Manager: orientação de implementação, exemplos de código e revisões de especialistas à medida que surgem decisões.

---

## Como funciona uma sessão

Um engagement típico passa por estas fases em ordem:

1. **Scoping** : caso de uso, stack tecnológico, mercados, moedas, cronograma, dimensão da equipa
2. **Requisitos dos stakeholders** : Responsável de Pagamentos, Conformidade, Fraude, Backend, Frontend, Arquitetura, Segurança, Finanças, capturados de forma conversacional e guardados como ficheiros de referência
3. **Validação do contexto** : `/validate-context` verifica os factos específicos do PSP no escopo contra fontes oficiais e regista os elementos verificados, não verificados e bloqueados
4. **Pagamentos principais** : Payment Intents, Payment Element, Payment Links, gestão da confirmação
5. **Webhooks** : gestão de eventos, reconciliação do estado dos pedidos, retries
6. **Catálogo de Produtos e Preços** (se Billing ou Impostos estiverem no escopo) : primitivas de catálogo partilhadas (`Product`, `Price`, `tax_code`, `tax_behavior`, `currency_options`), a definir uma vez antes de qualquer consumidor
7. **Impostos** (se aplicável) : registos, cálculo automático de impostos em Invoices e Checkout, Tax IDs, reverse charge, marketplace facilitator sob Connect
8. **Fluxos de plataforma** (se aplicável) : Connect, pagamentos multi-parte, comissões de plataforma
9. **Capital** (se aplicável) : financiamento oferecido pela plataforma, elegibilidade, divulgações, encaminhamento de reembolsos
10. **Fluxos presenciais** (se aplicável) : Terminal, gestão de leitores, Payment Intents presenciais
11. **Emissão de cartões** (se aplicável) : cartões emitidos, controlos de despesa, webhooks de autorização
12. **Treasury** (se aplicável) : contas financeiras, movimentos de dinheiro, modelo de ledger pending vs. final, emparelhamento com Issuing
13. **Extensões de stablecoin** (se aplicável) : aceitação via Optimized Checkout, saldos stablecoin do Treasury, despesa de cartões Issuing a partir de saldo stablecoin, Open Issuance via Bridge
14. **Crypto Onramp** (se aplicável) : compra fiat-para-cripto integrada, modos de integração e de KYC, Stripe como merchant of record
15. **Revisões de especialistas** : cada sub-agente carrega o seu ficheiro de requisitos, examina as decisões pertinentes e produz um resultado aprovar / sinalizar / bloquear com justificação
16. **Artefactos do engagement** : Implementation Brief executivo, Guia de Implementação Detalhado orientado ao código e Checklist de Preparação para Go-Live por engagement

O Engagement Manager propõe esta sequência no início e adapta-a ao que está efetivamente no escopo da sua equipa.

---

## Sub-agentes especialistas

Oito especialistas estão disponíveis para revisão multifuncional. O Engagement Manager invoca-os nos pontos de decisão adequados: não precisa de os chamar diretamente.

| Especialista | Âmbito de revisão |
|---|---|
| Responsável de Pagamentos | Monitorização de KPIs, risco de migração, governança operacional |
| Responsável de Conformidade | Escopo PCI, SCA/3DS2, residência de dados, trilha de auditoria |
| Responsável de Fraude | Regras de risco, estratégia 3DS, processo de disputas e chargebacks |
| Responsável de Segurança | Gestão de segredos, validação de assinaturas webhook, controlos antifraude |
| Arquiteto de Soluções | Padrões de integração, modos de falha, escalabilidade |
| Desenvolvedor Frontend | UX de pagamento, gestão de erros, acessibilidade, localização |
| Desenvolvedor Backend | Idempotência, processamento de webhooks, retries, reconciliação |
| Finanças e Tesouraria | Liquidação, multi-moeda, pagamentos, relatórios, fiscalidade |

Cada especialista produz um resultado: **aprovar**, **sinalizar** (prosseguir com condições) ou **bloquear** (parar até à resolução). O Engagement Manager ajuda-o a resolver as sinalizações e os bloqueios antes de avançar.

---

## Estrutura do projeto

```
payment-foundry/
├── README.md                        # Está aqui
├── CLAUDE.md                        # Instruções do Engagement Manager
├── AGENTS.md                        # Ponteiro de instruções partilhadas, lido por Mistral Vibe, AWS Kiro e outras ferramentas compatíveis com AGENTS.md
├── .env.example                     # Copiar para .env e preencher as chaves
│
├── setup/                           # Executar uma vez antes da primeira sessão
│   ├── installation-guide.md
│   ├── first-session-checklist.md
│   ├── environment-keys.md
│   └── other-agents.md              # Notas por ferramenta: Claude Code, Antigravity, Kiro, Vibe
│
├── skills/
│   └── payment-foundry/             # Fonte de verdade para os três skills
│       ├── start-session/SKILL.md      # Comando /start-session
│       ├── validate-context/SKILL.md   # Comando /validate-context
│       └── wrap-up/SKILL.md            # Comando /wrap-up
│
├── scripts/
│   └── setup-agents.sh              # Distribui skills/payment-foundry/ para cada ferramenta abaixo
│
├── .claude/skills/                  # Cópia Claude Code (gerada por scripts/setup-agents.sh)
├── .agents/skills/payment-foundry/  # Cópia Google Antigravity / AWS Kiro (gerada por scripts/setup-agents.sh)
├── .vibe/agents/payment-foundry.toml # Perfil de sub-agente Mistral Vibe (gerado por scripts/setup-agents.sh)
│
├── sub-agents/                      # Definições dos especialistas
│   ├── README.md                    # Procedimento de invocação
│   ├── head-of-payments.md
│   ├── compliance-officer.md
│   ├── fraud-officer.md
│   ├── security-officer.md
│   ├── solution-architect.md
│   ├── frontend-developer.md
│   ├── backend-developer.md
│   └── finance-treasury.md
│
├── psps/                            # Conteúdo de referência PSP, carregado em runtime
│   └── stripe/
│       ├── README.md                # Índice: qual ficheiro cobre o quê
│       ├── payments.md              # Payment Intents, Payment Element, Payment Links
│       ├── products-and-prices.md   # Primitivas de catálogo partilhadas (Product, Price, tax_code, tax_behavior)
│       ├── billing.md               # Subscrições, faturação, portal do cliente, dunning
│       ├── tax.md                   # Stripe Tax: registos, impostos automáticos, Tax IDs
│       ├── platform.md              # Connect: Standard / Express / Custom, transferências, payouts
│       ├── capital.md               # Stripe Capital (financiamento Connect para contas ligadas)
│       ├── terminal.md              # Presencial / point-of-sale: leitores, connection tokens
│       ├── issuing.md               # Emissão de cartões: titulares, controlos de despesa, autorizações
│       ├── treasury.md              # Banca integrada (contas financeiras, ACH/wires, OutboundPayments)
│       ├── stablecoins.md           # Transversal: aceitação Optimized Checkout, saldos, Open Issuance
│       ├── crypto-onramp.md         # Compra fiat-para-cripto integrada (Stripe como merchant of record)
│       ├── fraud-and-disputes.md    # Radar (incl. Fraud Teams), 3DS, chargebacks
│       ├── reports.md               # API de relatórios, Activity Report, Sigma
│       └── testing-and-ops.md       # Modo test/live, testes de webhooks, versionamento da API
│
├── context/                         # Modelos de scoping e requisitos
│   ├── business-info.md              # Guia de scoping /start-session
│   ├── go-live-checklist-template.md # Modelo fonte para a checklist de go-live
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
    ├── <engagement>-*-requirements.md      # Capturados por sessão, por papel
    ├── <engagement>-context-validation.md  # Produzido por /validate-context
    └── <engagement>/                       # Pasta por engagement, produzida por /wrap-up
        ├── implementation-brief.md         # Camada executiva
        ├── implementation-detailed.md      # Manual do desenvolvedor com código
        └── go-live-checklist.md            # Adaptado a partir do modelo
```

As informações da empresa encontram-se em `context/business-info.md` e são atualizadas no mesmo local ao longo dos engagements, nunca copiadas por engagement.

---

## Adicionar um novo PSP

Crie uma pasta sob `psps/<nome>/` com um `README.md` índice e um ficheiro por linha de produto. Siga a mesma estrutura que `psps/stripe/`. Nenhuma alteração a `CLAUDE.md` ou `sub-agents/` é necessária.

---

## Licença

Este projeto está licenciado sob a Apache License 2.0. Consulte o ficheiro `LICENSE` para mais detalhes.
