import fastify, { FastifyInstance, FastifyReply, FastifyRequest, } from "fastify";
import UserManager from "../../utils/user_manager.js";
import fs from "fs";
import { error } from "console";
import { userInfo } from "os";
import { REPL_MODE_SLOPPY } from "repl";

interface GameRow {
    id: string;
    player_1: string;
    score_player_1: string;
    player_2: string;
    score_player_2: string;
    winner: string;
}

interface IQuerystring {
    id?: number;
}

interface param {
    userId: number,
}

interface Ifriendremove {
    username: string,
}

async function friend_overlay(html: string, fastify: FastifyInstance, request: FastifyRequest) {
    let friends_list_html = "";
    const friends = await fastify.friends.friends_list(request.session.userId!)
    for (const friend of friends) {
        const user = new UserManager(friend.id, fastify)
        const userinfo = await user.info();
        friends_list_html += `<li class="flex items-center justify-between p-3 bg-white rounded-lg shadow border border-gray-200">
    <div class="flex items-center space-x-3 relative">
        <div class="relative">
        <img src="/api/account/picture/get/${friend.id}" alt="Friend Avatar"
            class="w-10 h-10 rounded-full border border-gray-300 object-cover">
        <!-- Online/Offline indicator -->
        <span class="absolute bottom-0 right-0 block w-3 h-3 rounded-full border-2 border-white ${friend.status ? "bg-green-500" : "bg-gray-400"}"
                data-status="online"></span>
        </div>
        <span class="font-medium text-gray-800">${userinfo.username}</span>
    </div>
    <button class="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition">
        &times;
    </button>
    </li>`
    }
    return html.replace('<!-- friends here -->', friends_list_html)
}

async function is_a_friend(fastify: FastifyInstance, self: number, other: number): Promise<Boolean> {
    const request = await fastify.database.fetch_one('SELECT id FROM friends WHERE user_1 = ? AND user_2 = ?', [self, other]);
    console.log("is a friend: ", request)
    if (request)
        return true
    return false

}

function cleanup_account_html(html: string, friend: Boolean) {
    return html.replace(`<label
                class="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700">
                <i class="fa fa-camera text-xs"></i>
                <input type="file" id="profile-upload" accept="image/*" class="hidden">
            </label>`, "")
        .replace(`<button class="text-gray-500 hover:text-blue-600" id="change_username_button">
                <i class="fa fa-pencil-alt text-sm"></i>
            </button>`, "")
        .replace(`<button class=" text-gray-500 hover:text-blue-600" id="change_email_button">
                <i class="fa fa-pencil-alt text-xs"></i>
            </button>`, "")
        .replace(`<!-- Small Camera Icon Button -->
            <label
                class="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 shadow-md">
                <i class="fa fa-camera text-xs"></i>
                <input type="file" id="profile-upload" accept="image/*" class="hidden">
            </label>`, "")
        .replace(`<button id="change_pwd_button"
            class="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 transition"
            data-i18n="account.changePass">
            Change Password
        </button>`, friend ? "" : `<button id="add_friend"
            class="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-700 transition">
            add friend
        </button>`)
}

export function getAccount(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        let id: number;
        let self: boolean = true;
        const requestquery = request.query as IQuerystring
        if (requestquery.id) {
            id = requestquery.id
            self = id === request.session.userId
        }
        else {
            id = request.session.userId as number
        }
        const user = new UserManager(id, fastify)
        const userinfo = await user.info();
        const games = await user.match.get_all()
        const match_stats = await user.match.stats()

        let match_history = "";
        games.forEach((row: GameRow) => {
            match_history += `
                    <tr class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b border-gray-300">${row.player_1}</td>
                    <td class="py-2 px-4 border-b border-gray-300">${row.player_2}</td>
                    <td class="py-2 px-4 border-b border-gray-300">${row.score_player_1} / ${row.score_player_2}</td>
                    <td class="py-2 px-4 border-b border-gray-300">${row.winner}</td>
                </tr>`;
        });
        const html = fs
            .readFileSync("./public/views/account.html")
            .toString()
            .replace("<!-- HISTORY -->", match_history)
            .replace("__USERNAME__", userinfo.username)
            .replace("__EMAIL__", userinfo.email)
            .replace("__WINS__", match_stats.win)
            .replace("__LOSSES__", match_stats.losses)
            .replace("__WINRATE__", match_stats.winrate + "%")
            .replace("__imageURL__", `/api/account/picture/get/${id}`)

        if (!self) {
            const friend = await is_a_friend(fastify, request.session.userId!, id)
            return reply
                .header("Content-Type", "text/html")
                .send(cleanup_account_html(html, friend));
        }
        else
            return reply
                .header("Content-Type", "text/html")
                .send(await friend_overlay(html, fastify, request));
    }
}

export function setPP(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const user = new UserManager(request.session.userId as number, fastify)
        const data = await request.file();
        if (!data) {
            return reply.code(400).send({ error: "No file uploaded" });
        }
        if (!data.mimetype.startsWith("image/")) {
            return reply.code(400).send({ error: "Invalid file type" });
        }
        await user.picture.set(data);
        return reply.code(200).send({ status: "done" })
    }
}

async function fetchGooglePic(fastify: FastifyInstance, userId: number, reply: FastifyReply) {
    const row = await fastify.database.fetch_one(
        `SELECT picture FROM user WHERE id = ? LIMIT 1`,
        [userId]
    );
    console.log("Fetched picture URL from DB:", row?.picture); // test
    if (row?.picture && row.picture.trim() !== "") {
        try {
            const response = await fetch(row.picture);
            const buffer = await response.arrayBuffer();
            return reply.header("Content-Type", response.headers.get("Content-type") || "image/jpeg").send(Buffer.from(buffer));
        } catch (err) {
            console.error("Failed to fetch Google picture:", err);
        }
    }
    return reply.header("Content-Type", "image/*").sendFile("ressources/default-profile-picture.jpg")

}

export function removefriend(fastify: FastifyInstance) {
    return async function (request: FastifyRequest<{ Params: Ifriendremove }>, reply: FastifyReply) {
        const { username } = request.params;
        const response = fastify.database.run(`DELETE FROM friends
                                WHERE user_1 = ?
                                AND user_2 = (
                                    SELECT id
                                    FROM user
                                    WHERE username = ?)`, [request.session.userId, username])
        console.log(`removing for ${request.session.userId} friend: ${username}, `, response)
        return reply.send({ "status": "done" })
    }
}

export function getPP(fastify: FastifyInstance) { // set up the request url string
    return async function (request: FastifyRequest<{ Params: param }>, reply: FastifyReply) {
        const { userId } = request.params;
        const user = new UserManager(userId, fastify)
        const data = await user.picture.get();
        if (!data) {
            return fetchGooglePic(fastify, userId, reply);
        }
        reply.header('Content-Type', `image/${data.title.substring(data.title.lastIndexOf(".") + 1)}`)
            .header("Cache-Control", "max-age=120").send(data.picture);
    }
}

interface changeEmailBody {
    email: string
}

export function changeEmail(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const new_email = (request.body as changeEmailBody).email
        const user = new UserManager(request.session.userId as number, fastify)

        if (user.changeEmail(new_email))
            return reply.code(200).send({ status: "succes, email changed" })
        else
            return reply.code(500).send({ error: "internal error" })
    }
}

interface changeUsernameBody {
    username: string
}

export function changeUsername(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const new_username = (request.body as changeUsernameBody).username
        const user = new UserManager(request.session.userId as number, fastify)

        if (user.changeusername(new_username))
            return reply.code(200).send({ status: "succes, username changed" })
        else
            return reply.code(500).send({ error: "internal error" })
    }
}

interface changePasswordBody {
    old?: string,
    password?: string
}

export function changePassword(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const user = new UserManager(request.session.userId as number, fastify)
        const { old, password } = request.body as changePasswordBody
        if (!old || !password)
            return reply.code(400).send({ error: "wrong arguments" })

        const res = await user.changePassword(old, password)
        if (res)
            return reply.code(200).send({ status: "succes" })
        else
            return reply.code(500).send({ error: "wrong password" })
    }
}
