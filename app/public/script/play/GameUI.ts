import GameModeManager from "./GameModeManager.js";

export function createGameCanvas(gameModeManager: GameModeManager) {
    removeGameCanvas();
    const wrapper = document.createElement('div');
    wrapper.id = 'gameCanvasWrapper';
    wrapper.className = `
    fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
    w-[90vw] max-w-[1200px] h-[80vh]
    flex flex-col justify-center items-center
    z-40 bg-transparent
`;

    const scoresContainer = document.createElement('div');
    scoresContainer.className = `
    flex justify-between items-center
    w-full max-w-[1000px]
    mb-5 px-10
    font-['Press_Start_2P'] text-[#00ff88]
    [text-shadow:2px_2px_4px_rgba(0,0,0,0.7)]
    `;

    // Score Player 1
    const player1Score = document.createElement('div');
    player1Score.classList.add(
        "flex",              // display: flex
        "flex-col",          // flex-direction: column
        "items-center",      // align-items: center
        "gap-2.5",           // gap: 10px (2.5 * 4px)
        "bg-black/70",       // background: rgba(0,0,0,0.7)
        "px-6",              // padding horizontal ≈ 24px (25px approximatif)
        "py-4",              // padding vertical ≈ 16px (15px approximatif)
        "rounded-xl",        // border-radius: 15px
        "border-2",          // border width 2px
        "border-green-500",  // border-color approximatif #00ff88
        "backdrop-blur"      // backdrop-filter: blur
    );

    // Score Player 2
    const player2Score = document.createElement('div');
    player2Score.classList.add(
        "flex",             // display: flex
        "flex-col",         // flex-direction: column
        "items-center",     // align-items: center
        "gap-2.5",          // gap: 10px (2.5 * 4px)
        "bg-black/70",      // background: rgba(0,0,0,0.7)
        "px-6",             // padding horizontal ≈ 24px (25px approximatif)
        "py-4",             // padding vertical ≈ 16px (15px approximatif)
        "rounded-xl",       // border-radius: 15px
        "border-2",         // border width 2px
        "border-red-500",   // border-color approximatif #ff6b6b
        "backdrop-blur"     // backdrop-filter: blur
    );


    let leftName = 'JOUEUR 1';
    let rightName = 'JOUEUR 2';
    if (gameModeManager) {
        if (gameModeManager.currentMode === 'local') {
            // Cas spécial local : joueur vs guest
            leftName = gameModeManager.my_username || 'Me';
            rightName = 'Guest';
        }
        else if (gameModeManager.player_type && gameModeManager.my_username && gameModeManager.opponent_username) {
            if (gameModeManager.player_type === 'player1') {
                leftName = gameModeManager.my_username;
                rightName = gameModeManager.opponent_username;
            }
            else if (gameModeManager.player_type === 'player2') {
                leftName = gameModeManager.opponent_username;
                rightName = gameModeManager.my_username;
            }
        }
    }

    player1Score.innerHTML = `
  <div class="player1-name text-[14px] text-white">${leftName}</div>
  <div id="player1Score" class="text-[32px] text-[#00ff88]">0</div>
`;

    player2Score.innerHTML = `
  <div class="player2-name text-[14px] text-white">${rightName}</div>
  <div id="player2Score" class="text-[32px] text-[#ff6b6b]">0</div>
`;

    const vsElement = document.createElement('div');
    vsElement.className = `
  text-[24px]
  text-white
  drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]
  animate-pulse
`;
    vsElement.textContent = 'VS';

    scoresContainer.appendChild(player1Score);
    scoresContainer.appendChild(vsElement);
    scoresContainer.appendChild(player2Score);
    const canvas = document.createElement('canvas');
    canvas.id = 'renderCanvas';
    const width = 1000;
    const height = 600;
    canvas.width = width;
    canvas.height = height;
    canvas.className = `
  w-[${width}px]
  h-[${height}px]
  max-w-[90vw]
  max-h-[60vh]
  border-3
  border-[#00ff88]
  rounded-[12px]
  block
  p-0
  outline-none
  object-contain
  z-1
  shadow-[0_0_30px_rgba(0,255,136,0.3)]
`;

    wrapper.appendChild(scoresContainer);
    wrapper.appendChild(canvas);
    const mainElement = document.getElementById("main_content");

    if (mainElement) {
        mainElement.appendChild(wrapper);

        // Ajouter la keyframe pulse si elle n'existe pas
        if (!document.querySelector('#pulse-animation-style')) {
            const style = document.createElement('style');
            style.id = 'pulse-animation-style';
            style.textContent = `
          @keyframes pulse-custom {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
          }
          .animate-pulse-custom {
              animation: pulse-custom 2s infinite;
          }
        `;
            document.head.appendChild(style);
        }
        vsElement.classList.add('animate-pulse-custom', 'text-white', 'text-2xl', 'shadow-lg');
    }

    canvas.focus();
    createGameControls(wrapper, gameModeManager);
}
export function removeGameCanvas() {
    const wrapper = document.getElementById('gameCanvasWrapper');
    if (wrapper) {
        wrapper.remove();
    }
    const canvas = document.getElementById('renderCanvas');
    if (canvas) {
        canvas.remove();
    }
}
export function createGameControls(wrapper: HTMLDivElement, gameModeManager: GameModeManager) {
    const quitButton = document.createElement('button');
    quitButton.id = 'quitGameButton';
    quitButton.textContent = '✖️';
    quitButton.className = `
    absolute top-20 right-5
    px-5 py-5
    bg-red-500 text-white
    border-2 border-red-700
    rounded-lg
    font-pressstart text-xs
    z-[10000]
    transition-all duration-200 ease-in-out
`;

    quitButton.addEventListener('mouseenter', () => {
        quitButton.classList.replace('bg-red-500', 'bg-red-600');
        quitButton.classList.add('scale-105');
    });
    quitButton.addEventListener('mouseleave', () => {
        quitButton.classList.replace('bg-red-600', 'bg-red-500');
        quitButton.classList.remove('scale-105');
    });
    quitButton.addEventListener('click', () => {
        gameModeManager.handleQuitGame(true);
    });

    wrapper.appendChild(quitButton);
}
export function updateScores(player1Name: string, player1Score: number, player2Name: string, player2Score: number) {
    const player1NameElement = document.querySelector('#gameCanvasWrapper .player1-name');
    const player2NameElement = document.querySelector('#gameCanvasWrapper .player2-name');
    if (player1NameElement) {
        player1NameElement.textContent = player1Name;
    }
    if (player2NameElement) {
        player2NameElement.textContent = player2Name;
    }
    const player1ScoreElement = document.getElementById('player1Score');
    const player2ScoreElement = document.getElementById('player2Score');
    if (player1ScoreElement) {
        player1ScoreElement.textContent = player1Score.toString();
    }
    if (player2ScoreElement) {
        player2ScoreElement.textContent = player2Score.toString();
    }
}
export function hideWaitlist() {

    const waitlist = document.getElementById('waitingForMatch');
    if (waitlist) {
        waitlist.classList.add('hidden');
    }

}
export function hideGame(gameModeManager: GameModeManager) {
    gameModeManager.gameInitialized = false;
    removeGameCanvas();
}
export function hideModeSelection() {
    const selection = document.getElementById('gameModeSelection');
    if (selection) {
        selection.classList.add('hidden');
        selection.classList.remove('flex');
    }
}
export function showWaitlist(gameModeManager: GameModeManager) {
    gameModeManager.currentState = 'waitlist';
    hideModeSelection();
    hideGame(gameModeManager);
    const waitlist = document.getElementById('waitingForMatch');
    if (waitlist) {
        waitlist.classList.remove('hidden');
        waitlist.classList.add('flex');
    }
    setupCancelButton(gameModeManager);
}
function setupCancelButton(gameModeManager: GameModeManager) {
    const cancelButton = document.getElementById('cancelQueue');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            if (gameModeManager.currentMode === 'tournament') {
                if (gameModeManager.socket && gameModeManager.socket.connected)
                    gameModeManager.socket.emit('leave_tournament');
            }
            else {
                if (gameModeManager.socket && gameModeManager.socket.connected)
                    gameModeManager.socket.emit('cancel_queue');
            }
            gameModeManager.currentMode = null;
            showModeSelection(gameModeManager);
        });
    }
}
export function showModeSelection(gameModeManager: GameModeManager) {
    gameModeManager.currentState = 'selection';
    hideWaitlist();
    hideGame(gameModeManager);
    hideInviteWaitlist();
    const selection = document.getElementById('gameModeSelection');
    if (selection) {
        selection.classList.remove('hidden');
        selection.classList.add('flex');
    }
}
export function showGame(gameModeManager: GameModeManager) {
    hideInviteWaitlist();
    gameModeManager.currentState = 'game';
    hideModeSelection();
    hideWaitlist();
    createGameCanvas(gameModeManager);
    gameModeManager.initializeGame();
}
export function hideInviteWaitlist() {
    const inviteWaitlist = document.getElementById('waitingForInvite');
    if (inviteWaitlist) {
        inviteWaitlist.classList.add('hidden');
        inviteWaitlist.classList.remove('flex');
    }
}
export function showInviteWaitlist(gameModeManager: GameModeManager) {
    gameModeManager.currentState = 'waitlist';
    hideModeSelection();
    hideGame(gameModeManager);
    hideWaitlist();
    hideInviteWaitlist();
    const inviteWaitlist = document.getElementById('waitingForInvite');
    if (inviteWaitlist) {
        inviteWaitlist.classList.remove('hidden');
        inviteWaitlist.classList.add('flex');
        const cancelBtn = document.getElementById('cancelInviteQueue');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                if (gameModeManager.socket && gameModeManager.socket.connected) {
                    gameModeManager.socket.emit('cancel_invite_queue');
                }
                gameModeManager.returnToHomeScreen();
            };
        }
    }
    else {
        console.warn('waitingForInvite div missing in HTML.');
    }
}

