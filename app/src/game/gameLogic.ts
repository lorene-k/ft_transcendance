import { GameScene } from "./scene.js";
import { NullEngine, Scene, MeshBuilder, Vector3, Quaternion, FreeCamera, Mesh, Animation, StandardMaterial } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock, Control } from "@babylonjs/gui";
import { Player } from "../../includes/custom.js";


export class GameLogic {
    player1: Player;
    player2: Player;
    scene: Scene;
    ball: Mesh;
    floor: Mesh;
    player1Score: number = -1;
    player2Score: number = -1;

    leftZone!: Mesh;
    rightZone!: Mesh;
    sideLeftZone!: Mesh;
    sideRightZone!: Mesh;

    mode: string;

    constructor(gameScene: GameScene, player1: Player, player2: Player, mode: string) {
        this.mode = mode;
        this.scene = gameScene.scene;
        this.ball = gameScene.ball;
        this.floor = gameScene.ground;
        this.player1 = player1;
        this.player2 = player2;
        this._createLimits();
        this._initBallSuperviseur();
        this._sendPlayerInfo();
    }

    private _sendPlayerInfo(): void {
        const playerInfo = {
            player1Name: this.player1.username,
            player2Name: this.player2.username
        };
        this.emitToPlayers("playerInfo", playerInfo);
    }


    private emitToPlayers(event: string, data: any): void {
        const players = [this.player1, this.player2];
        players.forEach((player, index) => {
            if (this.mode === "local" && player.username === "guest")
                return;
            if (player.socket && player.socket.connected)
                player.socket.emit(event, data);
        });
    }

    private _createLimits(): void {
        const box = this.floor.getBoundingInfo().boundingBox;
        const width = box.maximum.x - box.minimum.x;
        const length = box.maximum.z - box.minimum.z;
        const center = this.floor.position;
        const zoneThickness = 0.2;
        const yPos = center.y + zoneThickness / 2;

        const createInvisibleMat = (name: string): StandardMaterial => {
            const mat = new StandardMaterial(name, this.scene);
            mat.alpha = 0;
            return mat;
        };

        const createZone = (
            name: string,
            options: { width: number, height: number, depth: number },
            position: Vector3,
            material: StandardMaterial
        ): Mesh => {
            const zone = MeshBuilder.CreateBox(name, options, this.scene);
            zone.position = position;
            zone.material = material;
            zone.isPickable = false;
            return zone;
        };

        const matLeft = createInvisibleMat("matLeft");
        const matRight = createInvisibleMat("matRight");
        this.leftZone = createZone(
            "leftZone",
            { width: 1, height: zoneThickness, depth: length },
            new Vector3(center.x - width / 2 - 0.5, yPos, center.z),
            matLeft
        );
        this.rightZone = createZone(
            "rightZone",
            { width: 1, height: zoneThickness, depth: length },
            new Vector3(center.x + width / 2 + 0.5, yPos, center.z),
            matRight
        );

        const matSideTop = createInvisibleMat("matSideTop");
        const matSideBottom = createInvisibleMat("matSideBottom");
        this.sideLeftZone = createZone(
            "sideTopZone",
            { width: width, height: zoneThickness, depth: 1 },
            new Vector3(center.x, yPos, center.z - length / 2 - 0.5),
            matSideTop
        );
        this.sideRightZone = createZone(
            "sideBottomZone",
            { width: width, height: zoneThickness, depth: 1 },
            new Vector3(center.x, yPos, center.z + length / 2 + 0.5),
            matSideBottom
        );
    }

    private _initBallSuperviseur(): void {
        this.scene.registerBeforeRender(() => {
            if (this.ball.intersectsMesh(this.leftZone, false)) {
                this._handlePointLoss('player2');
            } else if (this.ball.intersectsMesh(this.rightZone, false)) {
                this._handlePointLoss('player1');
            } else if (this.ball.intersectsMesh(this.sideLeftZone)) {
                this._handlePointLoss('player1null');
            } else if (this.ball.intersectsMesh(this.sideRightZone)) {
                this._handlePointLoss('player2null');
            }
        });
    }

    private _handlePointLoss(losingPlayer: 'player1' | 'player2' | 'player2null' | 'player1null'): void {
        let winner: 'player1' | 'player2';

        if (this.player1Score == -1 && this.player2Score) {
            this.player1Score = 0;
            this.player2Score = 0;
            winner = 'player1';
        }
        else {
            switch (losingPlayer) {
                case 'player1':
                    if (this.player2Score === -1) this.player2Score = 0;
                    this.player2Score++;
                    winner = 'player2';
                    break;

                case 'player2':
                    if (this.player1Score === -1) this.player1Score = 0;
                    this.player1Score++;
                    winner = 'player1';
                    break;

                case 'player2null':
                    winner = 'player2';
                    break;

                case 'player1null':
                    winner = 'player1';
                    break;
            }
        }
        this._resetBall(winner);

        const scoreData = {
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            player1Name: this.player1.username,
            player2Name: this.player2.username,
            winner: winner,
            ball: this.ball.position
        };
        this.emitToPlayers("updateScore", scoreData);
    }


    private _resetBall(winner: 'player1' | 'player2'): void {
        const tableBox = this.floor.getBoundingInfo().boundingBox;
        const tableWidth = tableBox.maximum.x - tableBox.minimum.x;
        const tableCenter = this.floor.position;
        const ballHeight = tableBox.maximum.y + 0.5;
        const xOffset = tableWidth / 2 - 2;
        let x: number;
        let serveDir: number;

        if (winner === 'player1') {
            x = tableCenter.x + xOffset;
            serveDir = -1;
        } else {
            x = tableCenter.x - xOffset;
            serveDir = 1;
        }

        const z = tableCenter.z;
        this.ball.position.x = x;
        this.ball.position.y = ballHeight;
        this.ball.position.z = z;
        (this.ball as any).physicsImpostor.setLinearVelocity(Vector3.Zero());
        (this.ball as any).physicsImpostor.setAngularVelocity(Vector3.Zero());
    }


    public destroy(): void {
        try {
            if (this.scene) {
                this.scene.onBeforeRenderObservable.clear();
                this.scene.onBeforeRenderObservable.clear();
            }
            const players = [this.player1, this.player2];
            players.forEach((player, index) => {
                if (player?.socket) {
                    player.socket.removeAllListeners('ballPositionUpdate');
                }
            });
            if (this.leftZone) {
                this.leftZone.dispose();
                this.leftZone = null as any;
            }
            if (this.rightZone) {
                this.rightZone.dispose();
                this.rightZone = null as any;
            }
            if (this.sideLeftZone) {
                this.sideLeftZone.dispose();
                this.sideLeftZone = null as any;
            }
            if (this.sideRightZone) {
                this.sideRightZone.dispose();
                this.sideRightZone = null as any;
            }

            this.scene = null as any;
            this.ball = null as any;
            this.floor = null as any;
            this.player1 = null as any;
            this.player2 = null as any;


            this.player1Score = 0;
            this.player2Score = 0;

        } catch (error) {
            console.error('Error:', error);
        }
    }

}
