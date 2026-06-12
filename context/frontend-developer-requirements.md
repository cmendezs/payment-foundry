# Frontend Developer: Requirements Checklist

This is a guide for the questions the Engagement Manager should cover with the team's frontend development lead, typically after initial scoping (Step 3 of `/start-session`) but before the sequence moves into implementation. These questions are PSP-agnostic and apply to any engagement.

It is not mandatory to answer all questions. Partial answers are useful and can be revisited later. Ask conversationally, skip anything not relevant to this engagement, and record answers in `outputs/<short-engagement-name>/frontend-developer-requirements.md`.

Section I covers the "Day 0" architecture decisions, in particular the Hosted vs. Embedded choice. When discussing this choice, frame it in terms of journey ownership: hosted saves engineering effort but hands control of the experience to the PSP, while embedded costs more effort but preserves full control over look, feel, and flow.

During the review stage and at Implementation Brief time, the `frontend-developer` sub-agent checks the integration plan and decisions against the answers recorded here.

## I. Integration Strategy & Architecture

These are the foundational "Day 0" decisions that shape everything downstream.

- What is the definitive integration path: hosted/redirect or embedded (iframe/SDK)? (Hosted carries lower PCI scope but reduces control of the experience; embedded requires more effort but preserves the UX.)
- If embedded is chosen, what is the PCI scope footprint? (Which elements must be wrapped in the PSP's secure containers, so the developer knows the boundary clearly?)
- If hosted is chosen, how is the return-to-platform experience handled? (How are URL handling and session persistence managed to minimize redirect shock?)
- How does the chosen integration support provider agnosticism? (Is an internal payment-provider interface being built so the team can switch between hosted/embedded or different PSPs without rewriting the checkout UI?)

## II. Design System & Brand Consistency

These questions ensure the PSP UI feels like part of the platform.

- How are the platform's design system tokens mapped to the PSP's theming options? (Does the PSP support CSS variables, or is class-level overriding required?)
- What is the strategy for maintaining accessibility (WCAG) across PSP-provided components? (How is the platform's accessibility standard preserved when the PSP controls part of the rendering?)
- How are PSP component updates handled? (What process ensures a PSP UI update does not break the platform's custom styling or theming?)
- What are the constraints of the PSP's theming engine? (Can the platform's typography, borders, and animations be fully replicated, or will some PSP fields remain visually distinct from the brand?)
- How are dynamic layouts handled? (If the platform supports dark mode or responsive scaling, does the PSP component adapt automatically, or are custom listeners required?)

## III. Checkout Flow & State Management

These questions cover how the checkout feels and behaves during a payment attempt.

- How are loading and success/fail states presented to the user? (What ensures the transition feels like one cohesive platform rather than a jump to a third-party app?)
- How is abandoned-cart logic managed? (If the user closes the window during a redirect, how is the session status synced back to the backend?)
- How are optimistic UI updates implemented? (Can a "payment processing" state be shown while the backend validates, or does the UI need to wait for the PSP's asynchronous webhook?)
- How are multi-step flows handled? (If the PSP requires a 3DS2 redirect, how is the user's progress persisted so the basket is not lost if the redirect fails?)

## IV. Observability & Developer Experience

These questions ensure the team can measure and debug the payment UI.

- How is funnel analytics instrumented for the payment UI? (How is conversion tracked specifically for the PSP UI components, including drop-off after the payment field is shown?)
- How are the PSP's error codes exposed to the user? (Is there a mapping from technical error codes to branded, user-friendly messages?)
- How is client-side validation performed? (How is local validation, such as card format and Luhn checks, kept in sync with the PSP's real-time validation?)
- What is the mocking strategy for local development? (Can the team test the payment flow against a mock API to avoid hitting production or sandbox limits during design iteration?)

## V. Operational Governance

These questions cover ongoing operation and evolution of the payment UI.

- How is localization handled at the component level? (Does the PSP auto-detect the user's language and locale, or does the platform need to pass a locale setting explicitly?)
- How is fallback UI managed? (If the PSP's custom field fails to load, is there a graceful degradation, or is checkout blocked?)
- What is the release strategy for changes to the PSP UI? (Can a styling change to the payment field be A/B tested for conversion impact before full deployment?)

## Output

1. Record answers (even partial) in `outputs/<short-engagement-name>-frontend-developer-requirements.md`, grouped under the same five headings.
2. Mark unanswered items `[Open]` rather than guessing.
3. Reference this file when the `frontend-developer` sub-agent is invoked during reviews and at Implementation Brief time.
