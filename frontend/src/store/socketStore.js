import { create } from 'zustand';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { getToken } from '../utils/auth';

const useSocketStore = create((set, get) => ({
    socket: null,
    isConnected: false,

    connect: (userId, role) => {
        const existing = get().socket;
        const currentToken = getToken();

        // Reuse active socket connection if already connected
        if (existing && existing.connected) {
            if (userId) {
                existing.emit('join_user_room', String(userId));
                if (role === 'delivery') existing.emit('join', 'delivery_partners');
                else if (role === 'admin') existing.emit('join_admin_room');
            }
            return existing;
        }

        if (existing) {
            existing.disconnect();
        }

        console.log('Initializing Socket.IO connection...');
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            auth: {
                token: currentToken
            }
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            set({ isConnected: true });
            
            if (userId) {
                newSocket.emit('join_user_room', String(userId));
                
                if (role === 'delivery') {
                    newSocket.emit('join', 'delivery_partners');
                } else if (role === 'admin') {
                    newSocket.emit('join_admin_room');
                }
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            set({ isConnected: false });
        });

        set({ socket: newSocket });
        return newSocket;
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
            console.log('Socket disconnected manually');
        }
    }
}));

export default useSocketStore;
