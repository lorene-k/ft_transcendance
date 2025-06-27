import { createScene } from "./scene.js";
import { PlayerInput } from "./inputController.js";
import { GameManager } from "./handleGame.js";
//import * as BABYLON from 'babylonjs';
/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />
async function initScene() {
    // Récupérer le canvas
    const canvas = document.getElementById("renderCanvas");
    // Créer le moteur Babylon
    const engine = new BABYLON.Engine(canvas, true);
    const scene = await createScene(engine, canvas); // Attendre que la scène soit créée
    const playerInput = new PlayerInput(scene); // Choper les input du clavier
    // Compter les points et remettre le service
    const ball = scene.getMeshByName("pingPongBall");
    const ground = scene.getMeshByName("ground");
    if (!ball || !ground) {
        throw new Error("Le mesh 'pingPongBall' n'a pas été trouvé !");
    }
    const gameManager = new GameManager(scene, ball, ground);
    // Boucle de rendu
    engine.runRenderLoop(function () {
        scene.render(); // Appeler la méthode render de la scène
    });
    // Redimensionner le moteur
    window.addEventListener("resize", function () {
        engine.resize();
    });
}
// Appeler la fonction d'initialisation
initScene();
