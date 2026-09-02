# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dungeon Masters preparing and running D&D 5e encounters at the table. The primary job is to keep initiative, health, conditions, reactions, turn flow, notes, and the combat record understandable while play is moving quickly.

## Product Purpose

Initiative Tracker is a local-first encounter workspace for staging combatants and running encounters without requiring an account or hosted database. Success means faster scanning, fewer missed turn-state details, and fewer combat-management mistakes.

## Positioning

The tracker combines a focused live-combat surface with user-supplied, ruleset-aware JSON content packs while keeping encounter and roster data on the user's own machine.

## Operating Context

Users prepare a roster and encounter, roll or enter initiative, run turns and rounds, adjust hit points, apply effects, record notes, and review an event log. Encounters can use either the 2014 or 2024 D&D 5e ruleset. Users may import and export encounters, full backups, and content packs.

## Capabilities and Constraints

- Preserve the interaction behavior of the original HTML tracker unless an explicit later Figma flow overrides it.
- Preserve the current React, TypeScript, Radix Primitives, and Radix Colors presentation architecture together with IndexedDB persistence, legacy migration, autosave, versioned import/export, ruleset pinning, content-pack validation, and tested domain logic.
- Content-pack metadata is limited to source version, ruleset compatibility, and required attribution. Pack authors are responsible for supplying attribution.
- User-supplied JSON may add conditions, creatures, spells, and related content compatible with the 2014 and/or 2024 rulesets.
- Content-field schema migration may be needed in the future, but redesigning that migration system is currently out of scope.
- Core encounter use must remain available through a public-facing static web page and store data locally on the user's machine.

## Brand Commitments

The product name is Initiative Tracker. Existing Figma designs and the original HTML interaction flows are binding references; explicit newer Figma flows take precedence where they differ.

## Evidence on Hand

- Original behavioral reference: `legacy.html`
- Component and visual reference: `components.html`
- Current application implementation: `src/`
- Figma reference supplied by the user: Initiative Tracker GCdupe
- No testimonials, performance claims, or externally verified usage data have been supplied; future work must not fabricate them.

## Product Principles

- Keep the active turn and consequential combat state unmistakable.
- Optimize common table actions for speed, repetition, and error recovery.
- Keep user data local, portable, and understandable.
- Let ruleset-aware user content extend the tracker without changing its core workflow.
- Prefer explicit, reversible controls for destructive or state-changing actions.

## Accessibility & Inclusion

Core workflows must remain keyboard reachable, expose visible focus, use semantic controls, respect reduced-motion preferences, and remain operable at desktop and mobile widths.
