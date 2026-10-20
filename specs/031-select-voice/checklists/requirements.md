# Specification Quality Checklist: Select Voice

**Purpose**: Validate specification completeness and quality before proceeding to planning

**Created**: 2026-10-20

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

- The Input line quotes the request verbatim. The rest of the spec uses behavioral terms.
- Defaults chosen without asking: rests count as notes of a voice; a voice missing from some selected measures simply contributes nothing there (and is never created); choosing a voice does not add an undo entry; multi-staff selections apply the chosen voice on every selected staff.
- The existing Voices menu already has "Voice N" entries that make a voice active and may create it; the spec keeps Select Voice separate (FR-011, User Story 3) so the plan phase should reuse the existing logic for selecting the active voice's notes only if it does not create voices or change the score.
- Ready for `/speckit-clarify` or `/speckit-plan`.
