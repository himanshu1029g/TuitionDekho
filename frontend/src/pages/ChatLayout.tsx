import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { useLocation } from 'react-router-dom';
import { getChatList } from "@/lib/chatApi";
import ChatRoom from "./ChatRoom";

export default function ChatLayout() {
  const { user } = useUser();
  const [chatList, setChatList] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const res = await getChatList(user.id);
        setChatList(res.chats || []);
      } catch (err) {
        console.error("Chat list load error:", err);
      }
    })();
  }, [user]);

  // open initial room if navigated with state
  useEffect(() => {
    if (location && (location as any).state && (location as any).state.roomId) {
      setActiveRoom((location as any).state.roomId);
    }
  }, [location]);

  return (
    <div className="h-[80vh] flex border rounded overflow-hidden">
      {/* LEFT: Chat list */}
      <div className="w-1/3 border-r overflow-auto">
        {chatList.map((chat) => (
          <div
            key={chat.roomId}
            onClick={() => setActiveRoom(chat.roomId)}
            className={`p-3 cursor-pointer border-b hover:bg-gray-100 ${
              activeRoom === chat.roomId ? "bg-gray-200" : ""
            }`}
          >
            <div className="font-medium truncate">{chat.text}</div>
            <div className="text-xs text-gray-400">
              {new Date(chat.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT: Chat window */}
      <div className="flex-1">
        {activeRoom ? (
          <ChatRoom roomId={activeRoom} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select a chat
          </div>
        )}
      </div>
    </div>
  );
}
