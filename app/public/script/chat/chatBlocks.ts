import { targetId } from "./chatUsers.js";
import { currentSessionId } from "./chat.js";

let blockedUsers: string[] = [];

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
        blockedUsers = (data as { blocked_id: number }[]).map(u => u.blocked_id.toString());
        console.log("in getBlockedUsers - blockedUsers = ", blockedUsers); // ! DEBUG
    } catch (err) {
        console.error("Failed to fetch or parse JSON:", err);
    }
}

function toggleBlockedMsg(isBlocked: boolean) {
    const blockedBtn = document.querySelector('[data-action="block-user"]');
    const blockedMsg = document.getElementById("blocked-msg") as HTMLElement;
    if (!blockedBtn || !blockedMsg) return;
    if (isBlocked) {
        blockedMsg.classList.remove("hidden");
        blockedBtn.textContent = "Unblock user";
    } else if (!isBlocked) {
        blockedMsg.classList.add("hidden");
        blockedBtn.textContent = "Block user";
    }
}

export function checkBlockedTarget(): boolean {
    const isBlocked = blockedUsers.includes(targetId!);
    console.log("targetId = ", targetId, "isBlocked =", isBlocked); // ! DEBUG
    isBlocked ? toggleBlockedMsg(true) : toggleBlockedMsg(false);
    return (isBlocked);
}

export function blockOrUnblockUser(socket: any) {
    const isBlocked = checkBlockedTarget();
    socket.emit("blockUser", { targetId: parseInt(targetId!), block: !isBlocked },
        (response: { status: string }) => {
        if (!response) {
            console.error("No response received from server.");
            return;
        }
        console.log("Response from server: ", response.status); // ! DEBUG
        toggleBlockedMsg(isBlocked);
        if (!isBlocked) blockedUsers.push(targetId!);
        else {
            const index = blockedUsers.indexOf(targetId!);
            if (index !== -1) blockedUsers.splice(index, 1);
            console.log(`User ${currentSessionId} unblocked user ${targetId}`);
        }
    });
}