// NEEDLE_CODEGEN_START
// auto generated code - do not edit directly

#pragma warning disable

namespace Needle.Typescript.GeneratedComponents
{
	public partial class PinballPlunger : UnityEngine.MonoBehaviour
	{
		[UnityEngine.Tooltip("Max pull distance in meters (8-10 cm)")]
		public float @maxPull = 0.09f;
		[UnityEngine.Tooltip("Ball speed (m/s) at full pull. Raise it if the ball doesn't reach the top.")]
		public float @launchSpeed = 3.2f;
		[UnityEngine.Tooltip("How fast the plunger springs back (m/s)")]
		public float @returnSpeed = 2.5f;
		[UnityEngine.Tooltip("The ball to launch. If empty, the object named Ball is used")]
		public UnityEngine.Transform @ball;
		[UnityEngine.Tooltip("Ball must be closer than this (m) to the plunger tip to be launched")]
		public float @launchRange = 0.06f;
		[UnityEngine.Tooltip("Width (m) of the invisible stopper at the plunger tip (lane is ~4.6 cm wide)")]
		public float @tipWidth = 0.044f;
		public void Awake() {}
		public void Start() {}
		public void OnDisable() {}
		public void onPointerDown(UnityEngine.EventSystems.PointerEventData @args) {}
		public void Update() {}
	}
}

// NEEDLE_CODEGEN_END