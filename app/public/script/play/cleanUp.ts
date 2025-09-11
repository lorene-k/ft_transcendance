import GameModeManager  from "./GameModeManager.js";
import { removeGameCanvas } from "./GameUI.js";


export function setupCleanupHandler(gameModeManager: GameModeManager) {
    //refresh / fermeture onglet
    window.addEventListener("beforeunload", () =>
        gameModeManager.handleQuitGame(true)
    );

}

    
    export function destroyEverything(gameModeManager: GameModeManager) {
        try {
            if (window.BABYLON && BABYLON.Engine.Instances.length > 0) {

                BABYLON.Engine.Instances.forEach((engine, index) => {
                    engine.stopRenderLoop();

                    const scenes = engine.scenes;
                    scenes.forEach((scene) => {
                        if (scene && !scene.isDisposed) {
                            scene.dispose();
                        }
                    });

                    engine.dispose();
                });
            }

            if (gameModeManager.socket) {
                gameModeManager.socket.removeAllListeners();
            }
            removeGameCanvas();
            gameModeManager.destroy();

        } catch (error) {
            console.error('Erreur lors de la destruction:', error);
        }
    }