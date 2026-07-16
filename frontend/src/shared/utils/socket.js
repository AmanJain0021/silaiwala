import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/constants';
import { getToken } from '../../utils/auth';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentUserId = null;
  }

  connect() {
    const token = getToken();
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: {
          token: token
        }
      });
      
      // Automatically rejoin rooms on reconnection
      this.socket.on('connect', () => {
        if (this.currentUserId) {
          this.socket.emit('join_user_room', this.currentUserId);
          this.socket.emit('join', 'delivery_partners');
        }
      });
    } else {
      this.socket.auth = { token: token };
    }

    if (token && !this.socket.connected) {
      this.socket.connect();
    }
    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    const socket = this.getSocket();
    socket.emit(event, data);
  }

  deliveryRegister(userId) {
    const socket = this.getSocket();
    this.currentUserId = userId;
    if (userId) {
      socket.emit('join_user_room', userId);
    }
    socket.emit('join', 'delivery_partners');
  }

  on(event, callback) {
    const socket = this.getSocket();
    socket.on(event, callback);
  }

  off(event, callback) {
    const socket = this.getSocket();
    socket.off(event, callback);
  }
}

const socketService = new SocketService();
export default socketService;
