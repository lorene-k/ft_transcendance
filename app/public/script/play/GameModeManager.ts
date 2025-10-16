import { applyTranslations, applyTranslationsToNewContent } from '../../translate.js';
import { move_to } from '../N_nav.js';
import { connectSocket } from '../socket.js';
import { createGameControls, removeGameCanvas, createGameCanvas, hideWaitlist, hideGame, hideModeSelection, showWaitlist, showModeSelection, showGame, showInviteWaitlist } from './GameUI.js';
import { destroyEverything, setupCleanupHandler } from './cleanUp.js';

export default class GameModeManager {
    socket: any;
    currentState: 'selection' | 'waitlist' | 'game' = 'selection';
    currentMode: 'local' | 'remote' | 'tournament' | 'invite' | null = null;
    gameInitialized: boolean = false;
    pingInterval: NodeJS.Timeout | null = null;
    my_username: string | null = null;
    opponent_username: string | null = null;
    player_type: string | null = null;
    opponent_type: string | null = null;
    isInviteMode: boolean = false;
    isQuiting: boolean = false;

    private player1: string = "";
    private player2: string = "";

    constructor(mode: string = "", player1: string = "", player2: string = "") {
        this.socket = connectSocket(window.location.host);
        this.currentMode = mode as any;
        this.isInviteMode = (mode === "invite");
        this.player1 = player1;
        this.player2 = player2;
        this.initializeGameFlow();
        setupCleanupHandler(this);
    }

    private initializeGameFlow() {
        setTimeout(() => {
            if (this.currentMode === "invite") {
                this.handleInviteMode(this.player1, this.player2);
            } else {
                safeShowModeSelection(this);
            }
            this.setupEventListeners();
        }, 100);


    }
    // ========== LISTENERS  ==========
    private setupEventListeners() {
        const localButton = document.getElementById('localButton');
        const remoteButton = document.getElementById('remoteButton');
        const tournamentButton = document.getElementById('tournamentButton');

        if (localButton) {
            localButton.addEventListener('click', () => this.handleLocalMode());
        }

        if (remoteButton) {
            remoteButton.addEventListener('click', () => this.handleRemoteMode());
        }

        if (tournamentButton) {
            tournamentButton.addEventListener('click', () => this.handleTournamentMode());
        }

        this.setupSocketListeners();
    }


    // ========== Game mode handlers ==========
    private async handleLocalMode() {
        this.currentMode = 'local';
        await this.notifyServer('local');
        showGame(this);
        setTimeout(showRulesPopup, 300);
    }

    private async handleRemoteMode() {
        this.currentMode = 'remote';
        await this.notifyServer('remote');
        showWaitlist(this);
        setTimeout(showRulesPopup, 300);
    }

    private async handleTournamentMode() {
        this.currentMode = 'tournament';
        await this.notifyServer('tournament');
        showWaitlist(this);
        setTimeout(showRulesPopup, 300);
    }

    public async handleInviteMode(player1: string, player2: string) {
        this.currentMode = 'invite';
        await this.notifyServer('invite', player1, player2);
        showInviteWaitlist(this);
    }


    // ========== Game state handlers ==========
    handleQuitGame(returntoHome: boolean) {
        if (this.socket && this.socket.connected && !this.isQuiting) {
            this.socket.emit('leave_game');
            destroyEverything(this);
        }
        if (returntoHome)
            this.returnToHomeScreen();
    }

    public returnToHomeScreen() {
        this.hideWaitingForFinal();
        destroyEverything(this);
        move_to("home");
    }

    // ========== Cleaning ==========
    public destroy() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
        }
        this.socket = null;
        this.gameInitialized = false;
        this.currentState = 'selection';
        this.currentMode = null;
        this.my_username = null;
        this.opponent_username = null;
        this.player_type = null;
        this.opponent_type = null;
        this.isInviteMode = false;
        this.player1 = "";
        this.player2 = "";
        if ((window as any).gameManager === this) {
            (window as any).gameManager = null;
        }
    }


    // ========== Game launch ==========

    async initializeGame() {
        if (this.gameInitialized) {
            return;
        }

        try {
            const canvas = document.getElementById('renderCanvas');
            if (!canvas) {
                throw new Error('Canvas renderCanvas non trouvé');
            }
            this.gameInitialized = true;
            const { initScene } = await import('../game/main.js');
            await initScene(this.socket);

        } catch (error) {
            console.error('Erreur lors du chargement du jeu Babylon.js:', error);
            this.gameInitialized = false
        }
    }

    // ========== Server communication ==========
    private async notifyServer(mode: string, player1?: string, player2?: string) {
        try {
            let body;

            if (mode && player1 && player2) {
                body = { mode, player1, player2 };
            } else if (mode) {
                body = { mode };
            } else {
                throw new Error("Invalid game mode");
            }

            await fetch('/api/handle-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });

        } catch (error) {
            console.error('Error:', error);
        }
    }
    // ========== Socket events ==========
    private setupSocketListeners() {
        this.socket.on('player_info', (data: { playerType: string, player1_username: string, player2_username: string }) => {
            this.player_type = data.playerType;
            if (data.playerType === 'player1') {
                this.my_username = data.player1_username;
                this.opponent_username = data.player2_username;
            } else if (data.playerType === 'player2') {
                this.my_username = data.player2_username;
                this.opponent_username = data.player1_username;
            }
        });

        this.socket.emit('get_username');
        this.socket.on('username_response', (data: any) => {
            if (data.username) {
                this.my_username = data.username;
            }
        });

        this.socket.on('match_found', (data: { opponent: string }) => {
            this.opponent_username = data.opponent;
            this.handleMatchFound(data);
        });

        this.socket.on('invite_match_found', (data: { opponent: string }) => {
            this.opponent_username = data.opponent;
            this.handleMatchFound(data);
        });

        this.socket.on('match_ended', (data: {
            message: string,
            winner: string,
            matchType?: string,
            tournamentInfo?: {
                tournamentId: string,
                matchType: string,
                matchInfo: string
            }
        }) => {
            this.handleMatchEnded(data);
        });

        this.socket.on('opponent_left', (data: { message: string, reason: string }) => {
            this.handleOpponentLeft(data);
        });

        this.socket.on('playerType', (playerType: any) => {
            (this as any).receivedPlayerType = playerType;
        });

        // Final tournament notif
        this.socket.on('tournament_final', (data: {
            opponent: string,
            message: string
        }) => {
            this.handleTournamentFinal(data);
        });

        this.socket.on("pong_check", (start: any) => {
            const rtt = Date.now() - start;
        });

        // Latency measure
        this.pingInterval = setInterval(() => {
            if (this.socket) {
                const start = Date.now();
                this.socket.emit("ping_check", start);
            }
        }, 2000);
    }



    private handleMatchFound(data: { opponent: string, matchType?: string, tournamentInfo?: string }) {
        const statusText = document.getElementById('matchStatus');
        const opponentName = document.getElementById('opponentName');
        const opponentValue = document.getElementById('opponentNameValue');

        if (opponentName) opponentName.classList.remove('hidden');
        if (opponentValue) opponentValue.textContent = data.opponent;

        setTimeout(() => {
            showGame(this);
        }, 2000);
    }


    // ========== Game event handling ==========
    private handleMatchEnded(data: {
        message: string,
        winner: string,
        matchType?: string,
        tournamentInfo?: {
            tournamentId: string,
            matchType: string,
            matchInfo: string
        }
    }) {

        if (data.matchType === "tournament" && data.tournamentInfo?.matchType === "semifinal") {
            if (data.winner === this.my_username) {
                this.showWaitingForFinal();
                return;
            }
        }
        this.isQuiting = true;
        const savedLang = localStorage.getItem("lang");
        switch (savedLang) {
            case 'es':
                alert(`Partido terminado! Ganador: ${data.winner}`);
                break;
            case 'fr':
                alert(`Match terminé ! Gagnant: ${data.winner}`);
                break;
            default:
                alert(`Match over ! Winner is: ${data.winner}`);
                break;
        }
        this.returnToHomeScreen();
    }

    private handleOpponentLeft(data: { message: string, reason: string }) {
        const savedLang = localStorage.getItem("lang");
        switch (savedLang) {
            case 'es':
                alert(`Un oponente ha abandonado la partida/el torneo`);
                break;
            case 'fr':
                alert(`Un adversaire a quitte la partie/le tournoi`);
                break;
            default:
                alert(`An opponent has left the game/the tournament`);
                break;
        }
        this.returnToHomeScreen();
    }

    private handleTournamentFinal(data: { opponent: string, message: string }) {
        this.hideWaitingForFinal();
        this.handleMatchFound({ opponent: data.opponent });
    }

    private showWaitingForFinal() {
        this.currentState = 'waitlist';
        hideGame(this);
        hideModeSelection();
        hideWaitlist();
        const waitingFinalDiv = document.getElementById('waitingForFinal');
        if (waitingFinalDiv) {
            waitingFinalDiv.style.display = 'flex';
            const returnButton = document.getElementById('returnToMenuFromFinal');
            if (returnButton) {
                returnButton.onclick = () => {
                    this.socket.emit('leave_final');
                    this.returnToHomeScreen();
                };
            }
        }
    }

    private hideWaitingForFinal() {
        const waitingFinalDiv = document.getElementById('waitingForFinal');
        if (waitingFinalDiv) {
            waitingFinalDiv.style.display = 'none';
        }
    }

    public getCurrentState() {
        return this.currentState;
    }

    public reset() {
        if (this.isInviteMode) return;
        safeShowModeSelection(this);
    }
}

function safeShowModeSelection(manager: GameModeManager) {
    if (manager.isInviteMode || manager.currentMode === 'invite') return;
    showModeSelection(manager);
}

function showRulesPopup() {
    if (document.getElementById('pongRulesPopup')) return;

    const popup = document.createElement('div');
    popup.id = 'pongRulesPopup';
    popup.className = `
        fixed inset-0
        bg-black/60
        flex items-center justify-center
        z-[9999]
    `;

    popup.innerHTML = `
      <div class="bg-white rounded-xl max-w-sm p-8 shadow-lg text-center font-sans">
        <h2 class="mb-3 text-gray-800 text-xl font-bold" data-i18n="play.rules.title">
            Règles du jeu Pong
        </h2>

        <ul class="text-left mb-4 pl-4 text-gray-800 text-base space-y-1">
          <li data-i18n="play.rules.r1">Déplace ta raquette de haut en bas pour renvoyer la balle.</li>
          <li data-i18n="play.rules.r2">Pour frapper la balle, appuie sur la touche de smash.</li>
          <li data-i18n="play.rules.r3">Le premier à 7 points gagne la partie.</li>
          <li data-i18n="play.rules.r4">Si tu rates la balle, ton adversaire marque un point.</li>
          <li data-i18n="play.rules.r5">La balle ne réagit qu’aux smashes, pas aux déplacements simples.</li>
        </ul>

        <div class="text-left mb-3 text-gray-700 text-sm">
          <b data-i18n="play.rules.controls">Contrôles&nbsp;:</b><br>
          <u data-i18n="play.rules.player1">Player 1 (left)</u> : <b>W</b> (<span data-i18n="play.rules.up">up</span>),
          <b>Q</b> (<span data-i18n="play.rules.down">down</span>),
          <b>D</b> (<span data-i18n="play.rules.smash">smash</span>)<br>
          <u data-i18n="play.rules.player2">Player 2 (right)</u> : <b>O</b> (<span data-i18n="play.rules.up">up</span>),
          <b>L</b> (<span data-i18n="play.rules.down">down</span>),
          <b>P</b> (<span data-i18n="play.rules.smash">smash</span>)
        </div>

        <div class="text-left mb-2 text-gray-500 text-sm" data-i18n="play.rules.username">
          Ton username est affiché du côté de ta raquette.
        </div>

        <button id="closeRulesPopup"
            class="mt-2 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-base cursor-pointer transition"
            data-i18n="play.rules.button">
            J'ai compris
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    applyTranslationsToNewContent(popup);
    const closeBtn = document.getElementById('closeRulesPopup');
    if (closeBtn) {
        closeBtn.onclick = () => {
            popup.remove();
        };
    }
}

const originalShowGame = showGame;
function showGameWithRules(manager: any) {
    originalShowGame(manager);
    setTimeout(showRulesPopup, 300);
}

(window as any).showGame = showGameWithRules;
