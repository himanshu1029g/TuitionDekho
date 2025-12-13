import { api } from './http';

export async function createOrGetChat(studentId: string, teacherId: string) {
  const res = await api.post('/chats', { studentId, teacherId });
  return res.data;
}

export async function getMessagesForRoom(roomId: string, page = 1, limit = 50) {
  const res = await api.get(`/chats/${encodeURIComponent(roomId)}/messages`, { params: { page, limit } });
  return res.data;
}

export async function getChatList(userId: string) {
  const res = await api.get(`/chats/user/${userId}/list`);
  return res.data;
}
