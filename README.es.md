# Payment Foundry

[English](README.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Português](README.pt.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

Alineación interfuncional, no solo código.

---

## Qué es esto

La mayoría de los asistentes de programación con IA generan una integración PSP directamente desde un prompt: un formulario de pago, un manejador de webhooks, listo. El código puede funcionar, pero las decisiones detrás de él (alcance PCI, reglas de fraude, moneda de liquidación, estrategia de reintentos) nunca fueron realmente tomadas por las personas responsables.

Payment Foundry ejecuta un engagement estructurado en su lugar. Un agente IA de nivel senior (el Engagement Manager) guía a su equipo técnico desde el alcance hasta la implementación, y en el camino captura los requisitos de los roles que tendrán que vivir con el resultado: Cumplimiento, Fraude, Seguridad, Finanzas, Backend, Frontend, Arquitectura y el Responsable de Pagos.

Una sesión. Ocho perspectivas. Un Implementation Brief que sus ingenieros pueden ejecutar.

---

## Qué obtiene

| Capacidad | Qué hace |
|---|---|
| Flujo de engagement estructurado | Guía a su equipo a través del alcance, requisitos, implementación y revisión en un orden fijo y lógico |
| Captura de requisitos de los interesados | Registra las decisiones y restricciones de cada rol en un archivo dedicado a medida que avanza la sesión |
| Ejemplos de código basados en el PSP | Cada ejemplo de código es real y ejecutable, adaptado de contenido de referencia PSP verificado, nunca pseudocódigo |
| Revisiones de especialistas | Ocho sub-agentes responden aprobar, señalar o bloquear, con justificación, en los puntos de decisión críticos |
| Implementation Brief | Un único entregable escrito que cubre decisiones, código, puntos abiertos y todo lo no verificado |
| Extensible a nuevos PSPs | Agregue un nuevo PSP siguiendo la estructura existente `psps/<nombre>/`, sin cambios en las instrucciones principales |

---

## Cómo se desarrolla una sesión

```
/start-session
      |
      v
  Alcance y restricciones  ->  Requisitos de los interesados (un rol a la vez)
      |
      v
  /validate-context  ->  Verificar el contenido de referencia PSP contra fuentes oficiales
      |
      v
  Pagos principales -> Webhooks -> Plataforma / Terminal / Emisión de tarjetas (según el alcance)
      |
      v
  Revisiones de especialistas (aprobar / señalar / bloquear)
      |
      v
/wrap-up  ->  Brief + Guía detallada + Checklist de puesta en producción (outputs/<engagement>/)
```

---

## PSPs soportados

| PSP | Estado | Líneas de producto |
|---|---|---|
| Stripe | Disponible | Pagos, Plataforma (Connect), Terminal, Emisión de tarjetas (Issuing) |

Se planean más PSPs. Para solicitar uno o contribuir, abra una issue o pull request.

---

## Requisitos previos

- Uno de los agentes IA de programación soportados: Claude Code, Google Antigravity, AWS Kiro o Mistral Vibe. Ver `setup/other-agents.md` para notas de configuración por herramienta
- Un PSP soportado (v1: solo Stripe)
- Claves API de prueba de Stripe (publishable + secret)

---

## Inicio rápido (cuatro pasos)

### 1. Clonar y acceder al directorio

```bash
git clone https://github.com/cmendezs/payment-foundry.git
cd payment-foundry
```

### 2. Configurar su entorno

```bash
cp .env.example .env
# Abra .env y complete sus claves de prueba de Stripe
# Ver setup/environment-keys.md para más detalles
```

### 3. Leer la checklist de primera sesión

Abra `setup/first-session-checklist.md` y complétela antes de su primera sesión. Toma aproximadamente diez minutos y previene los problemas de configuración más comunes.

### 4. Iniciar y comenzar su engagement

```bash
claude
```

Luego en la sesión de Claude Code:

```
/start-session
```

¿Usa Google Antigravity, AWS Kiro o Mistral Vibe en su lugar? El mismo flujo `/start-session`, `/validate-context` y `/wrap-up` está disponible en cada uno de ellos, ver `setup/other-agents.md` para los pasos de inicio equivalentes y las ubicaciones de los skills.

---

## Comandos Slash

Tres comandos cubren todo el ciclo de vida del engagement.

| Comando | Cuándo ejecutarlo | Qué hace |
|---|---|---|
| `/start-session` | Al inicio de cada engagement | Identifica el PSP, define el alcance del engagement, captura los requisitos de los interesados rol por rol y propone la secuencia de implementación |
| `/validate-context` | Después de `/start-session`, antes de que comience la implementación | Verifica los hechos específicos del PSP en el alcance (estado, precios, restricciones de capacidad, cadenas de encabezado, versiones de API) contra las fuentes oficiales del PSP y registra lo que está verificado, no verificado o bloqueado |
| `/wrap-up` | Al final del engagement | Recopila los puntos abiertos, documenta los resultados de los sub-agentes y produce tres artefactos bajo `outputs/<engagement>/`: un Implementation Brief ejecutivo, una Guía de Implementación Detallada orientada al código y una Checklist de Preparación para la Puesta en Producción |

Todo lo que ocurre entre `/start-session` y `/wrap-up` es gestionado de forma conversacional por el Engagement Manager: orientación de implementación, ejemplos de código y revisiones de especialistas a medida que surgen decisiones.

---

## Cómo funciona una sesión

Un engagement típico pasa por estas etapas en orden:

1. **Alcance** : caso de uso, stack tecnológico, mercados, monedas, cronograma, tamaño del equipo
2. **Requisitos de los interesados** : Responsable de Pagos, Cumplimiento, Fraude, Backend, Frontend, Arquitectura, Seguridad, Finanzas, capturados de forma conversacional y guardados como archivos de referencia
3. **Validación del contexto** : `/validate-context` verifica los hechos específicos del PSP en el alcance contra fuentes oficiales y registra los elementos verificados, no verificados y bloqueados
4. **Pagos principales** : Payment Intents, interfaz de pago, manejo de confirmación
5. **Webhooks** : manejo de eventos, reconciliación del estado de pedidos, reintentos
6. **Flujos de plataforma** (si aplica) : Connect, pagos multi-parte
7. **Flujos presenciales** (si aplica) : Terminal, gestión de lectores
8. **Emisión de tarjetas** (si aplica) : tarjetas emitidas, controles de gasto, autorizaciones
9. **Revisiones de especialistas** : cada sub-agente carga su archivo de requisitos, examina las decisiones pertinentes y produce un resultado aprobar / señalar / bloquear con justificación
10. **Artefactos del engagement** : Implementation Brief ejecutivo, Guía de Implementación Detallada orientada al código y Checklist de Preparación para la Puesta en Producción por engagement

El Engagement Manager propone esta secuencia al inicio y la adapta a lo que está realmente en el alcance de su equipo.

---

## Sub-agentes especialistas

Ocho especialistas están disponibles para la revisión interfuncional. El Engagement Manager los invoca en los puntos de decisión adecuados: usted no necesita llamarlos directamente.

| Especialista | Ámbito de revisión |
|---|---|
| Responsable de Pagos | Monitoreo de KPIs, riesgo de migración, gobernanza operativa |
| Responsable de Cumplimiento | Alcance PCI, SCA/3DS2, residencia de datos, pista de auditoría |
| Responsable de Fraude | Reglas de riesgo, estrategia 3DS, proceso de disputas y contracargos |
| Responsable de Seguridad | Gestión de secretos, validación de firmas webhook, controles antifraude |
| Arquitecto de Soluciones | Patrones de integración, modos de fallo, escalabilidad |
| Desarrollador Frontend | UX de pago, manejo de errores, accesibilidad, localización |
| Desarrollador Backend | Idempotencia, procesamiento de webhooks, reintentos, reconciliación |
| Finanzas y Tesorería | Liquidación, multi-moneda, pagos, reportes, impuestos |

Cada especialista produce un resultado: **aprobar**, **señalar** (proceder con condiciones) o **bloquear** (detener hasta la resolución). El Engagement Manager le ayuda a resolver las señalizaciones y los bloqueos antes de continuar.

---

## Estructura del proyecto

```
payment-foundry/
├── README.md                        # Usted está aquí
├── CLAUDE.md                        # Instrucciones del Engagement Manager
├── AGENTS.md                        # Puntero de instrucciones compartidas, leído por Mistral Vibe, AWS Kiro y otras herramientas compatibles con AGENTS.md
├── .env.example                     # Copiar a .env y completar sus claves
│
├── setup/                           # Ejecutar una vez antes de su primera sesión
│   ├── installation-guide.md
│   ├── first-session-checklist.md
│   ├── environment-keys.md
│   └── other-agents.md              # Notas por herramienta: Claude Code, Antigravity, Kiro, Vibe
│
├── skills/
│   └── payment-foundry/             # Fuente de verdad para los tres skills
│       ├── start-session/SKILL.md      # Comando /start-session
│       ├── validate-context/SKILL.md   # Comando /validate-context
│       └── wrap-up/SKILL.md            # Comando /wrap-up
│
├── scripts/
│   └── setup-agents.sh              # Distribuye skills/payment-foundry/ a cada herramienta a continuación
│
├── .claude/skills/                  # Copia de Claude Code (generada por scripts/setup-agents.sh)
├── .agents/skills/payment-foundry/  # Copia de Google Antigravity / AWS Kiro (generada por scripts/setup-agents.sh)
├── .vibe/agents/payment-foundry.toml # Perfil de sub-agente Mistral Vibe (generado por scripts/setup-agents.sh)
│
├── sub-agents/                      # Definiciones de los especialistas
│   ├── README.md                    # Procedimiento de invocación
│   ├── head-of-payments.md
│   ├── compliance-officer.md
│   ├── fraud-officer.md
│   ├── security-officer.md
│   ├── solution-architect.md
│   ├── frontend-developer.md
│   ├── backend-developer.md
│   └── finance-treasury.md
│
├── psps/                            # Contenido de referencia PSP, cargado en tiempo de ejecución
│   └── stripe/
│       ├── README.md                # Índice: qué archivo cubre qué
│       ├── payments.md
│       ├── platform.md
│       ├── terminal.md
│       └── issuing.md
│
├── context/                         # Plantillas de alcance y requisitos
│   ├── business-info.md              # Guía de alcance /start-session
│   ├── go-live-checklist-template.md # Plantilla fuente para la checklist de puesta en producción
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
    ├── <engagement>-*-requirements.md      # Capturados por sesión, por rol
    ├── <engagement>-context-validation.md  # Producido por /validate-context
    └── <engagement>/                       # Carpeta por engagement, producida por /wrap-up
        ├── implementation-brief.md         # Capa ejecutiva
        ├── implementation-detailed.md      # Manual del desarrollador con código
        └── go-live-checklist.md            # Adaptado de la plantilla
```

La información de la empresa se encuentra en `context/business-info.md` y se actualiza en el mismo lugar a través de los engagements, nunca se copia por engagement.

---

## Agregar un nuevo PSP

Cree una carpeta bajo `psps/<nombre>/` con un `README.md` índice y un archivo por línea de producto. Siga la misma estructura que `psps/stripe/`. No se necesitan cambios en `CLAUDE.md` ni en `sub-agents/`.

---

## Licencia

Este proyecto está licenciado bajo la Apache License 2.0. Ver el archivo `LICENSE` para más detalles.
