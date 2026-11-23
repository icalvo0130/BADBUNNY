import { Behaviour, BoxCollider, GameObject, IGameObject, NEPointerEvent, PointerEventData, registerType, serializable } from "@needle-tools/engine";
import { Object3D, Ray, Vector3 } from "three";
import { PinballBall } from "./PinballBall.js";

/**
 * Goes on the Plunger. Drag it back (mouse, touch or VR controller) only along its axis,
 * release it and it springs back and launches the ball. Strength depends on how far it was pulled.
 */
@registerType
export class PinballPlunger extends Behaviour {

    /** Max pull distance in meters (8-10 cm) */
    @serializable()
    maxPull: number = 0.09;

    /** Ball speed (m/s) at full pull. Raise it if the ball doesn't reach the top. */
    @serializable()
    launchSpeed: number = 3.2;

    /** How fast the plunger springs back (m/s) */
    @serializable()
    returnSpeed: number = 2.5;

    /** The ball to launch. If empty, the object named Ball is used */
    @serializable(Object3D)
    ball: Object3D | null = null;

    /** Ball must be closer than this (m) to the plunger tip to be launched */
    @serializable()
    launchRange: number = 0.06;

    /** Width (m) of the invisible stopper at the plunger tip (lane is ~4.6 cm wide) */
    @serializable()
    tipWidth: number = 0.044;

    /** pointerId currently dragging the plunger (flippers ignore this touch) */
    static activePointerId: number | null = null;

    private _restLocal = new Vector3();
    private _restWorld = new Vector3();
    private _axisWorld = new Vector3();
    private _pull = 0;
    private _dragging = false;
    private _pointerId = -1;
    private _space: IGameObject | null = null;
    private _startMeasure = 0;
    private _startPull = 0;
    private _ballComp: PinballBall | null = null;
    private _tmp = new Vector3();
    private _tmp2 = new Vector3();

    awake() {
        this._restLocal.copy(this.gameObject.position);
        // stopper as wide as the lane at the plunger tip, so the ball rests against it and can't slip past the rod
        if (!GameObject.getComponent(this.gameObject, BoxCollider)) {
            GameObject.addComponent(this.gameObject, BoxCollider, {
                size: new Vector3(this.tipWidth, 0.03, 0.02),
                center: new Vector3(0, 0, 0.007),
            } as any);
        }
    }

    start() {
        if (!this.ball) this.ball = this.context.scene.getObjectByName("Ball") ?? null;
        if (this.ball) this._ballComp = GameObject.getComponent(this.ball, PinballBall);
    }

    onDisable() {
        this.stopListening();
    }

    /** world position of the plunger at rest and world pull direction (parent +Z = towards the player) */
    private updateAxis() {
        const parent = this.gameObject.parent!;
        this._restWorld.copy(this._restLocal);
        parent.localToWorld(this._restWorld);
        this._tmp.copy(this._restLocal).add(this._tmp2.set(0, 0, 1));
        parent.localToWorld(this._tmp);
        this._axisWorld.copy(this._tmp).sub(this._restWorld).normalize();
    }

    /** how far along the pull axis the pointer currently is (m) */
    private measure(ev: NEPointerEvent): number | null {
        this.updateAxis();
        if (ev.isSpatial && ev.space) {
            // VR controller / hand: use the controller position
            const p = ev.space.worldPosition;
            return this._tmp.copy(p).sub(this._restWorld).dot(this._axisWorld);
        }
        const ray: Ray | undefined = ev.ray;
        if (!ray) return null;
        // closest point on the plunger axis to the pointer ray
        const u = this._axisWorld, v = ray.direction;
        const w0 = this._tmp.copy(this._restWorld).sub(ray.origin);
        const b = u.dot(v), d = u.dot(w0), e = v.dot(w0);
        const denom = 1 - b * b;
        if (Math.abs(denom) < 1e-4) return null;
        return (b * e - d) / denom;
    }

    onPointerDown(args: PointerEventData) {
        if (this._dragging) return;
        const ev = args.event as NEPointerEvent;
        const m = this.measure(ev);
        if (m === null) return;
        args.use();
        args.setPointerCapture?.();
        this._dragging = true;
        this._pointerId = ev.pointerId;
        PinballPlunger.activePointerId = ev.pointerId;
        this._space = ev.isSpatial ? ev.space : null;
        this._startMeasure = m;
        this._startPull = this._pull;
        this.context.input.addEventListener("pointermove", this.onMove);
        this.context.input.addEventListener("pointerup", this.onUp);
    }

    private onMove = (ev: NEPointerEvent) => {
        if (!this._dragging || ev.pointerId !== this._pointerId) return;
        const m = this.measure(ev);
        if (m === null) return;
        this._pull = Math.min(this.maxPull, Math.max(0, this._startPull + (m - this._startMeasure)));
    };

    private onUp = (ev: NEPointerEvent) => {
        if (!this._dragging || ev.pointerId !== this._pointerId) return;
        this.release();
    };

    private stopListening() {
        this.context.input.removeEventListener("pointermove", this.onMove);
        this.context.input.removeEventListener("pointerup", this.onUp);
    }

    private release() {
        this._dragging = false;
        this._space = null;
        PinballPlunger.activePointerId = null;
        this.stopListening();
        this.launch(this._pull / this.maxPull);
    }

    private launch(strength: number) {
        if (strength < 0.05) return;
        if (!this._ballComp && this.ball) this._ballComp = GameObject.getComponent(this.ball, PinballBall);
        const rb = this._ballComp?.rb;
        if (!rb || !this.ball) return;
        this.updateAxis();
        // tip of the plunger at rest
        this.ball.getWorldPosition(this._tmp);
        if (this._tmp.distanceTo(this._restWorld) > this.launchRange + this.maxPull) return;
        const speed = this.launchSpeed * strength;
        rb.setVelocity(-this._axisWorld.x * speed, -this._axisWorld.y * speed, -this._axisWorld.z * speed);
        rb.wakeUp();
    }

    update() {
        if (this._dragging && this._space) {
            // VR: follow the controller every frame
            this.updateAxis();
            const m = this._tmp.copy(this._space.worldPosition).sub(this._restWorld).dot(this._axisWorld);
            this._pull = Math.min(this.maxPull, Math.max(0, this._startPull + (m - this._startMeasure)));
        }
        else if (!this._dragging && this._pull > 0) {
            // spring back
            this._pull = Math.max(0, this._pull - this.returnSpeed * this.context.time.deltaTime);
        }
        this.gameObject.position.set(this._restLocal.x, this._restLocal.y, this._restLocal.z + this._pull);
    }
}

