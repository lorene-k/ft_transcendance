import { createScene } from "./scene.js";
import { PlayerInput } from "./inputController.js";
import { GameManager } from "./handleGame.js";
//import * as BABYLON from 'babylonjs';
/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />

function updateData(playerInput: PlayerInput, socket: any) {
    socket.on("sceneUpdate", (sceneState: any) => {
        playerInput._updateFromServer(sceneState.leftPaddle, sceneState.rightPaddle, sceneState.ball);
        const ballPos = BABYLON.Vector3.FromArray(sceneState.ball.position);
        const ballTimestamp = sceneState.timeStamp;
        playerInput.onServerBallUpdate(ballPos, ballTimestamp);
    });

    socket.on("animationUpdate", (sceneState: any) => {
        playerInput._updateFromServer(sceneState.leftPaddle, sceneState.rightPaddle, sceneState.ball);
    });
}


function whichPlayer(socket: any): Promise<'player1' | 'player2' | 'local'> {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve('local');
        }, 3000);
        
        socket.on("playerType", (playerState: any) => {
            clearTimeout(timeout);
            
            if (playerState === null || playerState === undefined || playerState === 'null') {
                resolve('local');
            } else {
                resolve(playerState);
            }
        });
    });
}

export async function initScene(socket: any) {
    socket.removeAllListeners('sceneUpdate');
    socket.removeAllListeners('animationUpdate');
    
    // const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    let canvas;
    const el = document.getElementById("renderCanvas");
        if (el instanceof HTMLCanvasElement) {
            canvas = el;
        } else {
        throw new Error("Element non trouvé ou pas un canvas");
}

    const engine = new BABYLON.Engine(canvas, true);
    const scene = await createScene(engine, canvas);


    const playerType = await whichPlayer(socket);
    const playerInput = new PlayerInput(scene, playerType, socket);

    const ball = scene.getMeshByName("pingPongBall");
    const ground = scene.getMeshByName("ground");
    
    if (!ball || !ground) {
        throw new Error("Le mesh 'pingPongBall' ou 'ground' n'a pas été trouvé !");
    }
    
    
    const gameManager = new GameManager(scene, ball, ground, socket);

    engine.runRenderLoop(() => {
        if (scene) {
            scene.render();
        }
    });
    
    updateData(playerInput, socket);
    
    window.addEventListener("resize", () => {
        if (engine) {
            engine.resize();
        }
    });
    
    console.log("✅ Scène initialisée avec succès");
}