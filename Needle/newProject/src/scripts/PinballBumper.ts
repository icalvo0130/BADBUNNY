import { Behaviour, registerType, serializable } from "@needle-tools/engine";
import { Color, Material, Mesh, MeshStandardMaterial, Vector3 } from "three";
import type { PinballBall } from "./PinballBall.js";

/**
 * Goes on Bumper_Coconut_01/02/03 (and optionally slingshots).
 * When the ball touches it, the ball is pushed away with extra speed and the bumper lights up for a moment.
 */
@registerType
export class PinballBumper extends Behaviour {

    /** Minimum speed (m/s) the ball gets after hitting this bumper */
    @serializable()
    kickSpeed: number = 1.4;

    /** Light up and grow a bit when hit */
    @serializable()
    flash: boolean = true;

    /** How long the light lasts (s) */
    @serializable()
    flashDuration: number = 0.15;

    private _baseScale = new Vector3(1, 1, 1);
    private _flashLeft = 0;
    private _mats: MeshStandardMaterial[] = [];
    private _baseEmissive: Color[] = [];
    private _lastKick = -1;
    private _a = new Vector3();
    private _b = new Vector3();
    private static readonly _glow = new Color(1, 0.75, 0.25);

    start() {
        this._baseScale.copy(this.gameObject.scale);
        // clone materials so only this bumper lights up
        this.gameObject.traverse(o => {
            const mesh = o as Mesh;
            if (!mesh.isMesh) return;
            const cloneMat = (m: Material) => {
                const c = m.clone() as MeshStandardMaterial;
                if ((c as any).emissive) {
                    this._mats.push(c);
                    this._baseEmissive.push(c.emissive.clone());
                }
                return c;
            };
            if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(cloneMat);
            else if (mesh.material) mesh.material = cloneMat(mesh.material);
        });
    }

    kick(ball: PinballBall) {
        const rb = ball.rb;
        if (!rb) return;
        const now = this.context.time.time;
        if (now - this._lastKick < 0.05) return; // avoid double kicks
        this._lastKick = now;

        this.gameObject.getWorldPosition(this._a);
        ball.gameObject.getWorldPosition(this._b);
        const dir = this._b.sub(this._a);
        dir.y = 0;
        if (dir.lengthSq() < 1e-8) dir.set(0, 0, -1);
        dir.normalize();
        const speed = Math.max(this.kickSpeed, rb.getVelocity().length());
        rb.setVelocity(dir.x * speed, 0, dir.z * speed);
        rb.wakeUp();

        if (this.flash) this._flashLeft = this.flashDuration;
    }

    update() {
        if (this._flashLeft <= 0) return;
        this._flashLeft -= this.context.time.deltaTime;
        const t = Math.max(0, this._flashLeft / this.flashDuration);
        this.gameObject.scale.copy(this._baseScale).multiplyScalar(1 + 0.25 * t);
        for (let i = 0; i < this._mats.length; i++) {
            this._mats[i].emissive.copy(this._baseEmissive[i]).lerp(PinballBumper._glow, t);
        }
        if (this._flashLeft <= 0) {
            this.gameObject.scale.copy(this._baseScale);
            for (let i = 0; i < this._mats.length; i++) this._mats[i].emissive.copy(this._baseEmissive[i]);
        }
    }
}

