declare const io: any;

//debug
declare global {
  interface Window {
    socket?: any;
  }
}

//debug#
let socket: any = null;

export function connectSocket(url?: string) {
  // Si une URL est fournie et différente, déconnecter l'ancienne socket
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

  // Mettre à jour la socket globale pour debug
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
    console.warn("Socket non connecté, impossible d'envoyer le message");
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
  console.log("Socket déconnecté (logout)");
}

export function reconnectSocket(newUrl: string) {
  console.log("Reconnexion socket vers:", newUrl);
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
