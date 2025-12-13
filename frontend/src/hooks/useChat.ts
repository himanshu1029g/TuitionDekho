import { useEffect, useRef, useState } from 'react';
import { socket } from '@/lib/socket';

export function useChat(roomId: string | null, currentUserId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onReceive = (msg: any) => {
      if (!mountedRef.current) return;
      setMessages(prev => [...prev, msg]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receive_message', onReceive);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receive_message', onReceive);
    };
  }, []);

  useEffect(() => {
    if (!roomId) return;
    socket.emit('join_room', roomId);
    return () => {
      socket.emit('leave_room', roomId);
    };
  }, [roomId]);

  const sendMessage = (payload: { roomId: string; senderId: string; recipientId: string; text: string }) => {
    socket.emit('send_message', payload);
    setMessages(prev => [...prev, { ...payload, createdAt: new Date().toISOString() }]);
  };

  return { messages, connected, sendMessage, socket };
}
