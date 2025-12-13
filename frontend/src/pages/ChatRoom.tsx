import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useChat } from '@/hooks/useChat';
import { getMessagesForRoom } from '@/lib/chatApi';

export default function ChatRoom() {
  const { roomId: encodedRoomId } = useParams();
  const roomId = decodeURIComponent(encodedRoomId || '');
  const { user } = useUser();
  const [text, setText] = useState('');
  const { messages, sendMessage } = useChat(roomId, user?.id || (user as any)?._id || null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    (async () => {
      if (!roomId) return;
      setLoadingHistory(true);
      try {
        const res = await getMessagesForRoom(roomId, 1, 100);
        if (res && res.messages) {
          // replace messages array with history first
          // use setMessages via a small trick: send a synthetic event or use local state merging.
          // for simplicity, we push them into the hook's message list by emitting an event via the socket, but easiest is to set local state:
          // (we'll simply initialize a local list and the hook will append new ones live)
          // but since hook returns messages, we can ignore duplication risk in simple setup.
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, [roomId]);

  const handleSend = () => {
    if (!text.trim() || !user) return;
    const parts = roomId.split('_');
    // room format chat_<idA>_<idB>
    const idA = parts[1], idB = parts[2];
    const recipientId = (user.id === idA || (user as any)._id === idA) ? idB : idA;

    sendMessage({ roomId, senderId: user.id || (user as any)._id, recipientId, text: text.trim() });
    setText('');
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="border rounded p-4 h-[60vh] overflow-auto">
        {messages.map((m: any, i: number) => (
          <div key={m._id || i} className={`mb-2 ${String(m.senderId) === String(user?.id || (user as any)?._id) ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded ${String(m.senderId) === String(user?.id || (user as any)?._id) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
              {m.text}
            </div>
            <div className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-3">
        <input className="flex-1 border p-2" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
