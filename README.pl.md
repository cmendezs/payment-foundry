# Payment Foundry

[English](README.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Português](README.pt.md) | [Polski](README.pl.md) | [العربية](README.ar.md)

Współpraca międzyfunkcyjna, nie tylko kod.

---

## Czym jest ten projekt

Większość asystentów programistycznych AI generuje integrację PSP bezpośrednio z promptu: formularz płatności, handler webhooków, gotowe. Kod może działać, ale decyzje stojące za nim (zakres PCI, reguły oszustw, waluta rozliczeniowa, strategia ponawiania) nigdy nie zostały faktycznie podjęte przez odpowiedzialne osoby.

Payment Foundry prowadzi zamiast tego ustrukturyzowane zaangażowanie. Agent AI na poziomie seniorskim (Engagement Manager) prowadzi Twój zespół techniczny od określania zakresu po implementację, a po drodze zbiera wymagania od ról, które będą musiały żyć z rezultatem: Zgodność, Oszustwa, Bezpieczeństwo, Finanse, Backend, Frontend, Architektura i Kierownik ds. Płatności.

Jedna sesja. Osiem perspektyw. Jeden Implementation Brief, który Twoi inżynierowie mogą zrealizować.

---

## Co otrzymujesz

| Możliwość | Co robi |
|---|---|
| Ustrukturyzowany przebieg zaangażowania | Prowadzi Twój zespół przez określanie zakresu, wymagania, implementację i przegląd w ustalonej, logicznej kolejności |
| Zbieranie wymagań interesariuszy | Zapisuje decyzje i ograniczenia każdej roli w dedykowanym pliku w trakcie sesji |
| Przykłady kodu oparte na PSP | Każdy przykład kodu jest prawdziwy i uruchamialny, zaadaptowany ze zweryfikowanej zawartości referencyjnej PSP, nigdy pseudokod |
| Przeglądy specjalistów | Ośmiu pod-agentów odpowiada zatwierdź, oznacz lub zablokuj, z uzasadnieniem, w kluczowych punktach decyzyjnych |
| Implementation Brief | Jeden pisemny dokument obejmujący decyzje, kod, otwarte kwestie i wszystko co niezweryfikowane |
| Rozszerzalny o nowe PSP | Dodaj nowy PSP postępując zgodnie z istniejącą strukturą `psps/<nazwa>/`, bez zmian w głównych instrukcjach |

---

## Przebieg sesji

```
/start-session
      |
      v
  Zakres i ograniczenia  ->  Wymagania interesariuszy (jedna rola na raz)
      |
      v
  /validate-context  ->  Weryfikacja zawartości referencyjnej PSP wobec oficjalnych źródeł
      |
      v
  Główne płatności -> Webhooki -> Platforma / Terminal / Wydawanie kart (zgodnie z zakresem)
      |
      v
  Przeglądy specjalistów (zatwierdź / oznacz / zablokuj)
      |
      v
/wrap-up  ->  Brief + Szczegółowy przewodnik + Checklista go-live (outputs/<engagement>/)
```

---

## Wspierane PSP

| PSP | Status | Linie produktowe |
|---|---|---|
| Stripe | Dostępny | Płatności, Platforma (Connect), Terminal, Wydawanie kart (Issuing) |

Planowane są kolejne PSP. Aby poprosić o nowy lub wnieść wkład, otwórz issue lub pull request.

---

## Wymagania wstępne

- Jeden ze wspieranych agentów AI do programowania: Claude Code, Google Antigravity, AWS Kiro lub Mistral Vibe. Zobacz `setup/other-agents.md` po uwagi dotyczące konfiguracji poszczególnych narzędzi
- Wspierany PSP (v1: tylko Stripe)
- Testowe klucze API Stripe (publishable + secret)

---

## Szybki start (cztery kroki)

### 1. Sklonuj i wejdź do katalogu

```bash
git clone https://github.com/cmendezs/payment-foundry.git
cd payment-foundry
```

### 2. Skonfiguruj środowisko

```bash
cp .env.example .env
# Otwórz .env i wpisz swoje testowe klucze Stripe
# Zobacz setup/environment-keys.md po szczegóły
```

### 3. Przeczytaj checklistę pierwszej sesji

Otwórz `setup/first-session-checklist.md` i przejdź przez nią przed pierwszą sesją. Zajmuje to około dziesięciu minut i zapobiega najczęstszym problemom z konfiguracją.

### 4. Uruchom i rozpocznij zaangażowanie

```bash
claude
```

Następnie w sesji Claude Code:

```
/start-session
```

Używasz Google Antigravity, AWS Kiro lub Mistral Vibe? Ten sam przepływ `/start-session`, `/validate-context` i `/wrap-up` jest dostępny w każdym z nich, zobacz `setup/other-agents.md` po odpowiednie kroki uruchomienia i lokalizacje skilli.

---

## Komendy Slash

Trzy komendy obejmują cały cykl życia zaangażowania.

| Komenda | Kiedy uruchomić | Co robi |
|---|---|---|
| `/start-session` | Na początku każdego zaangażowania | Identyfikuje PSP, określa zakres zaangażowania, zbiera wymagania interesariuszy rola po roli i proponuje sekwencję implementacji |
| `/validate-context` | Po `/start-session`, przed rozpoczęciem implementacji | Weryfikuje fakty specyficzne dla PSP w zakresie (status, ceny, ograniczenia funkcjonalności, ciągi nagłówków, wersje API) wobec oficjalnych źródeł PSP i zapisuje co jest zweryfikowane, niezweryfikowane lub zablokowane |
| `/wrap-up` | Na końcu zaangażowania | Zbiera otwarte kwestie, dokumentuje wyniki pod-agentów i tworzy trzy artefakty pod `outputs/<engagement>/`: wykonawczy Implementation Brief, szczegółowy Przewodnik Implementacji zorientowany na kod i Checklistę Gotowości do Go-Live |

Wszystko pomiędzy `/start-session` a `/wrap-up` jest obsługiwane konwersacyjnie przez Engagement Managera: wskazówki implementacyjne, przykłady kodu i przeglądy specjalistów w miarę pojawiania się decyzji.

---

## Jak działa sesja

Typowe zaangażowanie przechodzi przez te etapy w kolejności:

1. **Zakres** : przypadek użycia, stos technologiczny, rynki, waluty, harmonogram, wielkość zespołu
2. **Wymagania interesariuszy** : Kierownik ds. Płatności, Zgodność, Oszustwa, Backend, Frontend, Architektura, Bezpieczeństwo, Finanse, zbierane konwersacyjnie i zapisywane jako pliki referencyjne
3. **Walidacja kontekstu** : `/validate-context` weryfikuje fakty specyficzne dla PSP w zakresie wobec oficjalnych źródeł i zapisuje elementy zweryfikowane, niezweryfikowane i zablokowane
4. **Główne płatności** : Payment Intents, interfejs płatności, obsługa potwierdzenia
5. **Webhooki** : obsługa zdarzeń, rekoncyliacja stanu zamówień, ponawianie
6. **Przepływy platformowe** (jeśli dotyczy) : Connect, płatności wielostronne
7. **Przepływy osobiste** (jeśli dotyczy) : Terminal, zarządzanie czytnikami
8. **Wydawanie kart** (jeśli dotyczy) : wydane karty, kontrole wydatków, autoryzacje
9. **Przeglądy specjalistów** : każdy pod-agent ładuje swój plik wymagań, analizuje istotne decyzje i tworzy wynik zatwierdź / oznacz / zablokuj z uzasadnieniem
10. **Artefakty zaangażowania** : wykonawczy Implementation Brief, szczegółowy Przewodnik Implementacji zorientowany na kod i Checklista Gotowości do Go-Live dla danego zaangażowania

Engagement Manager proponuje tę sekwencję na początku i dostosowuje ją do tego, co faktycznie jest w zakresie Twojego zespołu.

---

## Pod-agenci specjaliści

Ośmiu specjalistów jest dostępnych do przeglądu międzyfunkcyjnego. Engagement Manager wywołuje ich w odpowiednich punktach decyzyjnych: nie musisz ich wywoływać bezpośrednio.

| Specjalista | Zakres przeglądu |
|---|---|
| Kierownik ds. Płatności | Monitorowanie KPI, ryzyko migracji, zarządzanie operacyjne |
| Specjalista ds. Zgodności | Zakres PCI, SCA/3DS2, rezydencja danych, ślad audytowy |
| Specjalista ds. Oszustw | Reguły ryzyka, strategia 3DS, proces sporów i obciążeń zwrotnych |
| Specjalista ds. Bezpieczeństwa | Zarządzanie sekretami, walidacja podpisów webhooków, kontrole antyfraudowe |
| Architekt Rozwiązań | Wzorce integracji, tryby awarii, skalowalność |
| Programista Frontend | UX płatności, obsługa błędów, dostępność, lokalizacja |
| Programista Backend | Idempotencja, przetwarzanie webhooków, ponawianie, rekoncyliacja |
| Finanse i Skarbowość | Rozliczenia, wielowalutowość, wypłaty, raportowanie, podatki |

Każdy specjalista tworzy wynik: **zatwierdź**, **oznacz** (kontynuuj z warunkami) lub **zablokuj** (zatrzymaj do rozwiązania). Engagement Manager pomaga rozwiązać oznaczenia i blokady przed kontynuowaniem.

---

## Struktura projektu

```
payment-foundry/
├── README.md                        # Jesteś tutaj
├── CLAUDE.md                        # Instrukcje Engagement Managera
├── AGENTS.md                        # Wskaźnik współdzielonych instrukcji, odczytywany przez Mistral Vibe, AWS Kiro i inne narzędzia kompatybilne z AGENTS.md
├── .env.example                     # Skopiuj do .env i wpisz klucze
│
├── setup/                           # Uruchom raz przed pierwszą sesją
│   ├── installation-guide.md
│   ├── first-session-checklist.md
│   ├── environment-keys.md
│   └── other-agents.md              # Uwagi dla poszczególnych narzędzi: Claude Code, Antigravity, Kiro, Vibe
│
├── skills/
│   └── payment-foundry/             # Źródło prawdy dla trzech skilli
│       ├── start-session/SKILL.md      # Komenda /start-session
│       ├── validate-context/SKILL.md   # Komenda /validate-context
│       └── wrap-up/SKILL.md            # Komenda /wrap-up
│
├── scripts/
│   └── setup-agents.sh              # Dystrybuuje skills/payment-foundry/ do każdego narzędzia poniżej
│
├── .claude/skills/                  # Kopia Claude Code (generowana przez scripts/setup-agents.sh)
├── .agents/skills/payment-foundry/  # Kopia Google Antigravity / AWS Kiro (generowana przez scripts/setup-agents.sh)
├── .vibe/agents/payment-foundry.toml # Profil pod-agenta Mistral Vibe (generowany przez scripts/setup-agents.sh)
│
├── sub-agents/                      # Definicje specjalistów
│   ├── README.md                    # Procedura wywołania
│   ├── head-of-payments.md
│   ├── compliance-officer.md
│   ├── fraud-officer.md
│   ├── security-officer.md
│   ├── solution-architect.md
│   ├── frontend-developer.md
│   ├── backend-developer.md
│   └── finance-treasury.md
│
├── psps/                            # Zawartość referencyjna PSP, ładowana w czasie wykonania
│   └── stripe/
│       ├── README.md                # Indeks: który plik obejmuje co
│       ├── payments.md
│       ├── platform.md
│       ├── terminal.md
│       └── issuing.md
│
├── context/                         # Szablony zakresu i wymagań
│   ├── business-info.md              # Przewodnik zakresu /start-session
│   ├── go-live-checklist-template.md # Szablon źródłowy checklisty go-live
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
    ├── <engagement>-*-requirements.md      # Zbierane na sesję, na rolę
    ├── <engagement>-context-validation.md  # Tworzony przez /validate-context
    └── <engagement>/                       # Folder na zaangażowanie, tworzony przez /wrap-up
        ├── implementation-brief.md         # Warstwa wykonawcza
        ├── implementation-detailed.md      # Podręcznik programisty z kodem
        └── go-live-checklist.md            # Zaadaptowany z szablonu
```

Informacje o firmie znajdują się w `context/business-info.md` i są aktualizowane w miejscu między zaangażowaniami, nigdy kopiowane na zaangażowanie.

---

## Dodawanie nowego PSP

Utwórz folder pod `psps/<nazwa>/` z plikiem indeksowym `README.md` i jednym plikiem na linię produktową. Postępuj zgodnie ze strukturą `psps/stripe/`. Żadne zmiany w `CLAUDE.md` ani `sub-agents/` nie są potrzebne.

---

## Licencja

Ten projekt jest licencjonowany na podstawie Apache License 2.0. Zobacz plik `LICENSE` po szczegóły.
