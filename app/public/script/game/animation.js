//import * as BABYLON from 'babylonjs';
/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />
// TODO : Lever legerement la balle quand on tire (mettre un applyimpulse ?)
export function animateLeftPaddle(paddle, onComplete) {
    if (!paddle) {
        console.error("can't find left paddle.");
        if (onComplete)
            onComplete();
        return;
    }
    paddle.animations = [];
    const startPos = paddle.position.clone(); // Position actuelle
    const forwardPos = startPos.add(new BABYLON.Vector3(3, 0, 1)); // Tire vers la droite et légèrement en avant
    const animation = new BABYLON.Animation("paddleHitAnimation", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    animation.setKeys([
        { frame: 0, value: startPos },
        { frame: 10, value: forwardPos },
        { frame: 20, value: startPos }
    ]);
    paddle.animations.push(animation);
    const anim = paddle.getScene().beginAnimation(paddle, 0, 20, false);
    if (!anim) {
        console.error("left paddle animation can't start");
        if (onComplete)
            onComplete();
        return;
    }
    anim.onAnimationEnd = () => {
        if (onComplete)
            onComplete();
    };
}
export function animateRightPaddle(paddle, onComplete) {
    if (!paddle) {
        console.error("can't find right paddle.");
        if (onComplete)
            onComplete();
        return;
    }
    paddle.animations = [];
    const startPos = paddle.position.clone(); // Position actuelle
    const forwardPos = startPos.add(new BABYLON.Vector3(-3, 0, 1)); // Tire vers la gauche et légèrement en avant
    const animation = new BABYLON.Animation("paddleHitAnimation", "position", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    animation.setKeys([
        { frame: 0, value: startPos },
        { frame: 10, value: forwardPos },
        { frame: 20, value: startPos }
    ]);
    paddle.animations.push(animation);
    const anim = paddle.getScene().beginAnimation(paddle, 0, 20, false);
    if (!anim) {
        console.error("right paddle animation can't start");
        if (onComplete)
            onComplete();
        return;
    }
    anim.onAnimationEnd = () => {
        if (onComplete)
            onComplete();
    };
}
//TODO : faire comme les autres animations, ne pas pouvoir spammer le service
export function serveBall(pingPongBall, scene, onComplete) {
    const velocityThreshold = 0.2;
    if (pingPongBall.physicsImpostor) {
        pingPongBall.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
        pingPongBall.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
    }
    const forceDirection = new BABYLON.Vector3(0, 10, 0); // Légèrement vers la gauche (-X), bien vers le haut (+Y)
    const forceMagnitude = 0.5; // Ajuste cette valeur pour plus ou moins de "puissance"
    if (pingPongBall.physicsImpostor) {
        pingPongBall.physicsImpostor.applyImpulse(forceDirection.scale(forceMagnitude), pingPongBall.physicsImpostor.getObjectCenter());
    }
    else {
        console.log("Physic impostor's ball don't find");
    }
    if (onComplete) {
        onComplete();
    }
}
