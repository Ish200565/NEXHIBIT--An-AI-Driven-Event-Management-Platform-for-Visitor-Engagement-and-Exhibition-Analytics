# NExhibit backend (FastAPI + PostgreSQL)

Ingests events from the CV worker, stores them, computes dwell/engagement, fires
notifications, and serves everything the dashboards need.

```
CV worker --POST /api/events, /api/frame--> FastAPI --> PostgreSQL
                                               |
              dashboard polls /api/live, /heatmap, /activity, /stream
```

## Privacy design
- The CV side only ever sees an anonymous `visitor_id` (V1001...).
- Personal details live in `registrations`; they are joined only for the visitor's own
  notification and the exhibitor's lead list. Organiser endpoints (`/live`, `/activity`,
  `/visitors`) return IDs only.

## Setup (Windows)
1. Install PostgreSQL (EDB installer). Remember the `postgres` password.
2. Create the database: open **SQL Shell (psql)** or pgAdmin and run `CREATE DATABASE nexhibit;`
3. In `backend/`:
   ```
   conda activate torchreid          # or any env; backend deps are light
   pip install -r requirements-dev.txt
   copy .env.example .env            # then put your Postgres password in DATABASE_URL
   python seed.py --reset            # tables + V1001-V1003 + stalls A/B/C
   uvicorn app.main:app --reload --port 8000
   ```
4. Open http://localhost:8000/docs for the interactive API.
5. No CV running? In a second terminal: `python mock_worker.py` (60 s looping scenario).
6. Tests: `pytest -q` (SQLite by default; set `DATABASE_URL` to run them on Postgres).

Before every demo run: `POST /api/admin/reset` (button in /docs) or `python seed.py --reset`.

## Endpoints
| Method + path | Used by | Returns |
|---|---|---|
| `POST /api/events` | CV worker | accepts a batch, returns engagements fired |
| `POST /api/frame` | CV worker | raw JPEG bytes of the annotated frame |
| `GET /api/stream` | dashboard `<img>` | MJPEG live video |
| `GET /api/frame.jpg` | fallback | latest single frame |
| `GET /api/live` | dashboard (poll 1s) | counters, per-stall occupancy, people now, `stale` flag |
| `GET /api/heatmap?window_s=60` | dashboard (poll 2s) | `cells` (counts) and `normalized` (0..1), row 0 = top |
| `GET /api/activity` | dashboard | recent engagements (IDs only) |
| `GET /api/stalls/stats` | dashboard / exhibitor | unique visitors, engaged, avg dwell, current per stall |
| `GET /api/stalls/{id}/leads` | exhibitor page | engaged visitors WITH name/email/company |
| `GET /api/notifications/{visitor_id}` | visitor phone page | that visitor's alerts |
| `POST /api/register` | registration form | `registration_id` + `qr_payload` |
| `POST /api/checkin` | check-in script | anonymous `visitor_id` (idempotent) |
| `GET /api/stalls`, `PUT /api/stalls/{id}/zone` | worker / setup | zone polygons (normalised 0..1) |
| `POST /api/admin/reset` | you | wipes run data |

## Event contract (CV worker -> backend)
```json
{ "camera_id": "cam1", "ts": 12.4, "frame_w": 1280, "frame_h": 720,
  "people": [ {"track_id": 7, "visitor_id": "V1002", "score": 0.77, "x": 640, "y": 580},
              {"track_id": 3, "visitor_id": null,    "score": 0.53, "x": 120, "y": 600} ] }
```
- `x, y` = foot point in frame pixels (bottom-centre of the box). The backend normalises it
  and decides which stall the person is in, so the worker needs no zone logic.
- `ts` = stream/video seconds, not wall-clock, so replay speed doesn't change dwell.
- Post roughly once per second. `DWELL_GRACE_S` must be larger than the posting interval.
- Unknown `visitor_id` values are ignored (reported in `rejected_visitor_ids`), never crash.

## Engagement rule
Dwell accumulates per (visitor, stall) while the visitor's foot point is inside the stall
polygon. Gaps longer than `DWELL_GRACE_S` are not counted. When total >= `DWELL_THRESHOLD_S`
the visitor is marked engaged once: an in-app notification is stored and, if SMTP is
configured, an email is sent in a background task. Spec value is 60 s; demo uses 10 s.

## Wiring the real CV worker
Copy `client/nexhibit_client.py` into `cv_track/` (needs `requests`). See its docstring.
The worker must (1) assign a visitor_id per track as soon as it has enough crops and keep
using it, (2) send foot points ~1/s, (3) optionally post an annotated JPEG.

## Deploying (Render)
Root directory `backend`, build `pip install -r requirements.txt`, start
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set `DATABASE_URL`, `CORS_ORIGINS`
(your frontend URL) and `API_KEY`. Use Postgres, not SQLite (free-tier disks are wiped).
The CV worker is not deployed here; it posts to this API over HTTPS.

## Known limits (honest list)
- Tables are created with `create_all`; there are no migrations.
- Heatmap is binned in Python from the `presence` table: fine for a demo, not for hours of data.
- Live state (latest people/frame) is in memory, so run one uvicorn worker.
- `/leads` returns personal data with no consent check; add a consent flag before real use.
- No user authentication; `API_KEY` only protects worker/admin endpoints.
