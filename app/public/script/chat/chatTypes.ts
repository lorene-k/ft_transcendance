export interface User {
    userId: string;
    username: string;
    self: boolean;
}
  
export interface Message {
  content: string;
  senderId: string;
  sentAt: string;
  isSent?: boolean;
  targetId?: string;
  senderUsername?: string;
}

export interface Invite {
  inviterId: string;
  inviterUsername: string;
  invitedId: string;
  timeoutId?: number;
}