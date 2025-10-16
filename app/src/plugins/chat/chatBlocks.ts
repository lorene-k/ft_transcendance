import { Socket } from "socket.io";
import { FastifyInstance } from "fastify";
import { BlockedUser } from "./chatTypes.js";
import { checkSessionExpiry } from "./chatplugin.js";

export async function checkBlockedTarget(senderId: number, targetId: number, fastify: FastifyInstance): Promise<boolean | null> {
    try {
        const isBlocked = await fastify.database.fetch_one(
            `SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?`,
            [targetId, senderId]
        );
        return (isBlocked ? true : false);
    } catch (err) {
        console.error("Error checking blocked target:", err);
        return (null);
    }
}

async function runInsertBlock(fastify: FastifyInstance, blockerId: number, blockedId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        fastify.database.run(
            `INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)`,
            [blockerId, blockedId],
            function (this: any, err: Error | null) {
                if (err) {
                    console.error("Failed to insert blocked user:", err.message);
                    return (reject(err));
                }
                resolve();
            });
    });
}

async function runDeleteBlock(fastify: FastifyInstance, blockerId: number, blockedId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        fastify.database.run(
            `DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?`,
            [blockerId, blockedId],
            function (this: any, err: Error | null) {
                if (err) {
                    console.error("Failed to insert blocked user:", err.message);
                    return (reject(err));
                }
                resolve();
            });
    });
}

export function handleBlocks(socket: Socket, fastify: FastifyInstance) {
    if (!checkSessionExpiry(socket)) return;
    socket.on("blockUser", async (blocked: BlockedUser, ack) => {
        try {
            const targetId = blocked.targetId;
            if (blocked.block)
                await runInsertBlock(fastify, socket.session.userId, targetId);
            else if (!blocked.block) await runDeleteBlock(fastify, socket.session.userId, targetId);
            if (ack) ack({ success: true });
        } catch (err: any) {
            console.error("Error handling blockUser event:", err);
            if (ack) ack({ success: false });
        }
    });
}