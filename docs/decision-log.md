# Decision log

## 2026-10-23 — New standalone STILL project

- Decision: create `still/` rather than modify CleanRoom.
- Alternatives: redesign CleanRoom; embed STILL as a sibling mode.
- Evidence: user selected a new Path A project and explicitly prohibited CleanRoom changes.
- Reversibility: the entire project is isolated under one directory.

## 2026-10-23 — SQLite-first local persistence

- Decision: use SQLx with SQLite for the verified local golden path.
- Reason: this worker has no PostgreSQL daemon or credentials; real file-backed persistence is more valuable than an unverified hosted dependency.
- Follow-up: add a tested PostgreSQL adapter only after an authorised free hosted target exists.
