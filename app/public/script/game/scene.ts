//import * as BABYLON from 'babylonjs';
import { AmmoJSPlugin } from "@babylonjs/core";
import { setPhysicImpostor } from "./config.js";
// depuis public/script/game/scene.js
import type AmmoType from 'ammojs-typed';
declare const Ammo: typeof AmmoType;

/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />

async function loadPaddle(scene: BABYLON.Scene) {
    const paddleConfig = [
        {
            name: "paddleLeft",
            position: new BABYLON.Vector3(-16, 1.5, 0),
            rotationAxis: new BABYLON.Vector3(0, 0, -1),
            rotationAngle: -Math.PI / 2
        },
        {
            name: "paddleRight",
            position: new BABYLON.Vector3(16, 1.5, 0),
            rotationAxis: new BABYLON.Vector3(0, 0, -1),
            rotationAngle: -Math.PI / 2
        }
    ];

    for (const config of paddleConfig) {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", "../../ressources/", "raquette.glb", scene);

            const container = result.meshes[0]; // parent racine
            container.name = config.name;
            container.position = config.position.clone();
            container.scaling = new BABYLON.Vector3(2, 2, 2);
            container.scaling.x *= -1;
            container.rotationQuaternion = BABYLON.Quaternion.RotationAxis(config.rotationAxis, config.rotationAngle);

            const size = getCombinedBoundingSize(container);

            // Hitbox invisible
            const hitbox = BABYLON.MeshBuilder.CreateBox(`${config.name}_hitbox`, {
                width: size.x,
                height: size.y,
                depth: size.z
            }, scene);

            hitbox.isVisible = false;

            // Syncro hitbot mesh raquette
            hitbox.position = container.position.clone();
            hitbox.rotationQuaternion = container.rotationQuaternion.clone();
            hitbox.scaling = container.scaling.clone();

            hitbox.physicsImpostor = new BABYLON.PhysicsImpostor(
                hitbox,
                BABYLON.PhysicsImpostor.BoxImpostor,
                { mass: 0, restitution: 0.9 },
                scene
            );

            // Syncro les chagnement a chaque frame
            scene.onBeforeRenderObservable.add(() => {
                container.position.copyFrom(hitbox.position);
                if (hitbox.rotationQuaternion) {
                    container.rotationQuaternion?.copyFrom(hitbox.rotationQuaternion);
                }
            });

        } catch (error) {
            console.error(`Erreur lors du chargement de ${config.name}`, error);
        }
    }

    // Calcul de la taille totale du mesh
    function getCombinedBoundingSize(mesh: BABYLON.AbstractMesh) {
        const children = mesh.getChildMeshes().filter(m => m.getTotalVertices() > 0);
        if (children.length === 0) return new BABYLON.Vector3(0, 0, 0);

        let min = children[0].getBoundingInfo().boundingBox.minimumWorld.clone();
        let max = children[0].getBoundingInfo().boundingBox.maximumWorld.clone();

        for (let i = 1; i < children.length; i++) {
            const childBB = children[i].getBoundingInfo().boundingBox;
            min = BABYLON.Vector3.Minimize(min, childBB.minimumWorld);
            max = BABYLON.Vector3.Maximize(max, childBB.maximumWorld);
        }

        return max.subtract(min);
    }
}



// Fonction qui crée la scène
export async function createScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    let scene = new BABYLON.Scene(engine);
    if (!scene)
        console.log("Scene not load");

    var camera = new BABYLON.ArcRotateCamera(
        "ArcCam",
        Math.PI / 2,
        Math.PI / 4,
        40,
        BABYLON.Vector3.Zero(),
        scene
    );

    if (!camera)
        console.log("Camera not load");

    camera.attachControl(canvas, true);

    await Ammo;
    const ammoPlugin = new BABYLON.AmmoJSPlugin(true, Ammo);
    scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), ammoPlugin);

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 30, height: 20 }, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1); // vert foncé
    ground.material = groundMaterial;

    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
    var pingPongBall = BABYLON.MeshBuilder.CreateSphere("pingPongBall", {
        diameter: 1,
        segments: 32
    }, scene);

    pingPongBall.position = new BABYLON.Vector3(-13, 10, 0);
    var middleLine = BABYLON.CreateBox("middleLine", {
        width: 0.2,
        height: 0.50,
        depth: 20
    }, scene);

    setPhysicImpostor(pingPongBall, ground, groundMaterial, scene);
    await loadPaddle(scene);
    return scene;
};
