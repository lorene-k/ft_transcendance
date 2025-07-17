import { targetId } from "./chatUsers.js";
import { currentSessionId } from "./chat.js";
let blockedUsers = [];
export async function getBlockedUsers() {
    try {
        const res = await fetch(`/api/chat/blocked?blocker=${currentSessionId}`);
        const data = await res.json();
        if (res.status === 404) {
            console.log(data.message);
            return;
        }
        if (res.status === 500) {
            console.error(data.message);
            return;
        }
        blockedUsers = data.map(u => u.blocked_id.toString());
        // console.log("in getBlockedUsers - blockedUsers = ", blockedUsers); // ! DEBUG
    }
    catch (err) {
        console.error("Failed to fetch or parse JSON:", err);
    }
}
function toggleBlockedMsg(isBlocked) {
    const blockedBtn = document.querySelector('[data-action="block-user"]');
    const blockedMsg = document.getElementById("blocked-msg");
    if (!blockedBtn || !blockedMsg)
        return;
    if (isBlocked) {
        blockedMsg.classList.remove("hidden");
        blockedBtn.textContent = "Unblock user";
    }
    else if (!isBlocked) {
        blockedMsg.classList.add("hidden");
        blockedBtn.textContent = "Block user";
    }
}
export function checkBlockedTarget() {
    const isBlocked = blockedUsers.includes(targetId);
    // console.log("targetId = ", targetId, "isBlocked =", isBlocked); // ! DEBUG
    isBlocked ? toggleBlockedMsg(true) : toggleBlockedMsg(false);
    return (isBlocked);
}
export function blockOrUnblockUser(socket) {
    const isBlocked = checkBlockedTarget();
    socket.emit("blockUser", { targetId: parseInt(targetId), block: !isBlocked }, (response) => {
        if (!response)
            console.error("No response received from server."); // ! solve server ack pb
        else
            console.log("Response from server: ", response.status);
    });
    if (!isBlocked)
        blockedUsers.push(targetId);
    else {
        const index = blockedUsers.indexOf(targetId);
        if (index !== -1)
            blockedUsers.splice(index, 1);
    }
    checkBlockedTarget();
}
