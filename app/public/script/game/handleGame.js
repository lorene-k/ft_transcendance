export class GameManager {
    constructor(scene, pingPongBall, floor) {
        this.player1Score = 0;
        this.player2Score = 0;
        this.scene = scene;
        this.ball = pingPongBall;
        this.floor = floor;
        this.scoreText = new BABYLON.GUI.TextBlock();
        this.scoreText.text = "Score: 0";
        // Limiter la vitesse de la balle
        scene.onBeforeRenderObservable.add(() => {
            const maxSpeed = 13;
            if (this.ball.physicsImpostor) {
                const velocity = this.ball.physicsImpostor.getLinearVelocity();
                if (velocity && velocity.length() > maxSpeed) {
                    const newVelocity = velocity.normalize().scale(maxSpeed);
                    this.ball.physicsImpostor.setLinearVelocity(newVelocity);
                }
            }
        });
        this._createLimits();
        this._createGUI();
        this._initBallSuperviseur();
    }
    _createLimits() {
        const box = this.floor.getBoundingInfo().boundingBox;
        const width = box.maximum.x - box.minimum.x;
        const length = box.maximum.z - box.minimum.z;
        const center = this.floor.position;
        const zoneThickness = 0.2;
        const extraMargin = 0.5;
        const yPos = center.y + zoneThickness / 2;
        // Helpers
        const createInvisibleMat = (name) => {
            const mat = new BABYLON.StandardMaterial(name, this.scene);
            mat.alpha = 0;
            return mat;
        };
        const createZone = (name, options, position, material) => {
            const zone = BABYLON.MeshBuilder.CreateBox(name, options, this.scene);
            zone.position = position;
            zone.material = material;
            zone.isPickable = false;
            return zone;
        };
        const matLeft = createInvisibleMat("matLeft");
        const matRight = createInvisibleMat("matRight");
        const matSideLeft = createInvisibleMat("matSideLeft");
        const matSideRight = createInvisibleMat("matSideRight");
        this.leftZone = createZone("leftZone", { width: width + 2 * extraMargin, height: zoneThickness, depth: 1 }, new BABYLON.Vector3(center.x, yPos, center.z - length / 2 - 0.5), matLeft);
        this.rightZone = this.leftZone.clone("rightZone");
        this.rightZone.position.z = center.z + length / 2 + 0.5;
        this.rightZone.material = matRight;
        this.sideLeftZone = createZone("sideLeftZone", { width: 1, height: zoneThickness, depth: length + 2 * extraMargin }, new BABYLON.Vector3(center.x - width / 2 - 0.5, yPos, center.z), matSideLeft);
        this.sideRightZone = this.sideLeftZone.clone("sideRightZone");
        this.sideRightZone.position.x = center.x + width / 2 + 0.5;
        this.sideRightZone.material = matSideRight;
    }
    _initBallSuperviseur() {
        this.scene.registerBeforeRender(() => {
            if (this.ball.intersectsMesh(this.leftZone, false)) {
                this._handlePointLoss('player2');
            }
            else if (this.ball.intersectsMesh(this.rightZone, false)) {
                this._handlePointLoss('player1');
            }
            else if (this.ball.intersectsMesh(this.sideLeftZone, false)) {
                this._handlePointLoss('player2');
            }
            else if (this.ball.intersectsMesh(this.sideRightZone, false)) {
                this._handlePointLoss('player1');
            }
        });
    }
    _handlePointLoss(losingPlayer) {
        let winner;
        if (losingPlayer === 'player1') {
            this.player2Score++;
            winner = 'player2';
        }
        else {
            this.player1Score++;
            winner = 'player1';
        }
        this._updateUI();
        this._resetBall(winner);
    }
    _createGUI() {
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.scoreText = new BABYLON.GUI.TextBlock();
        this.scoreText.text = "Joueur 1: 0 | Joueur 2: 0";
        this.scoreText.color = "white";
        this.scoreText.fontFamily = "Verdana";
        this.scoreText.fontSize = 24;
        this.scoreText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.scoreText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.scoreText.left = "10px";
        this.scoreText.top = "10px";
        advancedTexture.addControl(this.scoreText);
    }
    _updateUI() {
        this.scoreText.text = `Joueur 1: ${this.player1Score} | Joueur 2: ${this.player2Score}`;
    }
    _resetBall(winner) {
        const tableBox = this.floor.getBoundingInfo().boundingBox;
        const tableWidth = tableBox.maximum.x - tableBox.minimum.x;
        const tableCenter = this.floor.position;
        const ballHeight = tableBox.maximum.y + 0.5;
        const xOffset = tableWidth / 2 - 2;
        let x;
        let serveDir;
        if (winner === 'player1') {
            x = tableCenter.x + xOffset;
            serveDir = -1;
        }
        else {
            x = tableCenter.x - xOffset;
            serveDir = 1;
        }
        const z = tableCenter.z;
        this.ball.position.set(x, ballHeight, z);
        // Réinitialisation de la physique
        this.ball.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
        this.ball.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
    }
}
