import { Socket, Server as SocketIOServer } from "socket.io";
import { Database } from "../src/plugins/dbplugin";
import "fastify";

declare module "fastify" {
    interface FastifyInstance {
        database: Database;
        io: SocketIOServer;
        sessionStore: SessionStore;
    }

    interface Session {
        authenticated?: boolean;
        userId?: number;
    }
}

declare module "socket.io" {
    interface Socket extends Socket {
        session: Session;
        username: string;
    }
}
