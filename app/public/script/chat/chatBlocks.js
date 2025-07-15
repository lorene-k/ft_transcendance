import { targetId } from "./chatUsers.js";
import { currentSessionId } from "./chat.js";
let blockedUsers = [];
const blockedBtn = document.querySelector('[data-action="block-user"]');
const blockedMsg = document.getElementById("blocked-msg");
export async function getBlockedUsers() {
    try {
        const res = await fetch(`/api/chat/blocked?blocker=${currentSessionId}`);
        const data = await res.json();
        if (res.status === 200) {
            console.log(data.message);
            return;
        }
        if (res.status === 500) {
            console.error(data.message);
            return;
        }
        console.log("Data received in getBlockedUsers = ", data); // ! DEBUG
        blockedUsers = data; // ! CHECK & CHANGE
    }
    catch (err) {
        console.error("Failed to fetch or parse JSON:", err);
    }
}
function toggleBlockedMsg(isBlocked) {
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
    if (isBlocked)
        toggleBlockedMsg(true);
    return (isBlocked);
}
export function blockOrUnblockUser(socket) {
    const isBlocked = checkBlockedTarget();
    socket.emit("blockUser", { targetId: parseInt(targetId), block: !isBlocked });
    toggleBlockedMsg(isBlocked);
    if (!isBlocked) {
        blockedUsers.push(targetId);
        console.log(`User ${currentSessionId} blocked user ${targetId}`);
    }
    else {
        const index = blockedUsers.indexOf(targetId);
        if (index !== -1)
            blockedUsers.splice(index, 1);
        console.log(`User ${currentSessionId} unblocked user ${targetId}`);
    }
}
