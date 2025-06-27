//import * as BABYLON from 'babylonjs';
// import Ammo from 'ammo.js';
/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />


export var setPhysicImpostor = function (pingPongBall: BABYLON.Mesh, ground: BABYLON.GroundMesh, groundMaterial: BABYLON.StandardMaterial, scene: BABYLON.Scene) {
        // Importation du moteur physique
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(
            ground,
            BABYLON.PhysicsImpostor.BoxImpostor,
            { mass: 0, restitution: 0.9 },
            scene
          );
    
        groundMaterial.alpha = 0.5;
    
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(
            ground,
            BABYLON.PhysicsImpostor.BoxImpostor,
            {mass: 0, restitution: 0.5},
            scene
        );
    
        ground.material = groundMaterial;
    
        pingPongBall.physicsImpostor = new BABYLON.PhysicsImpostor(
            pingPongBall,
            BABYLON.PhysicsImpostor.SphereImpostor,
            { mass: 0.40, restitution: 0.9 },
            scene
          );
}