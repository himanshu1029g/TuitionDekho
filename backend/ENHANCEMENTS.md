# Backend enhancements applied

What's added:
- Request model and routes: `routes/requests.js` (create, list for teacher, accept/reject)
- Redis client `services/redisClient.js` used for caching teacher list
- Kafka producer `services/kafka.js` (kafkajs) to log events to topics: request-logs, search-logs
- Dockerfile.backend and docker-compose.yml (root of project_work/backend)
- Teacher list caching endpoint: GET /api/teachers (30s cache)
- Notes: Meeting integration currently creates a placeholder meetingLink (MEETING_BASE_URL + uuid).
  Replace with real 3rd-party SDK (Agora / Zego / Daily / Jitsi) as described in guidance.

Environment variables to set:
- MONGO_URI
- REDIS_URL
- KAFKA_BROKERS
- MEETING_BASE_URL (optional)

