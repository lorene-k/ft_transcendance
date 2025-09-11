//import * as BABYLON from 'babylonjs';
//import * as GUI from 'babylonjs-gui';
/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />

const player1ScoreDisplay = document.getElementById('player1ScoreDisplay') as HTMLDivElement;
const player2ScoreDisplay = document.getElementById('player2ScoreDisplay') as HTMLDivElement;

export {};

export class GameManager {
    scene: BABYLON.Scene;
    ball: BABYLON.Mesh;
    floor: BABYLON.GroundMesh;
    player1Score: number = 0;
    player2Score: number = 0;
    player1Name: string = "Player 1";
    player2Name: string = "Player 2";

    leftZone!: BABYLON.Mesh;
    rightZone!: BABYLON.Mesh;
    sideLeftZone!: BABYLON.Mesh;
    sideRightZone!: BABYLON.Mesh;
    socket: any;
    private socketListeners: string[] = [];


    constructor(scene: BABYLON.Scene, pingPongBall: BABYLON.AbstractMesh, floor: BABYLON.AbstractMesh, socket:any) {
        this.scene = scene;
        this.ball = pingPongBall as BABYLON.Mesh;
        this.floor = floor as BABYLON.GroundMesh;
        this.socket = socket;
  

        // scene.onBeforeRenderObservable.add(() => {
        //     const maxSpeed = 13;
        //     if (this.ball.physicsImpostor) {
        //         const velocity = this.ball.physicsImpostor.getLinearVelocity();
        //         if (velocity && velocity.length() > maxSpeed) {
        //             const newVelocity = velocity.normalize().scale(maxSpeed);
        //             this.ball.physicsImpostor!.setLinearVelocity(newVelocity);
        //         }
        //     }
        // });
        this._initBallSuperviseur();
    }

    destroy(): void {
        this.socketListeners.forEach(eventName => {
            this.socket.off(eventName);
        });
        this.socketListeners = [];
        this.player1Score = 0;
        this.player2Score = 0;
        this._updateUI();
        
        console.log("GameManager nettoyé");
    }

    private _initBallSuperviseur(): void {
        this.socketListeners.push("updateScore");
         this.socketListeners.push("playerInfo");
        
        this.socket.on("updateScore", (data: { winner: 'player1' | 'player2', player1Score: number, player2Score: number, ball: BABYLON.Vector3 }) => {
    this.player1Score = data.player1Score;
    this.player2Score = data.player2Score;
    this.ball.position = data.ball;
    if (data.winner === "player1" || data.winner === "player2") {
        this._handlePoint(data.winner);
    } else {
        console.warn("Valeur inattendue pour winner :", data.winner);
    }
});
    }
    
    private _handlePoint(winner: 'player1' | 'player2'): void {
        (this.ball as any).physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
        (this.ball as any).physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
        this._updateUI();
    }



        private _updateUI(): void {

        // Mettre à jour les scores
        const player1ScoreElement = document.getElementById('player1Score');
        const player2ScoreElement = document.getElementById('player2Score');
        
        if (player1ScoreElement) {
            player1ScoreElement.textContent = this.player1Score.toString();
        }
        if (player2ScoreElement) {
            player2ScoreElement.textContent = this.player2Score.toString();
        }
    }

}
