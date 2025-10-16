import fastifySession, { FastifySessionObject, SessionStore } from "@fastify/session";
import cookie from "cookie";
import { Player } from "../../includes/custom.js";
import { EventEmitter } from 'events';

interface Invite {
    id: string;
    player1: Player | null;
    player2: Player | null;
    date: Date;
    status: 'inProgress' | 'completed';
}

function getTwoRandomPlayers(players: Player[]): [Player, Player] {
    const shuffled = [...players];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return [shuffled[0], shuffled[1]];
}

export class WaitList extends EventEmitter {
    public mapPlayer: Map<string, Player> = new Map<string, Player>();
    private tournamentWaitlist: Map<string, Player> = new Map<string, Player>();
    private inviteMap: Map<string, Invite> = new Map();
    private pendingInvites: { player1Id: string, player2Id: string, me: Player }[] = [];


    constructor() {
        super();
        this.createMatch();
    }

    addRemote(player: Player) {
        this.mapPlayer.set(player.session.userId.toString(), player);
    }

    removePlayer(userId: number): boolean {
        const wasInRemote = this.mapPlayer.has(userId.toString());

        if (wasInRemote) {
            this.mapPlayer.delete(userId.toString());
        }

        return wasInRemote;
    }

    removePlayerFromTournament(userId: number): boolean {
        const wasInTournament = this.tournamentWaitlist.has(userId.toString());
        if (wasInTournament) {
            this.tournamentWaitlist.delete(userId.toString());
            this.notifyTournamentWaitlistUpdate();
        }
        return wasInTournament;
    }

    removePlayerFromAll(userId: number): boolean {
        const wasInRemote = this.removePlayer(userId);
        const wasInTournament = this.removePlayerFromTournament(userId);
        return wasInRemote || wasInTournament;
    }


    private getInviteKeys(userIdP1: number, userIdP2: number): string {
        return `${userIdP1}_${userIdP2}`;
    }


    private getInviteReverseKeys(userIdP1: number, userIdP2: number): string {
        return `${userIdP2}_${userIdP1}`;
    }

    addInvite(player1Id: string, player2Id: string, me: Player) {
        const keys = this.getInviteKeys(Number(player1Id), Number(player2Id));
        const reverseKeys = this.getInviteReverseKeys(Number(player1Id), Number(player2Id));

        if (!this.inviteMap.has(keys) && !this.inviteMap.has(reverseKeys)) {
            const invite: Invite = {
                id: keys,
                player1: player1Id === me.session.userId.toString() ? me : null,
                player2: player2Id === me.session.userId.toString() ? me : null,
                date: new Date(),
                status: 'inProgress'
            };
            this.inviteMap.set(keys, invite);
        } else {
            const invite = this.inviteMap.get(keys) || this.inviteMap.get(reverseKeys);
            if (invite) {
                if (player1Id === me.session.userId.toString()) {
                    invite.player1 = me;
                } else if (player2Id === me.session.userId.toString()) {
                    invite.player2 = me;
                }
                if (invite.player1 && invite.player2) {
                    this.emit('InviteMatchCreated', { player1: invite.player1, player2: invite.player2 });
                    if (invite.player1.socket && invite.player2.socket && invite.player1.socket.connected && invite.player2.socket.connected) {
                        invite.player1.socket.emit('match_found', { opponent: invite.player2.username });
                        invite.player2.socket.emit('match_found', { opponent: invite.player1.username });
                    }
                    this.inviteMap.delete(keys);
                    this.inviteMap.delete(reverseKeys);
                }
            }
        }
    }

    checkPendingInvites(userId: string) {
        const stillPending: typeof this.pendingInvites = [];
        for (const invite of this.pendingInvites) {
            const { player1Id, player2Id, me } = invite;
            const player1 = this.mapPlayer.get(player1Id);
            const player2 = this.mapPlayer.get(player2Id);
            if (player1 && player2) {
                const keys = this.getInviteKeys(Number(player1Id), Number(player2Id));
                if (!this.inviteMap.has(keys)) {
                    const newInvite: Invite = {
                        id: keys,
                        player1,
                        player2,
                        date: new Date(),
                        status: 'inProgress'
                    };
                    this.inviteMap.set(keys, newInvite);
                    this.emit('InviteMatchCreated', { player1, player2 });
                    if (player1.socket && player2.socket && player1.socket.connected && player2.socket.conncted) {
                        player1.socket.emit('invite_match_found', { opponent: player2.username });
                        player2.socket.emit('invite_match_found', { opponent: player1.username });
                    }
                }
            } else {
                stillPending.push(invite);
            }
        }
        this.pendingInvites = stillPending;
    }

    private createMatch() {
        setInterval(() => {
            this.cleanupDisconnectedPlayers();
            if (this.mapPlayer.size >= 2) {
                const playersArray = Array.from(this.mapPlayer.values());
                const [player1, player2] = getTwoRandomPlayers(playersArray);

                this.mapPlayer.delete(player1.session.userId.toString());
                this.mapPlayer.delete(player2.session.userId.toString());

                this.emit('RemoteMatchCreated', { player1, player2 });

                if (player1.socket && player2.socket && player1.socket.connected && player2.socket.connected) {
                    player1.socket.emit('match_found', { opponent: player2.username });
                    player2.socket.emit('match_found', { opponent: player1.username });
                }
            }

            if (this.tournamentWaitlist.size >= 4) {
                const playersArray = Array.from(this.tournamentWaitlist.values());
                const connectedPlayers = playersArray.filter(player =>
                    player.socket && player.socket.connected && player.online
                );

                if (connectedPlayers.length >= 4) {
                    const tournamentPlayers = connectedPlayers.slice(0, 4);
                    tournamentPlayers.forEach(player => {
                        this.tournamentWaitlist.delete(player.session.userId.toString());
                    });

                    this.emit('TournamentMatchCreated', { players: tournamentPlayers });
                    tournamentPlayers.forEach(player => {
                        if (player.socket && player.socket.connected) {
                            player.socket.emit('tournament_created', {
                                players: tournamentPlayers.map(p => p.username),
                                message: 'Le tournoi va commencer !'
                            });
                        }
                    });
                    this.notifyTournamentWaitlistUpdate();
                } else {
                    this.notifyTournamentWaitlistUpdate();
                }
            }
        }, 1000);
    }


    addTournament(player: Player) {
        if (this.tournamentWaitlist.has(player.session.userId.toString())) {
            return;
        }
        if (!player.socket || !player.socket.connected || !player.online) {
            return;
        }
        this.tournamentWaitlist.set(player.session.userId.toString(), player);
        this.notifyTournamentWaitlistUpdate();
    }

    private cleanupDisconnectedPlayers(): void {
        for (const [userId, player] of this.mapPlayer.entries()) {
            if (!player.socket || !player.socket.connected || !player.online) {
                this.mapPlayer.delete(userId);
            }
        }
        for (const [userId, player] of this.tournamentWaitlist.entries()) {
            if (!player.socket || !player.socket.connected || !player.online) {
                this.tournamentWaitlist.delete(userId);
            }
        }
    }

    private notifyTournamentWaitlistUpdate(): void {
        const remainingPlayers = Array.from(this.tournamentWaitlist.values());
        remainingPlayers.forEach((player, index) => {
            if (player.socket && player.socket.connected) {
                player.socket.emit('tournament_queue_status', {
                    position: index + 1,
                    totalNeeded: 4,
                    waitingPlayers: remainingPlayers.map(p => p.username)
                });
            }
        });
    }
}
