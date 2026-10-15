# Feature Specification: Replace Promise Helpers with Native Async

**Feature Branch**: `029-remove-promise-helpers`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "PromiseHelpers class was created before async was available. Many classes that could be async in the application are not but return Promise<>. Remove calls to PromiseHelpers.emptyPromise and just replace it with return, changing the signature to async if it's not already. Once all the signatures are updated, there should not be the need for PromiseHelpers.makePromise either, it can be replaced with just a normal async function call. Keep the PromiseHelpers class for external applications that might use it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Application code no longer builds placeholder promises by hand (Priority: P1)

A maintainer reading the application code finds that methods which have nothing to wait for are ordinary asynchronous functions that simply return. They no longer call a helper that creates a timer just to produce an empty, already-finished promise. Every such method still hands its callers something they can wait on, exactly as before.

**Why this priority**: This is the core cleanup. It removes the legacy pattern from roughly twenty places across the dialogs, the view operations, the render state and the application startup, and makes the code match the language features the project already uses elsewhere.

**Independent Test**: Search the application source for the empty-promise helper. No calls remain. Then run the app and the existing test scripts, and confirm that the dialogs, menus and score operations that used to return the helper's promise still work and can still be waited on.

**Acceptance Scenarios**:

1. **Given** a method that returned the empty-promise helper's result, **When** the cleanup is done, **Then** the method is an ordinary asynchronous function that returns without the helper, and callers that wait on it still work.
2. **Given** a method that already was an asynchronous function and returned the helper, **When** the cleanup is done, **Then** it simply returns, and its declared result type is unchanged.
3. **Given** a method that was not asynchronous but returned a promise from the helper, **When** the cleanup is done, **Then** it is declared asynchronous so it still returns a promise to every caller.
4. **Given** an abstract method or interface that declares a promise result and is implemented by several classes, **When** the cleanup is done, **Then** every implementation and every caller keeps working, with no change to the declared result type.
5. **Given** a caller that waits on one of the changed methods, **When** it runs after the cleanup, **Then** it observes the same sequence of events as before (the method has finished its work before the caller continues).

---

### User Story 2 - Polling for render state needs no helper class (Priority: P2)

The code that waits for the score to reach a rendered state no longer depends on the polling helper. It is written as ordinary asynchronous code in the place where it is used, and behaves the same for callers: they wait until the score is in the required state and the rendering-suspension setting is restored.

**Why this priority**: It removes the remaining use of the polling helper in the application, so the helper class is no longer used by the application at all. It is lower priority than Story 1 because it is a single, higher-risk spot where the rendering timing matters most.

**Independent Test**: After the change, open and edit a score, load a new score, undo, change layouts, and check that every operation that waits for rendering still completes and the score displays correctly with no extra delay or flicker.

**Acceptance Scenarios**:

1. **Given** an operation that waits for the score to be fully rendered, **When** rendering completes, **Then** the waiting code continues, and the rendering-suspension setting is restored to what it was before the wait.
2. **Given** an operation that waits for the rendered state while rendering is slow, **When** the wait is in progress, **Then** the application stays responsive (the wait does not block the page) and the wait does not end early.
3. **Given** the cleanup is complete, **When** the application source is searched, **Then** no code in the application uses the polling helper.

---

### User Story 3 - External applications that use the helper keep working (Priority: P1)

An application built on the Smoosic library that calls the promise helper class directly (for example, to create a delayed empty promise or to poll for a condition) continues to work with no change. The class and all its methods remain available from the library's public exports with the same behavior.

**Why this priority**: The request explicitly requires it, and a break here would affect users outside this repository who cannot be updated together with the library.

**Independent Test**: Confirm that the helper class and each of its methods are still exported from the library entry point, and that a small external script calling them still gets the same results as before.

**Acceptance Scenarios**:

1. **Given** an external application imports the helper class from the library, **When** it calls any of its methods, **Then** each method behaves as before the change.
2. **Given** the library's public exports, **When** they are compared before and after the change, **Then** the helper class and its related types are still exported, and no other public export has been removed or has changed its declared result type.

---

### Edge Cases

- What happens when a changed method's caller relied on the small delay the helper added before finishing? The helper finished on a later timer tick; a plain return finishes sooner. Each affected call site must be checked for callers that depended on that extra tick (for example, a screen update that needed to happen between two steps). Any such caller must keep its ordering.
- What happens when a method is only declared to return a promise because an abstract base class or interface requires it? It becomes an asynchronous function with an empty body or a plain return, and the base class's declared type does not change.
- What happens when a changed method is called without waiting on it, as a fire-and-forget call? It must still run to completion and must not cause an unhandled failure that did not occur before.
- What happens when a method throws or fails while it is now asynchronous? The failure is reported to the caller as a rejected promise, not as an immediate thrown error. Call sites that depended on an immediate throw from a formerly non-asynchronous method must be identified and handled.
- What happens with tests or documentation that mention the helper? Mentions of the helper's use inside application code are removed; the helper's own documentation stays.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application source MUST NOT call the empty-promise helper. Each place that did MUST return normally from an asynchronous function instead.
- **FR-002**: A method that returned the empty-promise helper's result and was not asynchronous MUST be changed to an asynchronous function, so that callers still receive a promise and the declared result type is unchanged.
- **FR-003**: A method that was already asynchronous MUST simply return, and abstract or interface methods that declare a promise result MUST keep that declared type.
- **FR-004**: All callers of the changed methods MUST continue to work and to wait for completion as before; any caller that depended on the helper's extra timer tick or on an immediate (non-promise) failure MUST be found and kept correct.
- **FR-005**: The application source MUST NOT use the polling helper. The wait for the score to reach a required render state MUST be implemented as ordinary asynchronous code with the same behavior: it ends only when the required state is reached, restores the rendering-suspension setting to its earlier value when it ends, and does not block the page while waiting.
- **FR-006**: The promise helper class, with all its methods and related types, MUST remain in the library and remain available from its public exports, with unchanged behavior, for use by external applications.
- **FR-007**: No other public method of the library MUST change its declared result type, parameters or meaning as a result of this change.
- **FR-008**: Existing automated tests MUST continue to pass, and the application MUST build without new errors or warnings.
- **FR-009**: The score editing, dialog, menu, undo and loading behavior visible to users MUST be unchanged.

### Key Entities

- **Promise helper class**: A legacy utility, exported for outside users, that creates empty delayed promises and polling promises. It stays in the library but is no longer used by the application itself.
- **Changed method**: Any method in the application that returned a promise only because it called the helper, and so becomes a plain asynchronous function.
- **Render-state wait**: The part of the application that lets an operation wait until the score is rendered, restoring the rendering-suspension setting afterwards.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A search of the application source finds 0 uses of the empty-promise helper and 0 uses of the polling helper, outside the helper class's own file and its public export.
- **SC-002**: 100% of the previously helper-returning methods still return something their callers can wait on, with the same declared result type.
- **SC-003**: The helper class and each of its methods remain available from the library's public exports, with no removed or changed export.
- **SC-004**: All existing automated test scripts pass, and the application builds with no new errors or warnings.
- **SC-005**: In a manual pass through opening, editing, undoing, loading a score, changing layout and using each dialog and menu, there is no visible difference from before: no new delay, flicker, ordering problem, or console error.

## Assumptions

- The helper's one-timer-tick delay is an implementation detail, not a feature. The planning phase checks each call site and keeps a deliberate delay only where a caller really depends on it.
- Calls that the helper's author wrote only to satisfy a promise return type (the large majority) become plain returns from asynchronous functions.
- The helper class stays in its current place in the library and in the public exports, unchanged, even though the application no longer uses it. It may be marked as retained for outside users in its documentation.
- Application code that waits on the render state keeps the same waiting interval and conditions as today; only the way the wait is written changes.
- The unused delayed-value helper and the chained-promise helper in the same file are also kept for external users; they have no application callers today.
- Tests already in the repository cover the data layer rather than these dialogs and render paths, so confidence in the UI-facing changes comes from type checking, the build, and the manual pass in the quickstart.
