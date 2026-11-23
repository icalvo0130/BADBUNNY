import { Behaviour, Collision, GameObject, ICollider, Rigidbody, registerType, serializable } from "@needle-tools/engine";
import { Vector3 } from "three";
import { PinballBumper } from "./PinballBumper.js";

/**
 * Goes on the Ball. Remembers where the ball starts (in front of the Plunger),
 * resets it when it drains or falls off the table, and asks bumpers to kick it.
 */
@registerType
export class PinballBall extends Behaviour {

    /** If the ball falls this far (m) below its start height it is reset */
    @serializable()
    killDistance: number = 0.25;

    /** Seconds to wait before putting the ball back after it drained */
    @serializable()
    resetDelay: number = 0.6;

    rb: Rigidbody | null = null;
    private _spawn = new Vector3();
    private _tmp = new Vector3();
    private _resetAt = -1;

    start() {
        this.gameObject.getWorldPosition(this._spawn);
        this.rb = this.gameObject.getComponent(Rigidbody);
        if (this.rb) (this.rb as any).sleepThreshold = 0;
    }

    resetBall() {
        this._resetAt = -1;
        if (!this.rb) this.rb = this.gameObject.getComponent(Rigidbody);
        if (this.rb) {
            this.rb.teleport({ x: this._spawn.x, y: this._spawn.y, z: this._spawn.z }, false);
            this.rb.resetVelocities();
            this.rb.wakeUp();
        }
        else {
            this.gameObject.position.copy(this.gameObject.parent!.worldToLocal(this._tmp.copy(this._spawn)));
        }
    }

    update() {
        // Never let the ball fall asleep: on a gentle slope Rapier would freeze it in place
        if (this.rb && this.rb.isSleeping) this.rb.wakeUp();
        if (this._resetAt > 0 && this.context.time.time >= this._resetAt) {
            this.resetBall();
            return;
        }
        this.gameObject.getWorldPosition(this._tmp);
        const fell = this._tmp.y < this._spawn.y - this.killDistance;
        const flewAway = this._tmp.distanceTo(this._spawn) > 3;
        if (fell || flewAway) this.resetBall();
    }

    onTriggerEnter(col: ICollider) {
        const name = col?.gameObject?.name ?? "";
        if (name.startsWith("PF_Drain") && this._resetAt < 0) {
            this._resetAt = this.context.time.time + this.resetDelay;
        }
    }

    onCollisionEnter(col: Collision) {
        const obj = col.gameObject;
        if (!obj) return;
        const bumper = GameObject.getComponent(obj, PinballBumper) ?? GameObject.getComponentInParent(obj, PinballBumper);
        bumper?.kick(this);
    }
}
