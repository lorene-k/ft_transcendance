import { Socket } from "socket.io";
import { Database } from "../src/plugins/dbplugin";
import "fastify";

declare module "fastify" {
    interface FastifyInstance {
        database: Database;
        io: Socket;
        sessionStore: SessionStore;
    }

    interface Session {
        authenticated?: boolean;
        userId?: number;
    }
}

declare module "socket.io" {
    interface Socket {
        session: Session;
        username: string;
    }
}