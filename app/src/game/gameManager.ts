import { Room } from './room.js'
import { FastifySessionObject } from "@fastify/session";
import { FastifyInstance } from "fastify";
import { Player } from "../../includes/custom.js";
import { WaitList } from "./waitList.js";
import * as cookie from "cookie";
import { Socket } from "socket.io";

//Singleton GameManager
export class GameManager {
    // tableau de room
    private rooms: Room[] = [];
    private fastify: FastifyInstance | null = null;
    private mapPlayer: Map<number, Player> = new Map<number, Player>();
    private waitList: WaitList = new WaitList;

    // Stockage des résultats de tournoi pour gestion des finales/ demi finales
    private tournamentResults: Map<string, {
        semifinals: Array<{ matchId: string, winner: Player | null }>,
        finalists: Player[],
        finaleCreated: boolean
    }> = new Map();

    static #instance: GameManager
    private constructor() { }

    public static getInstance(server: FastifyInstance): GameManager {
        if (!this.#instance) {
            this.#instance = new GameManager();
            this.#instance.configureSocketIO(server);
            this.#instance.fastify = server;
            this.#instance.waitList = new WaitList();
            this.#instance.waitList.setMaxListeners(100);


            // event lancé par la waitlist
            this.#instance.waitList.on('RemoteMatchCreated', ({ player1, player2 }) => {
                this.#instance.handleNewRoom(player1, player2);

            });
            this.#instance.waitList.on('TournamentMatchCreated', ({ players }) => {
                // Créer un tournoi avec les 4 joueurs
                this.#instance.handleTournamentCreated(players);
            });
            this.#instance.waitList.on('InviteMatchCreated', ({ player1, player2 }) => {
                this.#instance.handleNewRoom(player1, player2);
            });
        }
        return this.#instance;
    };

    private handleNewRoom(player1: Player, player2: Player) {
        const room = new Room("remote", player1, player2);
        this.rooms.push(room);
        if (player1.socket && player1.socket.connected) {
            player1.socket.emit('player_info', room.sendPlayerType(player1.session.userId));
        }
        if (player2.socket && player2.socket.connected) {
            player2.socket.emit('player_info', room.sendPlayerType(player2.session.userId));
        }
    }

    private handleTournamentCreated(players: Player[]) {
        const tournamentId = `tournament_${Date.now()}`;
        this.tournamentResults.set(tournamentId, {
            semifinals: [
                { matchId: `${tournamentId}_semifinal_1`, winner: null },
                { matchId: `${tournamentId}_semifinal_2`, winner: null }
            ],
            finalists: [],
            finaleCreated: false
        });

        const match1 = new Room("tournament", players[0], players[1]);
        match1.tournamentId = tournamentId;
        match1.matchType = 'semifinal';
        match1.matchInfo = 'Demi-finale 1/2';
        match1.id = `${tournamentId}_semifinal_1`;

        const match2 = new Room("tournament", players[2], players[3]);
        match2.tournamentId = tournamentId;
        match2.matchType = 'semifinal';
        match2.matchInfo = 'Demi-finale 2/2';
        match2.id = `${tournamentId}_semifinal_2`;

        this.rooms.push(match1, match2);

        if (players[0].socket && players[0].socket.connected) {
            players[0].socket.emit('player_info', match1.sendPlayerType(players[0].session.userId));
        }
        if (players[1].socket && players[1].socket.connected) {
            players[1].socket.emit('player_info', match1.sendPlayerType(players[1].session.userId));
        }
        if (players[2].socket && players[2].socket.connected) {
            players[2].socket.emit('player_info', match2.sendPlayerType(players[2].session.userId));
        }
        if (players[3].socket && players[3].socket.connected) {
            players[3].socket.emit('player_info', match2.sendPlayerType(players[3].session.userId));
        }
        if (players[0].socket && players[1].socket && players[0].socket.connected && players[1].socket.connected) {
            players[0].socket.emit('match_found', {
                opponent: players[1].username,
                matchType: 'tournament_semifinal',
                tournamentInfo: 'Demi-finale 1/2'
            });
            players[1].socket.emit('match_found', {
                opponent: players[0].username,
                matchType: 'tournament_semifinal',
                tournamentInfo: 'Demi-finale 1/2'
            });
        }

        if (players[2].socket && players[3].socket && players[2].socket.connected && players[3].socket.connected) {
            players[2].socket.emit('match_found', {
                opponent: players[3].username,
                matchType: 'tournament_semifinal',
                tournamentInfo: 'Demi-finale 2/2'
            });
            players[3].socket.emit('match_found', {
                opponent: players[2].username,
                matchType: 'tournament_semifinal',
                tournamentInfo: 'Demi-finale 2/2'
            });
        }
    }

    public async getUsername(userId: number): Promise<string> {
        return new Promise((resolve, reject) => {
            this.fastify!.database.get(
                'SELECT username FROM user WHERE id = ?',
                [userId],
                (err: Error | null, row: any) => {
                    if (err) {
                        reject(new Error("Erreur lors de la récupération du username: " + err.message));
                    } else if (!row || !row.username) {
                        reject(new Error("Aucun utilisateur trouvé pour cet ID"));
                    } else {
                        resolve(row.username);
                    }
                }
            );
        });
    }

    private configureSocketIO(server: FastifyInstance): void {
        server.ready().then(() => {
            server.io.on("connection", (socket) => {
                const sessionId = this.extractSessionIdFromSocket(socket);
                if (!sessionId) {
                    console.warn("Aucun cookie de session trouvé, connexion ignorée");
                    return;
                }

                this.getSessionFromDb(sessionId)
                    .then(async (sessionData) => {
                        if (!sessionData) {
                            console.warn(`Aucune session trouvée pour le SID : ${sessionId}`);
                            return;
                        }

                        const userId = sessionData.userId;
                        if (!userId) {
                            console.warn("Session trouvée mais sans userId, déconnexion forcée");
                            socket.disconnect();
                            return;
                        }

                        let username: string;
                        try {
                            username = await this.getUsername(userId);
                        } catch {
                            console.warn("Impossible de récupérer le username");
                            username = sessionData.username || "undefined";
                        }
                        this.managePlayerConnection(userId, username, sessionData, socket);
                        this.waitList.checkPendingInvites(String(userId));
                        this.setupSocketEvents(userId, socket);
                    })
                    .catch((error) => {
                        console.error("Erreur lors de la récupération de la session :", error);
                    });
            });
        });
    }

    private extractSessionIdFromSocket(socket: any): string | null {
        const cookies = cookie.parse(socket.handshake.headers.cookie || "");
        const rawSessionId = cookies.sessionId;
        if (!rawSessionId) return null;

        return rawSessionId.startsWith("s:")
            ? rawSessionId.slice(2).split('.')[0]
            : rawSessionId.split('.')[0];
    }


    private getSessionFromDb(sessionId: string): Promise<any | null> {
        return new Promise((resolve, reject) => {
            this.fastify?.database.get(
                `SELECT session FROM session WHERE sid = ?`,
                [sessionId],
                (err: Error | null, row: any) => {
                    if (err) return reject(err);
                    if (!row) return resolve(null);

                    try {
                        const sessionData = JSON.parse(row.session);
                        resolve(sessionData);
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    }

    private managePlayerConnection(userId: number, username: string, sessionData: any, socket: any): void {
        let player = this.mapPlayer.get(userId);

        if (!player) {
            player = {
                session: sessionData,
                socket: socket,
                username: username,
                online: true,
                role: null,
            };
            this.mapPlayer.set(userId, player);
        } else {
            if (player.socket && player.socket.id !== socket.id) {
                player.socket.disconnect(true);
            }
            player.socket = socket;
            player.online = true;
            player.session = sessionData;
            player.username = username;
        }
    }


    private setupSocketEvents(userId: number, socket: any): void {
        socket.on("get_username", () => {
            this.sendUsername(userId, socket);
        });
        socket.on("leave_final", () => {
            this.handleLeaveGame(userId);
        });
        socket.on("leave_game", () => {
            this.handleLeaveGame(userId);
        });
        socket.on("cancel_queue", () => {
            this.waitList.removePlayer(userId);
        });
        socket.on("leave_tournament", () => {
            this.waitList.removePlayerFromTournament(userId);
        });

        socket.on("disconnect", () => {
            const player = this.mapPlayer.get(userId);
            if (player) {
                player.online = false;
                player.socket = null;
                this.waitList.removePlayerFromAll(userId);
                this.checkRoomsStatus();
                this.handleLeaveGame(userId);
            }
        });

        socket.on("get_player_type", () => {
            const playerRoom = this.rooms.find(room => room.players.some(p => p.session.userId === userId));
            if (!playerRoom) {
                if (socket && socket.connected)
                    socket.emit('player_type', { playerType: null, player1_username: null, player2_username: null });
                return;
            }
            let playerType: 'player1' | 'player2' | null = null;
            if (playerRoom.players[0].session.userId === userId) {
                playerType = 'player1';
            } else if (playerRoom.players[1].session.userId === userId) {
                playerType = 'player2';
            }
            if (socket && socket.connected)
                socket.emit('player_type', {
                    playerType,
                    player1_username: playerRoom.players[0].username,
                    player2_username: playerRoom.players[1].username
                });
        });
    }
    removeFromFinalists(userId: number): void {
        this.tournamentResults.forEach((tournamentData) => {
            tournamentData.finalists = tournamentData.finalists.filter(player => player.session.userId !== userId);
            if (tournamentData.finalists.length === 0) {
                tournamentData.finaleCreated = false;
            }
        });
    }

    getOtherFinalist(userId: number): Player | null {
        for (const tournamentData of this.tournamentResults.values()) {
            const finalist = tournamentData.finalists.find(player => player.session.userId !== userId);
            if (finalist) {
                return finalist;
            }
        }
        return null;
    }


    public async socketPlayerMatch(userSession: FastifySessionObject): Promise<Player | undefined> {
        if (userSession.userId) {
            const value = this.mapPlayer.get(userSession.userId);
            if (!value) {
                return;
            }
            return value;
        }
    }

    public async addRoom(mode: string, userSession: FastifySessionObject): Promise<void>;
    public async addRoom(mode: string, userSession: FastifySessionObject, player1: string, player2: string): Promise<void>;

    public async addRoom(mode: string, userSession: FastifySessionObject, player1?: string, player2?: string): Promise<void> {
        const player = await this.socketPlayerMatch(userSession);
        if (!player) {
            console.error("Cannot find session with sessionID");
            return;
        }

        if (mode === "local") {
            this.createGuest((guest) => {
                if (!guest) return;
                const room = new Room(mode, player, guest);
                this.rooms.push(room);
                if (player.socket && player.socket.connected) {
                    player.socket.emit('player_info', room.sendPlayerType(player.session.userId));
                }
            });
        }

        if (mode === "remote") {
            this.waitList.addRemote(player);
        }

        if (mode == "invite") {
            if (player1 && player2) {
                this.waitList.addInvite(player1, player2, player);
            }
        }

        if (mode === "tournament") {
            this.waitList.addTournament(player);
        }
    }

    private createGuest(callback: (guest: Player | null) => void): void {
        if (!this.fastify) {
            console.error("Fastify non initialisé.");
            callback(null);
            return;
        }

        this.fastify.database.get(
            `SELECT id, username FROM user WHERE username = ?`,
            ['guest'],
            (err: Error | null, row: any) => {
                if (err) {
                    console.error("Erreur SQL pour récupérer le guest :", err.message);
                    callback(null);
                    return;
                }

                if (!row) {
                    console.error("Aucun utilisateur 'guest' trouvé.");
                    callback(null);
                    return;
                }

                const guest: Player = {
                    session: { userId: row.id } as any,
                    socket: null,
                    username: row.username,
                    online: false,
                    role: null,
                };

                callback(guest);
            }
        );
    }

    public async checkRoomsStatus(): Promise<void> {
        for (const room of [...this.rooms]) {
            if (room.isMatchActive() == false) {
                if (room.mode === "tournament" && room.matchType === "semifinal" && room.tournamentId) {
                    this.handleSemifinalResult(room);
                }
                await this.addInfoDb(room);
                room.cleanupResources();
                this.rooms = this.rooms.filter(r => r !== room);
            }
        }
    }

    private handleSemifinalResult(room: Room): void {
        const tournamentId = room.tournamentId!;
        const winner = room.winner;

        let tournamentData = this.tournamentResults.get(tournamentId);
        if (!tournamentData) {
            console.warn(`Données de tournoi introuvables pour ${tournamentId}`);
            return;
        }

        const semifinalIndex = tournamentData.semifinals.findIndex(sf => sf.matchId === room.id);
        if (semifinalIndex !== -1) {
            tournamentData.semifinals[semifinalIndex].winner = winner;
            tournamentData.finalists.push(winner);
        }

        const completedSemifinals = tournamentData.semifinals.filter(sf => sf.winner !== null);
        if (completedSemifinals.length === 2 && !tournamentData.finaleCreated) {
            this.createTournamentFinal(tournamentId, tournamentData.finalists);
            tournamentData.finaleCreated = true;
        }
        this.tournamentResults.set(tournamentId, tournamentData);
    }

    private createTournamentFinal(tournamentId: string, finalists: Player[]): void {
        if (finalists.length !== 2) {
            finalists.forEach(player => {
                if (player.socket && player.socket.connected) {
                    player.socket.emit('opponent_left', {
                        message: "Ton adversaire a quitté avant la finale, la finale est annulée.",
                        reason: 'finalist_quit'
                    });
                }
            });
            return;
        }

        const finalRoom = new Room("tournament", finalists[0], finalists[1]);
        finalRoom.tournamentId = tournamentId;
        finalRoom.matchType = 'final';
        finalRoom.matchInfo = 'FINALE';
        finalRoom.id = `${tournamentId}_final`;

        this.rooms.push(finalRoom);
        if (finalists[0].socket && finalists[0].socket.connected) {
            finalists[0].socket.emit('player_info', finalRoom.sendPlayerType(finalists[0].session.userId));
        }
        if (finalists[1].socket && finalists[1].socket.connected) {
            finalists[1].socket.emit('player_info', finalRoom.sendPlayerType(finalists[1].session.userId));
        }

        if (finalists[0].socket && finalists[1].socket && finalists[0].socket.connected && finalists[1].socket.connected) {
            finalists[0].socket.emit('tournament_final', {
                opponent: finalists[1].username,
                message: 'C\'est la FINALE ! Bonne chance !'
            });
            finalists[1].socket.emit('tournament_final', {
                opponent: finalists[0].username,
                message: 'C\'est la FINALE ! Bonne chance !'
            });
        }
    }

    private async addInfoDb(match: Room): Promise<void> {
        const matchDuration = (match.time_end != null && match.time_begin != null)
            ? Math.floor((match.time_end - match.time_begin) / 1000)
            : 0;
        const player1Id = match.players[0].session.userId;
        const player2Id = match.players[1].session.userId;
        const player1Score = match.gameLogic.player1Score;
        const player2Score = match.gameLogic.player2Score;
        const winnerId = match.winner.session.userId;
        const dateMatch = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const mode = match.mode;

        if (this.fastify) {
            await new Promise<void>((resolve, reject) => {
                this.fastify!.database.run(
                    `INSERT INTO match (
                    player_1, score_player_1,
                    player_2, score_player_2,
                    winner, date, match_duration, mode
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [player1Id, player1Score, player2Id, player2Score, winnerId, dateMatch, matchDuration, mode],
                    function (err: Error | null) {
                        if (err) {
                            console.error("Error:", err.message);
                            reject(err);
                        } else {
                            resolve();
                        }
                    }
                );
            });
        }
    }

    private handleLeaveGame(userId: number): void {
        const player = this.mapPlayer.get(userId);
        if (!player) return;
        const playerRoom = this.rooms.find(room =>
            room.players.some(p => p.session.userId === userId)
        );
        if (playerRoom && playerRoom.mode === "tournament" && playerRoom.tournamentId) {
            const tournamentId = playerRoom.tournamentId;
            const tournamentData = this.tournamentResults.get(tournamentId);

            if (playerRoom.matchType === 'final') {
                const allSemifinalRooms = this.rooms.filter(r =>
                    r.tournamentId === tournamentId &&
                    r.matchType === 'semifinal'
                );
                allSemifinalRooms.forEach(semifinalRoom => {
                    semifinalRoom.players.forEach(p => {
                        if (p.socket && p.socket.connected) {
                            p.socket.emit('opponent_left', {
                                message: "Le tournoi est annulé : un finaliste a quitté, la finale n'aura pas lieu.",
                                reason: 'tournament_aborted'
                            });
                        }
                    });
                    semifinalRoom.forceEndMatch?.();
                });

                const otherFinalist = playerRoom.players.find(p => p.session.userId !== userId);
                if (otherFinalist && otherFinalist.socket && otherFinalist.socket.connected) {
                    otherFinalist.socket.emit('opponent_left', {
                        message: "Ton adversaire a quitté la finale, le tournoi est annulé.",
                        reason: 'final_aborted'
                    });
                }

                this.rooms = this.rooms.filter(r => r.tournamentId !== tournamentId);
                this.tournamentResults.delete(tournamentId);
                return;
            }

            if (tournamentData && tournamentData.finaleCreated) {
                tournamentData.finalists.forEach(finalist => {
                    if (finalist.socket && finalist.socket.connected) {
                        finalist.socket.emit('opponent_left', {
                            message: "Le tournoi est annulé : un finaliste a quitté ou s'est déconnecté.",
                            reason: 'tournament_aborted'
                        });
                    }
                });
                this.rooms = this.rooms.filter(r => r.tournamentId !== tournamentId);
                this.tournamentResults.delete(tournamentId);
                return;
            }


            if (tournamentData && tournamentData.finaleCreated) {
                const otherFinalist = tournamentData.finalists.find(p => p.session.userId !== userId);
                if (otherFinalist && otherFinalist.socket && otherFinalist.socket.connected) {
                    otherFinalist.socket.emit('opponent_left', {
                        message: "Ton adversaire a quitté, le tournoi est annulé.",
                        reason: 'final_aborted'
                    });
                }

                this.rooms
                    .filter(r => r.tournamentId === tournamentId)
                    .forEach(room => {
                        room.players.forEach(p => {
                            if (p.socket && p.socket.connected) {
                                p.socket.emit('opponent_left', {
                                    message: "Le tournoi est annulé car un finaliste a quitté.",
                                    reason: 'tournament_aborted'
                                });
                            }
                        });
                        room.forceEndMatch?.();
                    });

                this.rooms = this.rooms.filter(r => r.tournamentId !== tournamentId);
                this.tournamentResults.delete(tournamentId);
                return;
            }

            if (tournamentData && !tournamentData.finaleCreated) {
                const tournamentRooms = this.rooms.filter(r => r.tournamentId === tournamentId);

                tournamentRooms.forEach(room => {
                    room.players.forEach(p => {
                        if (p.socket && p.socket.connected) {
                            p.socket.emit('opponent_left', {
                                message: "Le tournoi est annulé : un joueur a quitté ou s'est déconnecté.",
                                reason: 'tournament_aborted'
                            });
                        }
                    });
                    room.forceEndMatch?.();
                });

                if (tournamentData.finalists) {
                    tournamentData.finalists.forEach(finalist => {
                        if (finalist.socket && finalist.socket.connected) {
                            finalist.socket.emit('opponent_left', {
                                message: "Le tournoi est annulé : il n'y aura pas de finale, un joueur a quitté en demi-finale.",
                                reason: 'tournament_aborted'
                            });
                        }
                    });
                }

                this.rooms = this.rooms.filter(r => r.tournamentId !== tournamentId);
                this.tournamentResults.delete(tournamentId);
                return;
            }

        }

        for (const [tournamentId, tournamentData] of this.tournamentResults.entries()) {
            if (
                tournamentData.finalists.some(p => p.session.userId === userId) &&
                !tournamentData.finaleCreated
            ) {
                const otherFinalist = tournamentData.finalists.find(p => p.session.userId !== userId);
                if (otherFinalist && otherFinalist.socket && otherFinalist.socket.connected) {
                    otherFinalist.socket.emit('opponent_left', {
                        message: "Ton adversaire a quitté avant la finale, le tournoi est annulé.",
                        reason: 'final_aborted'
                    });
                }
                const allSemifinalRooms = this.rooms.filter(r =>
                    r.tournamentId === tournamentId &&
                    r.matchType === 'semifinal'
                );
                allSemifinalRooms.forEach(semifinalRoom => {
                    semifinalRoom.players.forEach(p => {
                        if (p.socket && p.socket.connected) {
                            p.socket.emit('opponent_left', {
                                message: "Le tournoi est annulé : un finaliste a quitté, la finale n'aura pas lieu.",
                                reason: 'tournament_aborted'
                            });
                        }
                    });
                    semifinalRoom.forceEndMatch?.();
                });
                this.rooms = this.rooms.filter(r => r.tournamentId !== tournamentId);
                this.tournamentResults.delete(tournamentId);
                return;
            }
        }

        if (playerRoom && playerRoom.mode === "remote") {
            const otherPlayer = playerRoom.players.find(p => p.session.userId !== userId);
            if (otherPlayer && otherPlayer.socket && otherPlayer.socket.connected) {
                otherPlayer.socket.emit('opponent_left', {
                    message: `${player.username} a quitté la partie`,
                    reason: 'player_quit'
                });
            }
            playerRoom.forceEndMatch();
            this.rooms = this.rooms.filter(r => r !== playerRoom);
        }
        if (playerRoom && playerRoom.mode === "local") {
            playerRoom.cleanupResources();
            this.rooms = this.rooms.filter(r => r !== playerRoom);
        }
        this.waitList.removePlayer(userId);
    }


    private ensureUsernameReady(userId: number): string | null {
        const player = this.mapPlayer.get(userId);
        if (!player || !player.username || player.username === "undefined") {
            console.warn(`[DEBUG] Username non disponible pour userId ${userId}`);
            return null;
        }
        return player.username;
    }

    private sendUsername(userId: number, socket: any): void {
        const username = this.ensureUsernameReady(userId);
        if (socket && socket.connected)
            socket.emit('username_response', { username });
    }
}
