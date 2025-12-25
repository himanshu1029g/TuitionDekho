# Backend enhancements applied

What's added:
- Request model and routes: `routes/requests.js` (create, list for teacher, accept/reject)
- Dockerfile.backend and docker-compose.yml (root of project_work/backend)
- Teacher list endpoint: GET /api/teachers/all (no caching)
- Notes: Redis and Kafka removed (Dec 2025) — caching and event streaming not used.

Environment variables to set:
- MONGO_URI
- MEETING_BASE_URL (optional)

