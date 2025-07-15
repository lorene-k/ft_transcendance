async function runInsertBlock(fastify, blockerId, blockedId) {
    return new Promise((resolve, reject) => {
        fastify.database.run(`INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)`, [blockerId, blockedId], function (err) {
            if (err) {
                console.error("Failed to insert blocked user:", err.message);
                return (reject(err));
            }
            resolve(this.lastID);
        });
    });
}
async function runDeleteBlock(fastify, blockerId, blockedId) {
    return new Promise((resolve, reject) => {
        fastify.database.run(`DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?`, [blockerId, blockedId], function (err) {
            if (err) {
                console.error("Failed to insert blocked user:", err.message);
                return (reject(err));
            }
            resolve(this.lastID);
        });
    });
}
export function handleBlocks(socket, fastify, io) {
    socket.on("blockUser", async (blocked, callback) => {
        try {
            const targetId = blocked.targetId;
            if (blocked.block) {
                const blockId = await runInsertBlock(fastify, socket.session.userId, targetId);
                console.log(`User ${socket.session.userId} blocked user ${targetId}, block ID: ${blockId}`);
                callback({ status: "blocked" });
            }
            else if (!blocked.block) {
                const res = await runDeleteBlock(fastify, socket.session.userId, targetId);
                console.log(`User ${socket.session.userId} unblocked user ${targetId}, result: ${res}`);
                callback({ status: "unblocked" });
            }
        }
        catch (err) {
            console.error("Error handling blockUser event:", err);
            callback({ status: "DB error" });
        }
    });
}
