// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class PinballSetup : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Table slope in degrees. The table is flat, so gravity is tilted instead.")]
		public float @tiltDegrees = 6.5f;
		[UnityEngine.Tooltip("Ball radius in meters (13.5 mm)")]
		public float @ballRadius = 0.0135f;
		[UnityEngine.Tooltip("Ball bounciness (0-1)")]
		public float @ballBounciness = 0.3f;
		[UnityEngine.Tooltip("Bumper kick speed (m/s) used when the bumper component is added automatically")]
		public float @bumperKickSpeed = 1.4f;
		[UnityEngine.Tooltip("Slingshots kick the ball too (softer)")]
		public bool @slingshotsKick = true;
		[UnityEngine.Tooltip("Make Decor_*, Mascot_* and the loose palms draggable")]
		public bool @makeDecorDraggable = true;
		[UnityEngine.Tooltip("Shadow map size of the realtime light (smaller = faster on Quest). 0 = leave as exported")]
		public float @shadowMapSize = 1024f;
		public void Start() {}
		public void Awake() {}
		[UnityEngine.Tooltip("Physics steps per second. The ball is small and fast: ~240 Hz keeps it from sinking or tunneling through walls")]
		public float @physicsHz = 240f;
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END