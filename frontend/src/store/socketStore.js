import { create } from 'zustand';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { getToken } from '../utils/auth';

const useSocketStore = create((set, get) => ({
    socket: null,
    isConnected: false,

    connect: (userId, role) => {
        // Prevent multiple connections
        if (get().socket) {
            console.log('Socket currently active. Updating rooms...');
            get().socket.emit('join_user_room', userId);
            if (role === 'delivery') get().socket.emit('join', 'delivery_partners');
            if (role === 'admin') get().socket.emit('join_admin_room');
            return;
        }

        console.log('Initializing Socket.IO connection...');
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            auth: {
                token: getToken()
            }
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected:', newSocket.id);
            set({ isConnected: true });
            
            if (userId) {
                newSocket.emit('join_user_room', userId);
                
                // Role-based room joins
                if (role === 'delivery') {
                    newSocket.emit('join', 'delivery_partners');
                } else if (role === 'admin') {
                    newSocket.emit('join_admin_room');
                }
            }
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            set({ isConnected: false });
        });

        set({ socket: newSocket });
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
