import { Socket, Server as SocketIOServer } from "socket.io";
import { Database } from "../src/plugins/dbplugin.ts";
import "fastify";
import { SessionStore } from "@fastify/session";
import friends from "../src/utils/friends.ts";

declare module "fastify" {
    interface FastifyInstance {
        database: Database;
        io: SocketIOServer;
        sessionStore: SessionStore;
        friends: friends;
    }

    interface Session {
        authenticated?: boolean;
        userId?: number;
        socketId?: string;
    }
}

declare module "socket.io" {
    interface Socket extends Socket {
        session: Session;
        username: string;
    }
}
interface Player {
    id?: number;
    session?: FastifySessionObject | undefined;
    socket?: any;
    username: string | undefined;
    online?: boolean;
    role?: 'player1' | 'player2' | null;
}

declare module "NodeJS" {
    interface ProcessEnv {
        GOOGLE_CLIENT_ID: string;
        GOOGLE_CLIENT_SECRET: string;
        SESSION_SECRET: string;
    }
}
