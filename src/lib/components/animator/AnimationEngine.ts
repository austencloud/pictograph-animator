import type { PropState, SequenceStep } from '../../types/sequence.js';
import { PI, TWO_PI, mapPositionToAngle, mapOrientationToAngle } from '../../utils/gridMapping.js';
import { lerpAngle } from '../../utils/animationUtils.js';

/**
 * Core animation engine for calculating prop states
 */
export class AnimationEngine {
	/**
	 * Calculates the state of both props at a given beat
	 */
	static calculateState(
		beat: number,
		parsedSteps: SequenceStep[],
		bluePropState: PropState,
		redPropState: PropState
	) {
		if (parsedSteps.length === 0) return;

		// Find the current step based on the beat
		const stepIndex = Math.min(Math.floor(beat), parsedSteps.length - 1);
		const currentStep = parsedSteps[stepIndex];

		// Get the previous step (or use the first step's start state if we're at the beginning)
		const prevStep = stepIndex > 0 ? parsedSteps[stepIndex - 1] : null;

		// Calculate interpolation factor within the current step
		const stepBeat = beat - stepIndex;
		const t = Math.min(stepBeat, 1.0); // Clamp to [0, 1]

		// Calculate Blue Prop state
		this.calculatePropState(
			bluePropState,
			currentStep.blue_attributes,
			prevStep?.blue_attributes || null,
			t,
			stepIndex === 0
		);

		// Calculate Red Prop state
		this.calculatePropState(
			redPropState,
			currentStep.red_attributes,
			prevStep?.red_attributes || null,
			t,
			stepIndex === 0
		);

		// Update positions based on angles
		this.updatePropPosition(bluePropState);
		this.updatePropPosition(redPropState);
	}

	/**
	 * Calculates the state of a single prop
	 */
	private static calculatePropState(
		propState: PropState,
		attributes: any,
		prevAttributes: any | null, // Now used to get the previous end location
		t: number,
		isFirstStep: boolean
	) {
		// Get start and end locations
		const startLoc = attributes.start_loc;
		const endLoc = attributes.end_loc;

		// Get motion type and rotation direction
		const motionType = attributes.motion_type;
		const rotDir = attributes.prop_rot_dir;
		const turns = attributes.turns || 0;

		// Get start and end orientations
		const startOri = attributes.start_ori;
		const endOri = attributes.end_ori;

		// Initialize the prop state if this is the first time we're calculating it
		// or if we're starting a new step and need to set up the start angles
		if (isFirstStep && t === 0) {
			// For the very first step, initialize from the start location
			propState._stepStartCenterPathAngle = mapPositionToAngle(startLoc);
			propState.centerPathAngle = propState._stepStartCenterPathAngle;

			// Set initial staff rotation angle based on start orientation or motion type
			if (startOri) {
				const oriAngle = mapOrientationToAngle(startOri);
				propState._stepStartStaffRotationAngle =
					oriAngle !== null ? oriAngle : propState._stepStartCenterPathAngle + PI; // Default to pointing toward center
			} else if (motionType === 'pro') {
				// Pro motion: staff points toward center
				propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle + PI;
			} else {
				// Default orientation
				propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle;
			}

			propState.staffRotationAngle = propState._stepStartStaffRotationAngle;
		} else if (t === 0 && !propState._stepStartCenterPathAngle) {
			// If we don't have a start angle yet (e.g., first time running), initialize it
			propState._stepStartCenterPathAngle = mapPositionToAngle(startLoc);
			propState.centerPathAngle = propState._stepStartCenterPathAngle;

			// Initialize staff rotation angle
			if (startOri) {
				const oriAngle = mapOrientationToAngle(startOri);
				propState._stepStartStaffRotationAngle =
					oriAngle !== null ? oriAngle : propState._stepStartCenterPathAngle + PI;
			} else if (motionType === 'pro') {
				propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle + PI;
			} else {
				propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle;
			}

			propState.staffRotationAngle = propState._stepStartStaffRotationAngle;
		} else if (t === 0) {
			// For subsequent steps, verify that the start location matches the previous end location
			if (prevAttributes && prevAttributes.end_loc !== startLoc) {
				console.warn(
					`Potential discontinuity: Previous step ends at ${prevAttributes.end_loc} but current step starts at ${startLoc}`
				);

				// Even though there's a discontinuity, we should update the start angle to match the new start location
				// This ensures that the animation doesn't jump when the sequence has discontinuities
				propState._stepStartCenterPathAngle = mapPositionToAngle(startLoc);

				// Update staff rotation angle based on the new start location and orientation
				if (startOri) {
					const oriAngle = mapOrientationToAngle(startOri);
					propState._stepStartStaffRotationAngle =
						oriAngle !== null ? oriAngle : propState._stepStartCenterPathAngle + PI;
				} else if (motionType === 'pro') {
					propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle + PI;
				} else {
					propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle;
				}
			}
		}

		// Calculate target center path angle for this step
		propState._stepTargetCenterPathAngle = mapPositionToAngle(endLoc);

		// Calculate target staff rotation angle based on motion type
		if (motionType === 'pro') {
			// Pro motion: staff always points toward center
			propState._stepTargetStaffRotationAngle = propState._stepTargetCenterPathAngle + PI;
		} else if (motionType === 'anti') {
			// Anti motion: staff rotates based on rotation direction and turns
			const rotationMultiplier = rotDir === 'cw' ? -1 : 1; // CW is negative in canvas coords
			const totalRotation = TWO_PI * turns * rotationMultiplier;

			// If end orientation is specified, use it as the target
			if (endOri) {
				const oriAngle = mapOrientationToAngle(endOri);
				propState._stepTargetStaffRotationAngle =
					oriAngle !== null
						? oriAngle
						: (propState._stepStartStaffRotationAngle || 0) + totalRotation;
			} else {
				// Otherwise calculate based on start angle and total rotation
				propState._stepTargetStaffRotationAngle =
					(propState._stepStartStaffRotationAngle || 0) + totalRotation;
			}
		} else if (motionType === 'static') {
			// Static motion: staff maintains its orientation
			propState._stepTargetStaffRotationAngle = propState._stepStartStaffRotationAngle;
		} else if (motionType === 'dash') {
			// Dash motion: staff maintains its orientation but may have specific end orientation
			if (endOri) {
				const oriAngle = mapOrientationToAngle(endOri);
				propState._stepTargetStaffRotationAngle =
					oriAngle !== null ? oriAngle : propState._stepStartStaffRotationAngle;
			} else {
				propState._stepTargetStaffRotationAngle = propState._stepStartStaffRotationAngle;
			}
		}

		// Interpolate between start and target angles
		propState.centerPathAngle = lerpAngle(
			propState._stepStartCenterPathAngle || 0,
			propState._stepTargetCenterPathAngle || 0,
			t
		);

		propState.staffRotationAngle = lerpAngle(
			propState._stepStartStaffRotationAngle || 0,
			propState._stepTargetStaffRotationAngle || 0,
			t
		);

		// For the next step, the current end becomes the next start
		if (t === 1.0) {
			propState._stepStartCenterPathAngle = propState._stepTargetCenterPathAngle;
			propState._stepStartStaffRotationAngle = propState._stepTargetStaffRotationAngle;
		}
	}

	/**
	 * Updates the x,y position of a prop based on its centerPathAngle
	 * Note: This method is actually called by the CanvasRenderer component,
	 * which provides the actual canvas dimensions and scale factors.
	 * This is just a placeholder that will be overridden.
	 */
	private static updatePropPosition(propState: PropState) {
		// The actual implementation is in the CanvasRenderer component
		// This is just a placeholder
		if (!propState.x && !propState.y) {
			propState.x = 0;
			propState.y = 0;
		}
	}
}
