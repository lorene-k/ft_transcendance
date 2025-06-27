//import * as BABYLON from 'babylonjs';
import { animateLeftPaddle, animateRightPaddle, serveBall } from "./animation.js";
// import * as BABYLON from 'babylonjs';
/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />
export class PlayerInput {
    constructor(scene) {
        scene.actionManager = new BABYLON.ActionManager(scene);
        this.inputMap = {};
        this.leftStartZ = null;
        this.rightStartZ = null;
        this.leftAnimating = false;
        this.rightAnimating = false;
        this.ballAnimating = false;
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = true;
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = false;
        }));
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard(scene);
        });
    }
    _updateFromKeyboard(scene) {
        const leftPaddle = scene.getMeshByName("paddleLeft_hitbox");
        const rightPaddle = scene.getMeshByName("paddleRight_hitbox");
        // Initialiser la position de départ une seule fois
        if (leftPaddle && this.leftStartZ === null) {
            this.leftStartZ = leftPaddle.position.z;
        }
        if (rightPaddle && this.rightStartZ === null) {
            this.rightStartZ = rightPaddle.position.z;
        }
        if (this.inputMap["o"] && leftPaddle) {
            leftPaddle.position.z += 0.1;
        }
        if (this.inputMap["l"] && leftPaddle) {
            leftPaddle.position.z -= 0.1;
        }
        if (this.inputMap["q"] && rightPaddle) {
            rightPaddle.position.z += 0.1;
        }
        if (this.inputMap["w"] && rightPaddle) {
            rightPaddle.position.z -= 0.1;
        }
        if (this.inputMap["p"] && leftPaddle && !this.leftAnimating) {
            this.leftAnimating = true;
            animateLeftPaddle(leftPaddle, () => {
                this.leftAnimating = false;
            });
        }
        if (this.inputMap["d"] && rightPaddle && !this.rightAnimating) {
            this.rightAnimating = true;
            animateRightPaddle(rightPaddle, () => {
                this.rightAnimating = false;
            });
        }
        if (this.inputMap["s"] && !this.ballAnimating) {
            const ball = scene.getMeshByName("pingPongBall");
            if (ball) {
                this.ballAnimating = true;
                serveBall(ball, scene, () => {
                    this.ballAnimating = false;
                });
            }
        }
    }
}
