import { Socket } from "socket.io";
import { FastifyInstance } from "fastify";

interface BlockedUser {
  targetId: number;
  block: boolean;
}

async function runInsertBlock(fastify: FastifyInstance, blockerId: number, blockedId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      fastify.database.run(
        `INSERT INTO blocks (blocker_id, blocked_id) VALUES (?, ?)`,
        [blockerId, blockedId],
        function (this: any, err: Error | null) {
        if (err) {
          console.error("Failed to insert blocked user:", err.message);
          return (reject(err));
        }
        resolve(this.lastID);
      });
    });
}

async function runDeleteBlock(fastify: FastifyInstance, blockerId: number, blockedId: number): Promise<number> {
    return new Promise((resolve, reject) => {
        fastify.database.run(
          `DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?`,
          [blockerId, blockedId],
          function (this: any, err: Error | null) {
          if (err) {
            console.error("Failed to insert blocked user:", err.message);
            return (reject(err));
          }
          resolve(this.lastID);
        });
      });
}

export function handleBlocks(socket: Socket, fastify: FastifyInstance, io: any) {
    socket.on("blockUser", async (blocked: BlockedUser, callback) => {
        try {
          const targetId = blocked.targetId;
          let response = "";
            if (blocked.block) {
                const blockId = await runInsertBlock(fastify, socket.session.userId, targetId);
                if (!blockId) throw new Error("Failed to block user");
                response = "blocked";
                // console.log(`User ${socket.session.userId} blocked user ${targetId}, block ID: ${blockId}`); // ! DEBUG
            } else if (!blocked.block) {
                const res = await runDeleteBlock(fastify, socket.session.userId, targetId);
                if (!res) throw new Error("Failed to unblock user");
                response = "unblocked";
                // console.log(`User ${socket.session.userId} unblocked user ${targetId}, result: ${res}`); // ! DEBUG
            }
            return callback({ status: response });
        } catch (err: any) {
            console.error("Error handling blockUser event:", err);
            callback({ status: "error"});
        }
    });
}

//  Without response
// export function handleBlocks(socket: Socket, fastify: FastifyInstance, io: any) {
//   socket.on("blockUser", async (blocked: BlockedUser) => {
//       try {
//         const targetId = blocked.targetId;
//           if (blocked.block) {
//               const blockId = await runInsertBlock(fastify, socket.session.userId, targetId);
//               if (!blockId) throw new Error("Failed to block user");
//           } else if (!blocked.block) {
//               const res = await runDeleteBlock(fastify, socket.session.userId, targetId);
//               if (!res) throw new Error("Failed to unblock user");
//           }
//       } catch (err: any) {
//           console.error("Error handling blockUser event:", err);
//       }
//   });
// }
