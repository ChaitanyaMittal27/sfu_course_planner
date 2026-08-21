# Documentation discrepancies and implementation hazards

This is a targeted list of durable, change-relevant discrepancies. It is not a general defect tracker.

| Subject | Verified state | Why it matters |
| --- | --- | --- |
| `docs/curl_commands.sh` | Targets port 8080 and removed dump-model/addoffering/watchers endpoints. Current backend default is port 5000 and does not expose those controllers. | It is historical, not a runnable API smoke-test script. |
| `scripts_README.md` | Describes `populate_courses_deep_first.py`; the repository instead contains `populate_courses_deep_latest_semester.py`. Some stated pass/year names also differ from script constants. | Inspect scripts themselves before data maintenance. |
| Semester decode | `decodeSemesterCode(1257)` computes year `125`, although encoding full year 2025 produces 1257. | Bookmark offering responses use it; add regression coverage before correcting dependent behavior. |
| CourseSys error handling | The Java client promises empty results on a failed call but does not catch `RestTemplate`/parse exceptions. | External errors may become API failures outside the scheduler. |
| Email outcome | The mail helper logs and swallows exceptions; callers update response/state afterward. | “Sent” UI/state means attempted, not delivery-confirmed. |

`README.md` and `agent-docs/AGENTS.md` substantially match the active high-level architecture and intended frontend conventions, but source remains the authority for exact runtime behavior.
