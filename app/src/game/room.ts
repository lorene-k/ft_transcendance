import { Player } from "../../includes/custom.js";
import { GameScene } from "./scene.js";
import { GameLogic } from "./gameLogic.js";

export class Room {
    time_begin!: number;
    time_end!: number | null;
    id: string = "null";
    players: Player[] = [];
    gameScene!: GameScene;
    gameLogic!: GameLogic;
    isActive: boolean = true;
    winner!: Player;
    mode: string;

    tournamentId?: string;
    matchType?: 'semifinal' | 'final';
    matchInfo?: string;

    private emitIntervalId: NodeJS.Timeout | null = null;
    private statusIntervalId: NodeJS.Timeout | null = null;

    public constructor(mode: string, player1: Player, player2: Player) {
        this.players.push(player1);
        this.players.push(player2);
        this.mode = mode;

        this.sendPlayerType();
        GameScene.create(this.mode).then((scene) => {
            this.gameScene = scene;
            this.gameLogic = new GameLogic(this.gameScene, this.players[0], this.players[1], mode);
            this.checkMatchStatus();
            this.keyPressedListener();
            this.emitToPlayers(mode);
            this.time_begin = Date.now();
        }).catch((error) => {
            console.error("Failed to initialize GameScene", error);
        });
    }

    private checkMatchStatus(): void {
        if (this.statusIntervalId) clearInterval(this.statusIntervalId);
        this.statusIntervalId = setInterval(() => {
            if (!this.isActive || !this.gameLogic) {
                clearInterval(this.statusIntervalId!);
                this.statusIntervalId = null;
                return;
            }
            if (this.gameLogic.player1Score >= 7 || this.gameLogic.player2Score >= 7) {
                this.endMatch();
                clearInterval(this.statusIntervalId!);
                this.statusIntervalId = null;
            }
        }, 100);
    }

    public sendPlayerType(userId?: number): {
        playerType: 'player1' | 'player2' | null,
        player1_username: string,
        player2_username: string
    } {
        let playerType: 'player1' | 'player2' | null = null;

        if (this.mode === "local") {
            this.players[0].role = 'player1';
            this.players[1].role = 'player2';
            if (this.players[0].socket && this.players[0].socket.connected)
                this.players[0].socket.emit("playerType", "player1");
        }
        else if (this.mode === "remote" || this.mode === "tournament") {
            this.players[0].role = 'player1';
            this.players[1].role = 'player2';
            if (this.players[0].socket && this.players[0].socket.connected)
                this.players[0].socket.emit("playerType", "player1");
            if (this.players[1].socket && this.players[1].socket.connected)
                this.players[1].socket.emit("playerType", "player2");
        }
        if (userId) {
            if (this.players[0].session.userId === userId) playerType = 'player1';
            else if (this.players[1].session.userId === userId) playerType = 'player2';
        }

        return {
            playerType,
            player1_username: this.players[0].username || "",
            player2_username: this.players[1].username || ""
        };
    }


    private emitToPlayers(mode: string) {
        if (this.emitIntervalId) clearInterval(this.emitIntervalId);
        this.emitIntervalId = setInterval(() => {
            if (!this.isActive) {
                clearInterval(this.emitIntervalId!);
                this.emitIntervalId = null;
                return;
            }
            if (!this.gameScene || typeof this.gameScene.getSceneState !== 'function') return;
            const sceneState = this.gameScene.getSceneState();
            for (const player of this.players) {
                if (player.username == "guest")
                    continue;
                if (player.socket && player.socket.connected) {
                    player.socket.emit("sceneUpdate", sceneState);
                }
            }
        }, 1000 / 30);
    }

    private keyPressedListener() {
        this.players.forEach((player, index) => {
            if (!player.socket?.connected) return;
            if (player.username === "guest") return;
            player.socket.on("keyPressed", (data: { key: string, position: any }) => {
                let authorizedKeys: string[] = [];

                if (this.mode === "local") {
                    authorizedKeys = ["q", "w", "d", "o", "l", "p"];
                } else {
                    if (player.role === "player1") authorizedKeys = ["q", "w", "d"];
                    if (player.role === "player2") authorizedKeys = ["o", "l", "p"];
                }

                if (!authorizedKeys.includes(data.key)) {
                    console.warn(`Tentative d'action non autorisée par ${player.username} (${player.role}) : ${data.key}`);
                    return;
                }

                const paddleName = player.role === "player1" ? "players2" : "players1";
                this.gameScene.moovePaddle(paddleName, data.key, this.players[0], this.players[1]);
            });
        });
    }


    public isMatchActive(): boolean {
        if (!this.gameLogic)
            return this.isActive;
        if (this.gameLogic.player1Score > 7 || this.gameLogic.player2Score > 7)
            this.isActive = false;
        return this.isActive;
    }



    private endMatch(): void {
        this.isActive = false;
        this.time_end = Date.now();
        this.winner = this.gameLogic.player1Score >= 7 ? this.players[0] : this.players[1];

        for (const player of this.players) {
            if (player.username == "guest")
                continue;

            if (player.socket && player.socket.connected) {
                if (this.mode === "tournament") {
                    console.log(`Envoi match_ended tournoi pour ${player.username}:`, {
                        message: "stop match",
                        winner: this.winner.username,
                        matchType: "tournament",
                        tournamentInfo: {
                            tournamentId: this.tournamentId,
                            matchType: this.matchType,
                            matchInfo: this.matchInfo
                        }
                    });

                    player.socket.emit("match_ended", {
                        message: "stop match",
                        winner: this.winner.username,
                        matchType: "tournament",
                        tournamentInfo: {
                            tournamentId: this.tournamentId,
                            matchType: this.matchType,
                            matchInfo: this.matchInfo
                        }
                    });
                } else {
                    console.log(`Envoi match_ended normal pour ${player.username}`);
                    player.socket.emit("match_ended", {
                        message: "stop match",
                        winner: this.winner.username,
                    });
                }
            }
        }
    }

    public cleanupResources(): void {
        if (this.emitIntervalId) {
            clearInterval(this.emitIntervalId);
            this.emitIntervalId = null;
        }
        if (this.statusIntervalId) {
            clearInterval(this.statusIntervalId);
            this.statusIntervalId = null;
        }
        this.players.forEach(player => {
            if (player.socket) {
                player.socket.removeAllListeners('keyPressed');
            }
        });
        if (this.gameLogic) {
            if (typeof this.gameLogic.destroy === 'function') {
                this.gameLogic.destroy();
            }
            this.gameLogic = null as any;
        }
        if (this.gameScene) {
            if (typeof this.gameScene.destroy === 'function') {
                this.gameScene.destroy();
            }
            this.gameScene = null as any;
        }
    }

    public forceEndMatch(): void {
        this.isActive = false;
        this.players.forEach(player => {
            if (player.socket && player.socket.connected) {
                player.socket.emit('match_ended', {
                    message: 'Match interrompu',
                    reason: 'force_quit'
                });
            }
        });
        this.cleanupResources();
    }
}
