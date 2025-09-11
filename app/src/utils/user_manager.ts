import { MultipartFile } from "@fastify/multipart"
import { FastifyInstance } from "fastify"
import bcrypt from "bcrypt"

interface picture_el {
    picture: Buffer,
    title: string
}

class picture {
    private user_id: number
    private fastify: FastifyInstance
    private static query_picture_get: string = "SELECT title, picture FROM profile p WHERE p.user_id = ?"
    private static query_picture_update: string = "UPDATE profile SET title = ?, picture = ? WHERE user_id = ?"
    private static query_picture_create: string = "INSERT INTO profile (title, picture, user_id) VALUES (?,?,?)"

    constructor(user_id: number, fastify: FastifyInstance) {
        this.user_id = user_id
        this.fastify = fastify
    }

    async get() {
        const res = await this.fastify.database.fetch_one(picture.query_picture_get, [this.user_id]) as picture_el | null
        return res
    }

    async getGgPic() {
        return await this.fastify.database.fetch_one(
            'SELECT picture, picture FROM user WHERE id = ?',
            [this.user_id]
        );
    }

    async set(image: MultipartFile) {
        const current = await this.get()
        const data = await image.toBuffer();
        if (current) {
            this.fastify.log.info({picture: `picture updated by user ${this.user_id}`}) //math mod
            // this.fastify.log.info("picture", `picture updated by user ${this.user_id}`) //math mod
            return this.fastify.database.prepare(picture.query_picture_update).run([`${Date.now()}-${image.filename}`, data, this.user_id])
        } else {
            // this.fastify.log.info("picture", `picture created by user ${this.user_id}`)
            this.fastify.log.info({picture: `picture created by user ${this.user_id}`}) //math mod
            return this.fastify.database.prepare(picture.query_picture_create).run([`${Date.now()}-${image.filename}`, data, this.user_id])
        }
    }
}

interface stats {
    game_number: string,
    win: string,
    losses: string,
    winrate: string
}

class match {
    private user_id: number
    private fastify: FastifyInstance
    private static query_get_match: string = `SELECT m.id, u1.username as player_1, m.score_player_1, u2.username as player_2, m.score_player_2, w.username as winner FROM "match" m
                                                INNER JOIN user u1 ON m.player_1 = u1.id
                                                INNER JOIN user u2 ON m.player_2 = u2.id
                                                INNER JOIN user w ON m.winner = w.id
                                                WHERE m.player_1 == ? OR m.player_2 == ?
                                                LIMIT ?`
    private static query_stats: string = `WITH player_stats AS (
                                                SELECT
                                                    COUNT(*) AS game_number,
                                                    SUM(CASE WHEN m.winner = ? THEN 1 ELSE 0 END) AS win
                                                FROM match m
                                                WHERE m.player_1 = ? OR m.player_2 = ?
                                            )
                                            SELECT
                                                game_number,
                                                win,
                                                game_number - win AS losses,
                                                ROUND((win * 1.0 / game_number) * 100, 2) AS winrate
                                            FROM player_stats;`

    constructor(user_id: number, fastify: FastifyInstance) {
        this.user_id = user_id
        this.fastify = fastify
    }

    async get_all(limit = 10) {
        return this.fastify.database.fetch_all(match.query_get_match, [this.user_id, this.user_id, limit]);
    }

    async stats(): Promise<stats> {
        return this.fastify.database.fetch_one(match.query_stats, [this.user_id, this.user_id, this.user_id]);
    }
}

export default class UserManager {
    private id: number
    private fastify: FastifyInstance
    picture: picture
    match: match
    private static query_info: string = "SELECT username, email FROM user WHERE id=?"
    private static query_updateEmail: string = `UPDATE user
                                                    SET email = ?
                                                    WHERE id = ?`
    private static query_updateUsername: string = `UPDATE user
                                                    SET username = ?
                                                    WHERE id = ?`
    private static query_get_password: string = "SELECT password FROM user WHERE id=?"
    private static query_update_password: string = `UPDATE user
                                                        SET password = ?
                                                        WHERE id=?`

    constructor(user_id: number, fastify: FastifyInstance) {
        this.fastify = fastify
        this.id = user_id
        this.picture = new picture(user_id, fastify)
        this.match = new match(user_id, fastify)
    }

    async info() {
        const resp = await this.fastify.database.fetch_one(UserManager.query_info, [this.id])
        return resp
    }

    changeEmail(new_email: string) {
        let _err = null;
        this.fastify.database.run(UserManager.query_updateEmail, [new_email, this.id], err => {
            if (err) {
                this.fastify.log.error(err);
                _err = err
            }
        })
        if (_err)
            return false
        else
            return true
    }

    changeusername(new_username: string) {
        let _err = null;
        this.fastify.database.run(UserManager.query_updateUsername, [new_username, this.id], err => {
            if (err) {
                this.fastify.log.error(err);
                _err = err
            }
        })
        if (_err)
            return false
        else
            return true
    }

    async changePassword(current: string, new_pwd: string): Promise<boolean> {
        const row = await this.fastify.database.fetch_one(UserManager.query_get_password, [this.id]);
        if (await bcrypt.compare(current, row.password)) {
            this.fastify.database.run(UserManager.query_update_password, [await bcrypt.hash(new_pwd, 10), this.id])
            return true
        } else {
            return false
        }
    }
}
