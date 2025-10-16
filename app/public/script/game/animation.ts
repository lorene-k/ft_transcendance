//import * as BABYLON from 'babylonjs';
/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />

export function animateLeftPaddle(paddle: BABYLON.Mesh, onComplete: any) {
    if (!paddle) {
        console.error("can't find left paddle.");
        if (onComplete) onComplete();
        return;
    }

    paddle.animations = [];

    const startPos = paddle.position.clone();
    const forwardPos = startPos.add(new BABYLON.Vector3(3, 0, 1));

    const animation = new BABYLON.Animation(
        "paddleHitAnimation",
        "position",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    animation.setKeys([
        { frame: 0, value: startPos },
        { frame: 10, value: forwardPos },
        { frame: 20, value: startPos }
    ]);

    paddle.animations.push(animation);

    const anim = paddle.getScene().beginAnimation(paddle, 0, 20, false);
    if (!anim) {
        console.error("left paddle animation can't start");
        if (onComplete) onComplete();
        return;
    }

    anim.onAnimationEnd = () => {
        if (onComplete) onComplete();
    };
}


export function animateRightPaddle(paddle: BABYLON.Mesh, onComplete: any) {
    if (!paddle) {
        console.error("can't find right paddle.");
        if (onComplete) onComplete();
        return;
    }

    paddle.animations = [];

    const startPos = paddle.position.clone();
    const forwardPos = startPos.add(new BABYLON.Vector3(-3, 0, 1));

    const animation = new BABYLON.Animation(
        "paddleHitAnimation",
        "position",
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    animation.setKeys([
        { frame: 0, value: startPos },
        { frame: 10, value: forwardPos },
        { frame: 20, value: startPos }
    ]);

    paddle.animations.push(animation);

    const anim = paddle.getScene().beginAnimation(paddle, 0, 20, false);
    if (!anim) {
        console.error("right paddle animation can't start");
        if (onComplete) onComplete();
        return;
    }

    anim.onAnimationEnd = () => {
        if (onComplete) onComplete();
    };
}
