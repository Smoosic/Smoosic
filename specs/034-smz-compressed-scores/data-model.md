# Data Model: Compressed Score Files (.smz)

The score document itself does not change. These are the file-level shapes.

## Score document (existing)

The JSON produced by `SmoScore.serialize` and read by `SmoScore.deserialize`. Two textual forms exist:

| Form | Where it comes from | How to tell |
|------|--------------------|-------------|
| Abbreviated (legacy) | Default save before this feature | Has a top-level `dictionary` key; other keys are short tokens |
| Full | Validation save; contents of `.smz` | No `dictionary` key |

`deserialize` handles both; it is not changed by this feature.

## `.smz` archive (new)

| Part | Value |
|------|-------|
| Container | Standard zip file, starts with bytes `50 4B 03 04` |
| Entry `score.json` | Full score document, UTF-8, no byte-order mark |
| Compression | DEFLATE, level 9 |
| Other entries | Ignored on read; not written |

Read rule: use `score.json` if present; otherwise the first non-directory entry whose name ends in `.json`; otherwise the file is refused.

## Score file kinds and how each is recognized

| Kind | Extension written | Recognized by | Written by this version? |
|------|------------------|---------------|-------------------------|
| Compressed (`.smz`) | `.smz` | zip signature | Yes (default) |
| Legacy abbreviated | `.json` | text, JSON with `dictionary` key | No |
| Validation | `.json` | text, JSON without `dictionary` key | Yes (option) |

Recognition ignores the file name; the extension only picks the suggested name and the file-chooser filter.

## Load result

`unpack(input)` returns the score document text, or throws one of these failures (message shown to the user):

| Failure | Cause |
|---------|-------|
| Not a score file | Not a zip and the text is not valid JSON |
| Damaged archive | Zip signature present but the archive cannot be read |
| No score in archive | Valid zip with no `score.json` or other `.json` entry |
| Not a score | JSON that does not look like a score (no `staves`) |

State transitions: none. Loading never mutates the open score; replacement happens only after a successful load and the unsaved-changes confirmation.
