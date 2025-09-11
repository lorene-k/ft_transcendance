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
	public mapPlayer: Map<string, Player> = new Map<string, Player>(); // Pour remote (2 joueurs)
	private tournamentWaitlist: Map<string, Player> = new Map<string, Player>(); // Pour tournoi (4 joueurs)
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
			// Notifier les autres joueurs de la mise à jour
			this.notifyTournamentWaitlistUpdate();
		}
		return wasInTournament;
	}

	// Méthode générale pour retirer un joueur de toutes les waitlists (pour déconnexion)
	removePlayerFromAll(userId: number): boolean {
		const wasInRemote = this.removePlayer(userId);
		const wasInTournament = this.removePlayerFromTournament(userId);
		return wasInRemote || wasInTournament;
	}


	private createInvite(player1: Player, player2: Player, me: number) {
		const keys = this.getInviteKeys(player1.id!, player2.id!);

		if (player1.id == me) {
			const invite: Invite = {
				id: keys,
				player1,
				player2: null,
				date: new Date(),
				status: 'inProgress'
			};

			this.inviteMap.set(keys, invite);

		} else if (player2.id == me) {
			const invite: Invite = {
				id: keys,
				player1: null,
				player2,
				date: new Date(),
				status: 'inProgress'
			};

			this.inviteMap.set(keys, invite);
		}
	}


	private getInviteKeys(userIdP1: number, userIdP2: number): string {
		return `${userIdP1}_${userIdP2}`;
	}


	private getInviteReverseKeys(userIdP1: number, userIdP2: number): string {
		return `${userIdP2}_${userIdP1}`;
	}

	private isInviteCreated(player1: Player, player2: Player): boolean {
		const keys = this.getInviteKeys(player1.id!, player2.id!);
		const reverseKeys = this.getInviteReverseKeys(player1.id!, player2.id!);
		if (this.inviteMap.has(keys) || this.inviteMap.has(reverseKeys))
			return true;
		else
			return false;
	}

	private joininvite(player1: Player, player2: Player, me: number) {
	}

	addInvite(player1Id: string, player2Id: string, me: Player) {
		// On veut une map d'attente d'invite par clé (player1Id_player2Id ou player2Id_player1Id)
		const keys = this.getInviteKeys(Number(player1Id), Number(player2Id));
		const reverseKeys = this.getInviteReverseKeys(Number(player1Id), Number(player2Id));

		// On stocke les joueurs qui attendent l'invite
		if (!this.inviteMap.has(keys) && !this.inviteMap.has(reverseKeys)) {
			// Premier joueur à arriver, on le stocke
			const invite: Invite = {
				id: keys,
				player1: player1Id === me.session.userId.toString() ? me : null,
				player2: player2Id === me.session.userId.toString() ? me : null,
				date: new Date(),
				status: 'inProgress'
			};
			this.inviteMap.set(keys, invite);
		} else {
			// Un des deux joueurs est déjà là, on complète l'invite
			const invite = this.inviteMap.get(keys) || this.inviteMap.get(reverseKeys);
			if (invite) {
				if (player1Id === me.session.userId.toString()) {
					invite.player1 = me;
				} else if (player2Id === me.session.userId.toString()) {
					invite.player2 = me;
				}
				// Si les deux joueurs sont là, on crée la room
				if (invite.player1 && invite.player2) {
					this.emit('InviteMatchCreated', { player1: invite.player1, player2: invite.player2 });
					if (invite.player1.socket && invite.player2.socket && invite.player1.socket.connected && invite.player2.socket.connected) {
						invite.player1.socket.emit('match_found', { opponent: invite.player2.username });
						invite.player2.socket.emit('match_found', { opponent: invite.player1.username });
					}
					// On retire l'invite de la map pour éviter les doublons
					this.inviteMap.delete(keys);
					this.inviteMap.delete(reverseKeys);
				}
			}
		}
	}

	checkPendingInvites(userId: string) {
		// Appelée à chaque connexion d'un joueur
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

		// Tournament 5. Boucle de vérification toutes les secondes
		// pour créer des matchs en remote et en tournoi
		setInterval(() => {
			// Nettoyer les joueurs déconnectés avant tout
			this.cleanupDisconnectedPlayers();

			// Remote mode check (2 joueurs)
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

			// Tournament mode check (4 joueurs)
			if (this.tournamentWaitlist.size >= 4) {
				// Créer un tableau à partir de la Map
				const playersArray = Array.from(this.tournamentWaitlist.values());

				// Vérifier encore une fois que tous les joueurs sont connectés
				const connectedPlayers = playersArray.filter(player =>
					player.socket && player.socket.connected && player.online
				);

				if (connectedPlayers.length >= 4) {
					const tournamentPlayers = connectedPlayers.slice(0, 4); // Prendre les 4 premiers

					// Retirer ces 4 joueurs de la waitlist
					tournamentPlayers.forEach(player => {
						this.tournamentWaitlist.delete(player.session.userId.toString());
					});

					console.log(`🏆 Tournoi créé avec: ${tournamentPlayers.map(p => p.username).join(', ')}`);

					// Émettre l'événement pour créer le tournoi
					this.emit('TournamentMatchCreated', { players: tournamentPlayers });

					// Notifier chaque joueur qu'un tournoi commence
					tournamentPlayers.forEach(player => {
						if (player.socket && player.socket.connected) {
							player.socket.emit('tournament_created', {
								players: tournamentPlayers.map(p => p.username),
								message: 'Le tournoi va commencer !'
							});
						}
					});

					// Notifier les joueurs restants (s'il y en a)
					this.notifyTournamentWaitlistUpdate();
				} else {
					// Pas assez de joueurs connectés, notifier ceux qui restent
					this.notifyTournamentWaitlistUpdate();
				}
			}
		}, 1000);
	}


	addTournament(player: Player) {

		// Tournament 2. Si le joueur est déjà dans la waitlist, ne pas l'ajouter
		if (this.tournamentWaitlist.has(player.session.userId.toString())) {
			return;
		}

		// Tournament 3. Vérifier que le joueur est connecté
		if (!player.socket || !player.socket.connected || !player.online) {
			return;
		}

		//Tournament 4. Ajouter le joueur à la waitlist
		this.tournamentWaitlist.set(player.session.userId.toString(), player);

		// Tournament 5. Notifier tous les joueurs de la mise à jour
		this.notifyTournamentWaitlistUpdate();
	}

	private cleanupDisconnectedPlayers(): void {

		// Verification des joueurs déconnectés de toutes les waitlists
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

	// Notifier les joueurs restants de la mise à jour de la waitlist
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
