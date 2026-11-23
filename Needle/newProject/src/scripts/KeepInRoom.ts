import { Behaviour, registerType, serializable } from "@needle-tools/engine";
import { Vector3 } from "three";

/**
 * Keeps a draggable object inside the room (the 6 x 6 m floor centered at 0,0,0).
 */
@registerType
export class KeepInRoom extends Behaviour {

    /** Half the room size in meters (floor is 6 m -> 3, minus a margin) */
    @serializable()
    halfSize: number = 2.8;

    @serializable()
    minHeight: number = 0;

    @serializable()
    maxHeight: number = 2.5;

    private _p = new Vector3();

    lateUpdate() {
        const p = this.gameObject.getWorldPosition(this._p);
        const x = Math.min(this.halfSize, Math.max(-this.halfSize, p.x));
        const z = Math.min(this.halfSize, Math.max(-this.halfSize, p.z));
        const y = Math.min(this.maxHeight, Math.max(this.minHeight, p.y));
        if (x !== p.x || y !== p.y || z !== p.z) {
            p.set(x, y, z);
            const parent = this.gameObject.parent;
            if (parent) parent.worldToLocal(p);
            this.gameObject.position.copy(p);
        }
    }
}

