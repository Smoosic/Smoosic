# Feature Specification: Autosave Buffers and Crash Recovery

**Feature Branch**: `036-autosave-recovery`

**Created**: 2026-11-01

**Status**: Draft

**Input**: User description: "We currently do quick save to the session storate.  Keep a running buffer of autosaves in the local session.  Ever 10 minutes after a change, create a new auto save buffer with the current state.  In the file menu, create a 'Recovery' dialog, where the user can pick any of the current buffers to recover a crash.  In the score preferences menu, create an autosave section where the user can adjust the settings.  Number of buffers up to 20, timer 5 min. to 1 hour in minute increments, default is 10 minutes and 10 sessions.  Save this in the Smo preferences object."

## Clarifications

### Session 2026-11-01

- Q: Should autosave snapshots live in storage that survives a crash, or storage cleared when the tab closes? → A: The browser's local storage (same kind of storage Quick Save already uses); "session storage" in the original request meant local storage.
- Q: Where are the autosave settings stored: with each score, or as a global browser setting? → A: In the score preferences (`SmoScorePreferences`), saved with each score. There are no global browser settings today other than the autosaved score, and this feature does not add any.
- Q: What is the minimum number of snapshots the user can choose? → A: 1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic snapshots while I work (Priority: P1)

A composer is working on a score for a long stretch. Without doing anything, the application periodically keeps a snapshot of the score as it is at that moment. A snapshot is only taken if the score has changed since the previous one, and no more often than the configured interval. The application keeps a rolling set of the most recent snapshots; when the set is full, the oldest is discarded to make room for the newest. The user is never interrupted to take a snapshot.

**Why this priority**: Without the snapshots there is nothing to recover. This is the foundation of the feature, and it delivers protection even before a recovery screen exists.

**Independent Test**: With default settings, open a score, make an edit, and wait one interval. A new snapshot exists. Make no further edits and wait another interval: no additional snapshot is created. Make another edit and wait: a second snapshot exists.

**Acceptance Scenarios**:

1. **Given** the default settings and a score with no changes since the last snapshot, **When** the interval elapses, **Then** no new snapshot is created.
2. **Given** the user makes a change to the score, **When** the configured interval has elapsed since the previous snapshot (or since the change, if no previous snapshot exists), **Then** a new snapshot of the current score is added to the set.
3. **Given** the set already holds the maximum number of snapshots, **When** a new snapshot is taken, **Then** the oldest snapshot is removed and the new one is added, so the set never exceeds the maximum.
4. **Given** the user makes many changes in quick succession, **When** the interval has not yet elapsed, **Then** only one snapshot is taken for that interval, not one per change.
5. **Given** a snapshot is being taken, **Then** the user can keep editing without a visible pause or prompt.
6. **Given** the browser has no room left to store a snapshot, **When** a snapshot is attempted, **Then** the oldest snapshots are discarded until the new one fits, and the application keeps working normally; if it still cannot be stored, the user is not interrupted and the previous snapshots remain.

---

### User Story 2 - Recover my work after a crash (Priority: P1)

After the browser or the application crashes (or the tab is closed by accident), the user reopens Smoosic and wants their work back. From the **File** menu they choose **Recovery**. A dialog lists every snapshot currently kept, newest first, each showing when it was taken and enough about the score (such as its title and size) for the user to tell them apart. The user picks one and confirms, and that snapshot is loaded as the current score. Cancelling leaves the current score untouched. Snapshots are not deleted by recovering one, so the user can try another if the first was not the one they wanted.

**Why this priority**: This is the reason the feature exists. A crash loses at most one interval of work, and the user can choose how far back to go.

**Independent Test**: Make three separate edits with snapshots in between, open File > Recovery, and confirm that three snapshots are listed newest first. Select the middle one and confirm: the score on screen matches the state at the time of that snapshot. Reopen Recovery and confirm all three are still listed.

**Acceptance Scenarios**:

1. **Given** snapshots exist, **When** the user opens File > Recovery, **Then** a dialog lists all snapshots, newest first, each with its date and time and identifying details about the score.
2. **Given** the Recovery dialog is open, **When** the user selects a snapshot and confirms, **Then** that snapshot replaces the current score on screen.
3. **Given** the Recovery dialog is open, **When** the user cancels, **Then** the current score is unchanged.
4. **Given** no snapshots exist, **When** the user opens File > Recovery, **Then** the dialog states that there is nothing to recover, and offers no selection.
5. **Given** the user has recovered a snapshot, **Then** the snapshots remain available and the recovered score is treated as having unsaved changes, so the user is still prompted to save it to a file.
6. **Given** the current score has unsaved changes, **When** the user confirms a recovery, **Then** the user is warned that the current score will be replaced before it happens, with the chance to back out.
7. **Given** a stored snapshot can no longer be read, **Then** it is shown as unreadable and cannot be selected, and the other snapshots are still usable.

---

### User Story 3 - Adjust autosave to my needs (Priority: P2)

Different users have different needs. A user working on a very large score may find frequent snapshots wasteful and want a longer interval and fewer snapshots. A cautious user may want a short interval and many snapshots. In the **Score Preferences** dialog, there is an **Autosave** section where the user sets how often snapshots are taken (from 5 to 60 minutes, in whole-minute steps) and how many are kept (from 1 up to 20). The defaults are every 10 minutes and 10 snapshots. The new settings take effect right away, and are remembered with the other preferences.

**Why this priority**: The defaults give most of the value; the settings make the feature fit different users and scores but are not required for the core protection.

**Independent Test**: Open Score Preferences, find the Autosave section showing 10 minutes and 10 snapshots, change them to 5 and 3, save, and reopen: the new values are shown. Make edits until more than 3 snapshots would exist, and confirm only the 3 newest are kept.

**Acceptance Scenarios**:

1. **Given** a score that has never had autosave settings changed, **When** the user opens Score Preferences, **Then** the Autosave section shows an interval of 10 minutes and a maximum of 10 snapshots.
2. **Given** the Autosave section, **When** the user enters an interval, **Then** only whole minutes from 5 to 60 are accepted; values outside that range are rejected or limited to the nearest allowed value.
3. **Given** the Autosave section, **When** the user enters a snapshot count, **Then** only whole numbers from 1 to 20 are accepted.
4. **Given** the user lowers the snapshot count below the number of snapshots currently stored, **When** the preferences are saved, **Then** the oldest snapshots beyond the new limit are removed.
5. **Given** the user changes the interval, **When** the preferences are saved, **Then** the next snapshot is scheduled using the new interval.
6. **Given** the settings were changed and the score is saved and reloaded, **Then** the settings are the same as the user chose.
7. **Given** a score saved before this feature existed, **When** it is opened, **Then** it uses the default autosave settings without error.

---

### Edge Cases

- The user has the score open in two browser tabs: snapshots from both are kept in the same set, each identifiable by its time and score title; neither tab removes the other's snapshots except by the rolling limit.
- The browser's storage is cleared, disabled, or blocked (for example in private browsing): autosave quietly does nothing, the application continues to work, and the Recovery dialog explains that no snapshots are available.
- The score is very large and a snapshot would not fit in the remaining storage: older snapshots are discarded to make room, as described in the first story; the quick save of the current score is never sacrificed to autosave.
- The user saves the score to a file: this does not delete snapshots, since they remain useful as history until they roll off.
- The user closes the tab cleanly: the snapshots are still kept for the next visit.
- The user opens a different score, or starts a new score: snapshots of earlier scores remain in the list, each labeled by its score title, until they roll off.
- The clock is changed during a session: snapshots are still listed in the order they were taken.
- The interval or count is changed while a snapshot is due: the change applies from that moment, and a snapshot is never taken more often than the interval in force.
- A snapshot is taken at the same moment the user presses Quick Save: both complete, and neither corrupts the other.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST keep a rolling set of autosave snapshots of the score in the browser's local storage for the current session of use, separate from the existing Quick Save slot.
- **FR-002**: The application MUST take a new snapshot only when the score has changed since the last snapshot and the configured interval has elapsed.
- **FR-003**: The application MUST NOT keep more snapshots than the configured maximum; when a new snapshot would exceed the maximum, the oldest snapshots MUST be removed first.
- **FR-004**: Taking a snapshot MUST NOT interrupt the user, block editing, or change the state of the score (including its saved/unsaved status).
- **FR-005**: The File menu MUST include a **Recovery** command that opens a Recovery dialog.
- **FR-006**: The Recovery dialog MUST list all stored snapshots, newest first, showing the date and time taken and identifying details of the score (such as its title).
- **FR-007**: The user MUST be able to select one snapshot in the Recovery dialog and load it as the current score, or cancel without any change.
- **FR-008**: Recovering a snapshot MUST NOT delete any snapshot, and the recovered score MUST be treated as having unsaved changes.
- **FR-009**: Before a recovery replaces a score that has unsaved changes, the application MUST warn the user and allow them to back out.
- **FR-010**: The Recovery dialog MUST show a clear message when no snapshots exist, and MUST mark any unreadable snapshot as unavailable without blocking the others.
- **FR-011**: The Score Preferences dialog MUST include an **Autosave** section where the user can set the snapshot interval and the maximum number of snapshots.
- **FR-012**: The snapshot interval MUST be adjustable from 5 minutes to 60 minutes in 1-minute steps, defaulting to 10 minutes.
- **FR-013**: The maximum number of snapshots MUST be adjustable from 1 to 20, defaulting to 10.
- **FR-014**: Out-of-range or non-whole values for either setting MUST NOT be accepted.
- **FR-015**: The autosave settings MUST be stored with the other score preferences, so that they are saved with the score and restored when it is reopened.
- **FR-016**: Scores saved before this feature existed MUST open without error and use the default autosave settings.
- **FR-017**: Changes to the settings MUST take effect without restarting the application, including trimming stored snapshots when the maximum is lowered.
- **FR-018**: If snapshots cannot be stored (storage unavailable, blocked, or full), the application MUST continue to work normally and MUST NOT show an error during editing.

### Key Entities

- **Autosave Snapshot**: A copy of the whole score as it was at a moment in time. Has a time taken and identifying details (score title) so the user can tell snapshots apart. Snapshots are kept in order of age and form a rolling set limited by the maximum count.
- **Autosave Settings**: The user's choices for how often a snapshot is taken (5 to 60 whole minutes, default 10) and how many are kept (1 to 20, default 10). Part of the score preferences, saved with the score.
- **Recovery Choice**: The user's selection of one snapshot from the list to become the current score.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After an unexpected closure, a user can get back to a snapshot of their work in under 30 seconds from reopening the application, using only the File menu and the Recovery dialog.
- **SC-002**: With default settings, a user who edits continuously loses no more than 10 minutes of work in a crash, and can choose among up to 10 earlier states.
- **SC-003**: Taking a snapshot causes no noticeable pause in editing for scores of typical size (users cannot perceive a delay during normal editing).
- **SC-004**: A user can find and change both autosave settings in under 1 minute from opening Score Preferences.
- **SC-005**: In testing across the full allowed range of settings (5 to 60 minutes; 1 to 20 snapshots), the number of stored snapshots never exceeds the chosen maximum and no snapshot is taken more often than the chosen interval.
- **SC-006**: 100% of scores saved before this feature existed open without error and show the default autosave settings.
- **SC-007**: A recovered snapshot is identical in content to the score at the time the snapshot was taken.

## Assumptions

- Snapshots are kept in the browser's local storage (the same kind of storage Quick Save already uses), so that they survive a crash, a closed tab and a browser restart.
- The autosave settings are part of the score preferences, which are saved with the score and edited in the Score Preferences dialog, so the settings travel with each score file. The settings that apply while working are those of the score currently open. No new global browser settings are introduced.
- "Every 10 minutes after a change" means that the clock starts when the first unsnapshotted change happens, and a snapshot is taken once the interval has elapsed. No snapshot is taken for an unchanged score.
- The minimum interval is 5 minutes and the maximum is 60 minutes; the minimum number of snapshots is 1 and the maximum is 20.
- Snapshots are kept per browser, not per score. They are not synchronized between devices.
- The existing Quick Save feature keeps working as it does today and is not replaced by this feature.
- Recovery loads the chosen snapshot as the current score; it does not offer to merge it with the current score.
- Snapshots are capped by count, not by size. If storage is full, the oldest snapshots are given up first.
- A user-facing label for snapshots is the date/time plus score title; additional detail (such as number of measures) is optional.
