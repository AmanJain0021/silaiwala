import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/constants';
import { getToken } from '../../utils/auth';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: {
          token: getToken()
        }
      });
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
