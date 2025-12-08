# Frontend integration notes

- New component: `src/components/RequestTeacher.tsx` — simple UI to send student→teacher requests.
- Add pages for teacher to view requests: call `GET /api/requests/teacher`
- When a request is accepted the backend returns a `meetingLink` in the request document; use that to open the meeting in a new tab.
- For real-time updates, consider adding WebSocket or polling.

Meeting SDK:
- Use Agora / Zego / Daily for real-time video. Include SDK in frontend and exchange tokens via backend.
