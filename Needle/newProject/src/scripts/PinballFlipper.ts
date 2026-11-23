import { Behaviour, GameObject, registerType, serializable } from "@needle-tools/engine";
import { Object3D, Quaternion, Vector3 } from "three";
import { PinballBall } from "./PinballBall.js";
import { PinballPlunger } from "./PinballPlunger.js";

/**
 * Goes on Flipper_L / Flipper_R (their pivot is already at the hinge).
 * Rotates the flipper up while the button is held and back when released.
 * Desktop: Z = left, / or Right Arrow = right. VR: left/right trigger. Touch: left/right half of the screen.
 */
@registerType
export class PinballFlipper extends Behaviour {

    /** Left flipper? (auto-detected from the name if it ends with _L / _R) */
    @serializable()
    isLeft: boolean = true;

    /** Rotation when pressed (degrees) */
    @serializable()
    maxAngle: number = 45;

    /** Rotation speed (degrees per second) */
    @serializable()
    speed: number = 1100;

    /** Flip the rotation direction if the flipper moves the wrong way */
    @serializable()
    invert: boolean = false;

    /** Ball speed (m/s) when hit with the tip of the flipper */
    @serializable()
    hitSpeed: number = 3.2;

    /** Flipper length in meters (hinge to tip) */
    @serializable()
    length: number = 0.085;

    private _ball: PinballBall | null = null;
    private _lastHit = -1;
    private _restDir = new Vector3();
    private _v = new Vector3();
    private _w = new Vector3();
    private _rest = new Quaternion();
    private _angle = 0;
    private _q = new Quaternion();
    private static readonly _yAxis = new Vector3(0, 1, 0);
    private static readonly leftKeys = ["z", "Z", "KeyZ", "ArrowLeft"];
    private static readonly rightKeys = ["/", "Slash", "-", "Minus", "ArrowRight"];

    awake() {
        const n = this.gameObject.name;
        if (n.endsWith("_L")) this.isLeft = true;
        else if (n.endsWith("_R")) this.isLeft = false;
        this._rest.copy(this.gameObject.quaternion);
        // direction hinge -> tip in the parent's space (the mesh points along +X for the left flipper, -X for the right)
        this._restDir.set(this.isLeft ? 1 : -1, 0, 0).applyQuaternion(this._rest);
        this._restDir.y = 0;
        this._restDir.normalize();
    }

    start() {
        const ballObj = this.context.scene.getObjectByName("Ball");
        if (ballObj) this._ball = GameObject.getComponent(ballObj, PinballBall);
    }

    /** If the ball is in the path the flipper swept this frame, give it the flipper's speed */
    private hitBall(prevAngle: number, newAngle: number, sign: number) {
        const ball = this._ball;
        const rb = ball?.rb;
        const parent = this.gameObject.parent;
        if (!ball || !rb || !parent) return;
        if (this.context.time.time - this._lastHit < 0.12) return;

        // ball center in the table's space
        const p = ball.gameObject.getWorldPosition(this._v);
        parent.worldToLocal(p);
        p.y += 0.0135;
        const h = this.gameObject.position;
        if (Math.abs(p.y - (h.y + 0.0135)) > 0.03) return; // ball not on the table level
        const rx = p.x - h.x, rz = p.z - h.z;
        const dist = Math.sqrt(rx * rx + rz * rz);
        if (dist < 0.008 || dist > this.length + 0.02) return;

        // angle of the ball around the hinge, measured like the flipper angle
        const d = this._restDir;
        const ang = Math.atan2(d.z * rx - d.x * rz, d.x * rx + d.z * rz) * 180 / Math.PI * sign;
        const margin = Math.asin(Math.min(1, 0.028 / dist)) * 180 / Math.PI; // ball radius + flipper half width
        if (ang < prevAngle - margin || ang > newAngle + margin) return;

        // tangential direction of the flipper at the ball (omega x r), in table space
        const w = sign; // rotation around +Y
        this._w.set(w * rz, 0, -w * rx).normalize();
        const speed = Math.max(1.2, this.hitSpeed * Math.min(1, dist / this.length));
        // to world space
        this._w.transformDirection(parent.matrixWorld);
        const cur = rb.getVelocity();
        rb.setVelocity(this._w.x * speed + cur.x * 0.2, 0, this._w.z * speed + cur.z * 0.2);
        rb.wakeUp();
        this._lastHit = this.context.time.time;
    }

    update() {
        const target = this.isPressed() ? this.maxAngle : 0;
        const step = this.speed * this.context.time.deltaTime;
        const prev = this._angle;
        if (this._angle < target) this._angle = Math.min(target, this._angle + step);
        else if (this._angle > target) this._angle = Math.max(target, this._angle - step);

        const sign = (this.isLeft ? 1 : -1) * (this.invert ? -1 : 1);
        if (this._angle > prev) this.hitBall(prev, this._angle, sign);
        this._q.setFromAxisAngle(PinballFlipper._yAxis, sign * this._angle * Math.PI / 180);
        this.gameObject.quaternion.copy(this._rest).multiply(this._q);
    }

    private isPressed(): boolean {
        const input = this.context.input;

        // keyboard
        const keys = this.isLeft ? PinballFlipper.leftKeys : PinballFlipper.rightKeys;
        for (const k of keys) if (input.isKeyPressed(k)) return true;

        // VR controllers (trigger)
        const xr = this.context.xr;
        if (xr) {
            for (const ctrl of xr.controllers) {
                const side = (ctrl as any).side ?? (ctrl.index === 0 ? "left" : "right");
                if ((side === "left") !== this.isLeft) continue;
                const btn = ctrl.getButton("xr-standard-trigger" as any) ?? ctrl.getButton("trigger" as any);
                if (btn?.pressed) return true;
            }
        }

        // touch: left / right half of the screen
        for (let i = 0; i < 10; i++) {
            if (!input.getPointerPressed(i)) continue;
            const ev = input.getPointerEvent(i) as any;
            if (!ev || ev.pointerType !== "touch") continue;
            if (PinballPlunger.activePointerId !== null && ev.pointerId === PinballPlunger.activePointerId) continue;
            const x = ev.clientX ?? ev.source?.clientX;
            if (typeof x !== "number") continue;
            const leftHalf = x < window.innerWidth / 2;
            if (leftHalf === this.isLeft) return true;
        }
        return false;
    }
}
