import { io } from 'socket.io-client';

const VITE_WS = (import.meta.env.VITE_API_WS_URL as string) || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : '');

export const socket = io(VITE_WS || (import.meta.env.VITE_API_URL || 'http://localhost:5000'), {
  transports: ['websocket'],
  autoConnect: true,
});
