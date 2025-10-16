declare const Ammo: any;
/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />


export var setPhysicImpostor = function (pingPongBall: BABYLON.Mesh, ground: BABYLON.GroundMesh, groundMaterial: BABYLON.StandardMaterial, scene: BABYLON.Scene) {
    (ground as any).physicsImpostor = new BABYLON.PhysicsImpostor(
        (ground as any),
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.9 },
        scene
    );

    groundMaterial.alpha = 0.5;

    (ground as any).physicsImpostor = new BABYLON.PhysicsImpostor(
        (ground as any),
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.5 },
        scene
    );

    ground.material = groundMaterial;

    (pingPongBall as any).physicsImpostor = new BABYLON.PhysicsImpostor(
        (pingPongBall as any),
        BABYLON.PhysicsImpostor.SphereImpostor,
        { mass: 0.40, restitution: 0.9 },
        scene
    );
}