//import * as BABYLON from 'babylonjs';
import { AmmoJSPlugin } from "@babylonjs/core";
import { setPhysicImpostor } from "./config.js";
import { IPhysicsEnginePlugin, IPhysicsEnginePluginV2 } from "babylonjs";
// Déclaration globale pour Ammo.js
declare const Ammo: any;

/// <reference types="babylonjs" />
/// <reference types="babylonjs-gui" />



// TODO: recharger ammo plus clean
async function initializePhysicsEngine(scene: BABYLON.Scene): Promise<boolean> {
    try {
        await loadAmmoFromCDN();
        const ammoGlobal = (window as any).Ammo;
        if (!ammoGlobal) throw new Error("Ammo.js n'est pas chargé");
        // cast propre pour TS
        const ammoPlugin = new BABYLON.AmmoJSPlugin(true, ammoGlobal) as unknown as BABYLON.IPhysicsEnginePluginV2;
        scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), ammoPlugin);
        return true;


    } catch (error) {
        console.error("Erreur lors du chargement d'Ammo.js:", error);
        return false;
    }
}

async function loadAmmoFromCDN(): Promise<void> {
    const existingScripts = document.querySelectorAll('script[src*="ammo.js"]');
    existingScripts.forEach(script => script.remove());

    await new Promise(resolve => setTimeout(resolve, 100));

    const script = document.createElement('script');
    script.src = 'https://cdn.babylonjs.com/ammo.js';
    document.head.appendChild(script);

    await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Impossible de charger Ammo.js depuis CDN'));
    });

    await (window as any).Ammo();
}

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
            const hitbox = BABYLON.MeshBuilder.CreateBox(`${config.name}_hitbox`, {
                width: size.x,
                height: size.y,
                depth: size.z
            }, scene);

            hitbox.isVisible = false;

            (hitbox as any).physicsImpostor = new BABYLON.PhysicsImpostor(
                hitbox,
                BABYLON.PhysicsImpostor.BoxImpostor,
                { mass: 0, restitution: 0.9 },
                scene
            );

            hitbox.position = container.position.clone();
            hitbox.rotationQuaternion = container.rotationQuaternion.clone();
            hitbox.scaling = container.scaling.clone();

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

    scene.activeCamera = camera;
    camera.attachControl(canvas, true);

    // Initialiser le moteur physique - OBLIGATOIRE
    const physicsInitialized = await initializePhysicsEngine(scene);
    if (!physicsInitialized) {
        throw new Error("Physic not load");
    }

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 30, height: 20 }, scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    var groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1);
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

