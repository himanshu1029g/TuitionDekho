import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useChat } from "@/hooks/useChat";
import { getMessagesForRoom } from "@/lib/chatApi";

type ChatRoomProps = {
  roomId: string;
};

export default function ChatRoom({ roomId }: ChatRoomProps) {
  const { user } = useUser();
  const myId = user?.id!;
  const { messages, setMessages, sendMessage } = useChat(roomId, myId);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // -------- LOAD HISTORY --------
  useEffect(() => {
    if (!roomId) return;

    (async () => {
      setLoading(true);
      try {
        const res = await getMessagesForRoom(roomId, 1, 100);
        setMessages(res.messages || []);
      } catch (err) {
        console.error("Load history error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [roomId, setMessages]);

  // -------- SEND MESSAGE --------
  const handleSend = () => {
    if (!text.trim()) return;

    const [, idA, idB] = roomId.split("_");
    const recipientId = myId === idA ? idB : idA;

    sendMessage({
      roomId,
      senderId: myId,
      recipientId,
      text: text.trim(),
    });

    setText("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-3 font-semibold">Chat</div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {loading && (
          <div className="text-center text-gray-400">Loading messages…</div>
        )}

        {messages.map((m: any, i: number) => {
          const isMe = String(m.senderId) === String(myId);
          return (
            <div key={m._id || i} className={isMe ? "text-right" : "text-left"}>
              <div
                className={`inline-block px-3 py-2 rounded ${
                  isMe ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                {m.text}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(m.createdAt).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
