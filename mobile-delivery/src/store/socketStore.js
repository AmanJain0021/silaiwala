// Port of frontend/src/store/socketStore.js — same socket.io-client as the web.
import { create } from 'zustand';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../lib/config';
import { getToken } from '../lib/auth';

const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (userId, role) => {
    const existing = get().socket;
    const currentToken = getToken();

    if (existing && (existing.connected || !existing.disconnected)) {
      if (userId && existing.connected) existing.emit('join_user_room', String(userId));
      return existing;
    }
    if (existing) existing.disconnect();

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: { token: currentToken },
    });

    newSocket.on('connect', () => {
      set({ isConnected: true });
      if (userId) newSocket.emit('join_user_room', String(userId));
    });
    newSocket.on('disconnect', () => set({ isConnected: false }));

    set({ socket: newSocket });
    return newSocket;
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));

export default useSocketStore;
