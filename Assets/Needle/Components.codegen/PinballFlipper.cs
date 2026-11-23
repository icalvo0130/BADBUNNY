// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class PinballFlipper : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Left flipper? (auto-detected from the name if it ends with _L / _R)")]
		public bool @isLeft = true;
		[UnityEngine.Tooltip("Rotation when pressed (degrees)")]
		public float @maxAngle = 45f;
		[UnityEngine.Tooltip("Rotation speed (degrees per second)")]
		public float @speed = 1100f;
		[UnityEngine.Tooltip("Flip the rotation direction if the flipper moves the wrong way")]
		public bool @invert = false;
		[UnityEngine.Tooltip("Ball speed (m/s) when hit with the tip of the flipper")]
		public float @hitSpeed = 3.2f;
		[UnityEngine.Tooltip("Flipper length in meters (hinge to tip)")]
		public float @length = 0.085f;
		public void Awake() {}
		public void Start() {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END