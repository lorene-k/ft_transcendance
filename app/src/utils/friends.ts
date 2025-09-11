import { FastifyInstance } from "fastify";
import { Namespace, Socket } from "socket.io";

interface Iuser {
    userId: number,
    socketId: string
}

interface Ifriendstatus {
    id: number,
    status: Boolean,
}

class friends {
    private constructor() { }
    static #instance: friends;
    private fastify: FastifyInstance | null = null;
    private namespace: Namespace | null = null
    private users: Iuser[] = []

    public static getInstance(fastify: FastifyInstance): friends {
        if (!this.#instance) {
            this.#instance = new friends();
            this.#instance.fastify = fastify
            this.#instance.namespace = fastify.io.of("/friends");
            this.#instance.init_socket();
        }
        return this.#instance;
    }

    private init_socket() {
        this.namespace!.on('connection', (socket: Socket) => {
            console.log(`${socket.handshake.auth.id} connected to friends`)
            this.users.push({
                userId: socket.handshake.auth.id,
                socketId: socket.id
            })

            socket.on("disconnect", (reason) => {
                const index = this.users.findIndex((va) => {
                    console.log(`${socket.handshake.auth.id} disconnected from friends`)
                    return (va.userId === socket.handshake.auth.id)
                })
                this.users.splice(index, 1);
            })
        })
    }

    private is_id_connected(id: number): Boolean {
        let status;
        const find = this.users.find((va) => {
            return (va.userId == id)
        })
        if (find)
            status = true
        else
            status = false
        return status
    }


    async friends_list(id: number): Promise<[Ifriendstatus]> {
        const request = await this.fastify!.database.fetch_all(`
            SELECT user_2 as friend FROM friends WHERE user_1 = ?
            `, [id]);
        let res: any = [];
        request.forEach((value) => {
            res.push({
                id: value.friend,
                status: this.is_id_connected(value.friend)
            });
        })
        console.log("listing friends db", request)
        console.log("listing connected user", this.users)
        console.log("match:", res)
        return res
    }
}

export default friends
