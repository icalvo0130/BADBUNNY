import { Behaviour, BoxCollider, DragControls, DragMode, GameObject, MeshCollider, Renderer, Rigidbody, SphereCollider, registerType, serializable } from "@needle-tools/engine";
import { Object3D, Vector3 } from "three";
import { KeepInRoom } from "./KeepInRoom.js";
import { PinballBall } from "./PinballBall.js";
import { PinballBumper } from "./PinballBumper.js";
import { PinballFlipper } from "./PinballFlipper.js";
import { PinballPlunger } from "./PinballPlunger.js";

/**
 * Put this ONE component on the "Pinball" object (the playfield parent).
 * At start it sets up physics and interactions by object name, so you don't have to add
 * dozens of colliders by hand. Components you already added in Unity are kept (with your values).
 */
@registerType
export class PinballSetup extends Behaviour {

    /** Table slope in degrees. The table is flat, so gravity is tilted instead. */
    @serializable()
    tiltDegrees: number = 6.5;

    /** Ball radius in meters (13.5 mm) */
    @serializable()
    ballRadius: number = 0.0135;

    /** Ball bounciness (0-1) */
    @serializable()
    ballBounciness: number = 0.3;

    /** Bumper kick speed (m/s) used when the bumper component is added automatically */
    @serializable()
    bumperKickSpeed: number = 1.4;

    /** Slingshots kick the ball too (softer) */
    @serializable()
    slingshotsKick: boolean = true;

    /** Make Decor_*, Mascot_* and the loose palms draggable */
    @serializable()
    makeDecorDraggable: boolean = true;

    /** Shadow map size of the realtime light (smaller = faster on Quest). 0 = leave as exported */
    @serializable()
    shadowMapSize: number = 1024;

    start() {
        // Quest performance: keep the single realtime light's shadow map small and soft-cheap
        if (this.shadowMapSize > 0) {
            this.context.scene.traverse(o => {
                const l = o as any;
                if (l.isDirectionalLight && l.shadow && l.shadow.mapSize.x > this.shadowMapSize) {
                    l.shadow.mapSize.set(this.shadowMapSize, this.shadowMapSize);
                    l.shadow.map?.dispose();
                    l.shadow.map = null;
                }
            });
        }
    }

    awake() {
        this.setupGravity();

        const root = this.gameObject;
        // Only look at the direct children of "Pinball": those are the real pieces.
        // (Pieces with several materials get sub-meshes like "Decor_BeachUmbrella_1" - never touch those.)
        const named = (re: RegExp) => root.children.filter(o => re.test(o.name));

        // ---- Ball
        for (const ball of named(/^Ball$/)) {
            this.makeDynamic(ball);
            if (!GameObject.getComponent(ball, Rigidbody)) {
                GameObject.addComponent(ball, Rigidbody, {
                    mass: 0.08,
                    useGravity: true,
                    isKinematic: false,
                    drag: 0.05,
                    angularDrag: 0.05,
                    collisionDetectionMode: 1 as any, // Continuous
                    sleepThreshold: 0, // never sleep
                } as any);
            }
            if (!GameObject.getComponent(ball, SphereCollider)) {
                GameObject.addComponent(ball, SphereCollider, {
                    radius: this.ballRadius,
                    center: new Vector3(0, this.ballRadius, 0), // the ball's pivot is at its bottom
                    sharedMaterial: { bounciness: this.ballBounciness, dynamicFriction: 0.1 },
                } as any);
            }
            if (!GameObject.getComponent(ball, PinballBall)) GameObject.addComponent(ball, PinballBall);
        }

        // ---- Static table colliders (floor, walls, guides, aprons, ramp, house, drop targets)
        const statics = named(/^(PF_Base_Island|PF_Wall_.*|PF_Guide_.*|PF_Apron_.*|PF_Ramp_.*|Casita|DropTarget_.*|Slingshot_.*|Bumper_Coconut.*)$/);
        for (const o of statics) {
            if (!GameObject.getComponent(o, MeshCollider) && !GameObject.getComponent(o, BoxCollider))
                GameObject.addComponent(o, MeshCollider, { convex: false } as any);
        }

        // ---- Drain triggers
        for (const o of named(/^PF_Drain_.*$/)) {
            if (!GameObject.getComponent(o, BoxCollider)) {
                const bigger = o.name === "PF_Drain_Trigger";
                GameObject.addComponent(o, BoxCollider, {
                    isTrigger: true,
                    size: bigger ? new Vector3(0.12, 0.06, 0.05) : new Vector3(0.04, 0.06, 0.03),
                    center: new Vector3(0, 0.03, 0),
                } as any);
            }
        }

        // ---- Bumpers & slingshots
        for (const o of named(/^Bumper_Coconut.*$/)) {
            this.makeDynamic(o);
            if (!GameObject.getComponent(o, PinballBumper))
                GameObject.addComponent(o, PinballBumper, { kickSpeed: this.bumperKickSpeed } as any);
        }
        if (this.slingshotsKick) {
            for (const o of named(/^Slingshot_.*$/)) {
                if (!GameObject.getComponent(o, PinballBumper))
                    GameObject.addComponent(o, PinballBumper, { kickSpeed: this.bumperKickSpeed * 0.7, flash: false } as any);
            }
        }

        // ---- Flippers: kinematic (moved by rotation, the collider follows every frame)
        for (const o of named(/^Flipper_(L|R)$/)) {
            this.makeDynamic(o);
            if (!GameObject.getComponent(o, MeshCollider))
                GameObject.addComponent(o, MeshCollider, { convex: true } as any); // solid shape: the ball can't sink into it
            if (!GameObject.getComponent(o, PinballFlipper))
                GameObject.addComponent(o, PinballFlipper, { isLeft: o.name.endsWith("_L") } as any);
        }

        // ---- Plunger
        for (const o of named(/^Plunger$/)) {
            this.makeDynamic(o);
            if (!GameObject.getComponent(o, PinballPlunger)) GameObject.addComponent(o, PinballPlunger);
        }

        // ---- Draggable decoration
        if (this.makeDecorDraggable) {
            const draggables = named(/^(Decor_(?!Backdrop).*|Mascot_.*|Palm_Top.*)$/);
            for (const o of draggables) {
                this.makeDynamic(o);
                const big = o.scale.x > 2; // the big copies standing on the floor
                if (!GameObject.getComponent(o, DragControls)) {
                    GameObject.addComponent(o, DragControls, {
                        dragMode: big ? DragMode.XZPlane : DragMode.DynamicViewAngle,
                        xrDragMode: DragMode.Attached,
                        keepRotation: big,
                    } as any);
                }
                if (!GameObject.getComponent(o, KeepInRoom)) GameObject.addComponent(o, KeepInRoom);
                // one collider for the whole piece (moves with it while dragging).
                // Pieces standing ON the table get a trigger collider so they never block the ball.
                if (!GameObject.getComponent(o, BoxCollider) && !GameObject.getComponent(o, MeshCollider)) {
                    const box = BoxCollider.add(o as any) as any;
                    if (box && !big) { box.isTrigger = true; box.updateProperties?.(); box.updatePhysicsMaterial?.(); }
                }
            }
        }
    }

    /** Objects marked Static in Unity get frozen by Needle after a few frames. Moving parts must not be static. */
    /** Physics steps per second. The ball is small and fast: ~240 Hz keeps it from sinking or tunneling through walls */
    @serializable()
    physicsHz: number = 240;

    update() {
        const dt = this.context.time.deltaTime;
        const steps = Math.min(10, Math.max(1, Math.ceil(dt * this.physicsHz)));
        (this.context as any).physicsSteps = steps;
    }

    private makeDynamic(o: Object3D) {
        o.traverse(ch => {
            ch.matrixAutoUpdate = true;
            const r = GameObject.getComponent(ch, Renderer) as any;
            if (r) r.static = false;
        });
    }

    private setupGravity() {
        const engine = this.context.physics.engine;
        if (!engine) return;
        const g = 9.81;
        const a = this.tiltDegrees * Math.PI / 180;
        // world direction of the table's "down the slope" = the Pinball object's +Z (towards the player)
        const down = new Vector3(0, 0, 1).transformDirection(this.gameObject.matrixWorld);
        down.y = 0;
        if (down.lengthSq() < 1e-6) down.set(0, 0, 1);
        down.normalize();
        engine.gravity = {
            x: down.x * g * Math.sin(a),
            y: -g * Math.cos(a),
            z: down.z * g * Math.sin(a),
        };
    }
}

