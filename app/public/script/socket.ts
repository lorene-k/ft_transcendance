declare const io: any;
declare global {
    interface Window {
        socket?: any;
    }
}

let socket: any = null;

export function connectSocket(url?: string) {
    const socketUrl = url || 'https://localhost:8080';

    if (socket && socket.connected) {
        if (socket.io.uri !== socketUrl) {
            socket.disconnect();
            socket = null;
        } else {
            return socket;
        }
    }

    socket = io(socketUrl, { withCredentials: true });

    window.socket = socket;

    socket.on('connect', () => {
    });

    socket.on('disconnect', (reason: any) => {
    });

    socket.on('log', (message: string) => {
    });

    return socket;
}

export function log(message: string) {
    if (!socket || !socket.connected) {
        return;
    }
    socket.emit('log', message);
}

export function logout() {
    if (!socket) return;
    socket.disconnect();
    socket = null;
    if (window.socket) {
        window.socket = null;
    }
}

export function reconnectSocket(newUrl: string) {
    if (socket) {
        socket.disconnect();
    }
    socket = null;
    return connectSocket(newUrl);
}

export function getCurrentSocket() {
    return socket;
}

export { socket };
