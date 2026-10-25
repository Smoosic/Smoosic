# Specification Quality Checklist: Split Multimeasure Rests at Landmarks

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-10-22

**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- The Input line quotes the request verbatim, so it names the code files. The rest of the spec uses behavioral terms.
- From a first read of the code: the grouping step treats a rehearsal mark, repeat symbol or instrument change on a measure as disqualifying that measure from starting a multimeasure rest, which would leave it as a lone rest bar between two multimeasure rests (User Stories 1 and 3). Key and time signature changes appear to be handled in the grouping step already (they only end a rest), so the reported problem for those may be in drawing the signature at the start of the second rest (User Story 2). The plan phase must establish exactly where each case fails before changing anything.
- Clarified by the user (2026-10-22): landmarks are either start landmarks (rehearsal mark, key/time/tempo change, Segno, Coda, start-repeat or double barline, instrument change), which break the rest before their measure and are shown at the beginning of the next block, or end landmarks (D.S., D.C., To Coda, Fine, end-repeat or double barline), which break the rest after their measure and are shown on the block they end. Tempo, key and time changes are all landmarks.
- Defaults chosen without asking: text annotations are not landmarks; measures under a repeat-ending bracket keep today's behavior; a single remaining empty measure stays an ordinary rest bar, including a measure that carries both kinds of landmark.
- Ready for `/speckit-clarify` or `/speckit-plan`.
