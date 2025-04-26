import type { PropState, SequenceStep, PropAttributes } from '../../types/sequence.js';
import {
	PI,
	TWO_PI,
	mapPositionToAngle,
	mapOrientationToAngle,
	normalizeAnglePositive
} from '../../utils/gridMapping.js';
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
		redPropState: PropState,
		totalBeats: number // Pass totalBeats for boundary checks
	) {
		if (parsedSteps.length === 0 || totalBeats === 0) return;

		// Ensure props have been initialized at least once before proceeding
		// This prevents calculations before resetAnimationState sets initial values
		// if (!bluePropState._initialized || !redPropState._initialized) {
		// 	// Allow calculation even if not initialized, calculatePropState handles init
		// 	// console.log(`Skipping calculateState: Props not initialized (Beat: ${beat.toFixed(3)})`);
		// 	// return;
		// }

		// Ensure beat doesn't exceed totalBeats for index calculation
		const clampedBeat = Math.min(beat, totalBeats);

		// Find the current step index based on the beat
		// If beat is exactly totalBeats, use the last step index
		let stepIndex = Math.floor(clampedBeat);
		if (stepIndex >= parsedSteps.length) {
			stepIndex = parsedSteps.length - 1; // Clamp to last valid index
		}
		// Ensure index is never negative
		stepIndex = Math.max(0, stepIndex);

		// Get the current step, ensure it's valid
		const currentStep = parsedSteps[stepIndex];
		if (!currentStep) {
			console.error(
				`Error: Could not find step at index ${stepIndex} for beat ${beat} (clamped: ${clampedBeat})`
			);
			return; // Avoid errors if step is somehow undefined
		}

		// Get the previous step (or use the first step's start state if we're at the beginning)
		const prevStep = stepIndex > 0 ? parsedSteps[stepIndex - 1] : null;

		// Calculate interpolation factor within the current step
		// Ensure t stays within [0, 1] even if beat slightly exceeds totalBeats due to floating point
		const stepBeat = clampedBeat - stepIndex;
		const t = Math.max(0, Math.min(stepBeat, 1.0)); // Clamp t to [0, 1]

		// --- Store previous step index before calculating ---
		const prevBlueStepIndex = bluePropState._currentStepIndex ?? -1;
		const prevRedStepIndex = redPropState._currentStepIndex ?? -1;

		// Calculate Blue Prop state
		this.calculatePropState(
			'Blue', // Add prop name for logging
			bluePropState,
			currentStep, // Pass the whole step object
			prevStep, // Pass the whole previous step object
			t,
			stepIndex, // Pass current step index
			prevBlueStepIndex, // Pass previous step index
			beat // Pass beat for logging context
		);

		// Calculate Red Prop state
		this.calculatePropState(
			'Red', // Add prop name for logging
			redPropState,
			currentStep, // Pass the whole step object
			prevStep, // Pass the whole previous step object
			t,
			stepIndex, // Pass current step index
			prevRedStepIndex, // Pass previous step index
			beat // Pass beat for logging context
		);

		// --- Update step index after calculating ---
		// Moved inside calculatePropState
	}

	/**
	 * Calculates the state of a single prop
	 */
	private static calculatePropState(
		propName: 'Blue' | 'Red', // For logging
		propState: PropState,
		currentStep: SequenceStep, // Current step object
		prevStep: SequenceStep | null, // Previous step object
		t: number,
		currentStepIndex: number, // Current step index being processed
		previousStepIndex: number, // The step index from the *last* call to this function
		beat: number // For logging
	) {
		// Determine which attributes to use (blue or red)
		const attributes =
			propName === 'Blue' ? currentStep.blue_attributes : currentStep.red_attributes;
		const prevAttributes = prevStep
			? propName === 'Blue'
				? prevStep.blue_attributes
				: prevStep.red_attributes
			: null;

		// Get attributes from the current step's data
		const startLoc = attributes.start_loc;
		const endLoc = attributes.end_loc;
		const motionType = attributes.motion_type;
		const rotDir = attributes.prop_rot_dir;
		const turns = attributes.turns || 0;
		const startOri = attributes.start_ori;
		const endOri = attributes.end_ori;

		// --- Update PropState with Current Step Attributes ---
		propState.current_start_loc = startLoc;
		propState.current_end_loc = endLoc;
		propState.current_start_ori = startOri;
		propState.current_end_ori = endOri;
		propState.current_motion_type = motionType;
		propState.current_prop_rot_dir = rotDir;
		propState.current_turns = turns;
		// Optional: Store overall step info if needed later
		// propState.current_letter = currentStep.letter;
		// propState.current_start_pos = currentStep.start_pos;
		// propState.current_end_pos = currentStep.end_pos;
		// --- End Update ---

		const isFirstStepOverall = currentStepIndex === 0;
		// Detect if this is the *first frame* of a *new* step (either the very first step or a transition)
		const isNewStepStart =
			currentStepIndex !== previousStepIndex || (isFirstStepOverall && !propState._initialized);

		// STEP 1: Initialize or update the starting angles for this step
		if (isNewStepStart) {
			if (isFirstStepOverall && !propState._initialized) {
				// --- Condition 1: First Render of First Step ---
				// console.log(`${propName} - Condition 1: First Step Initialization (Beat ${beat.toFixed(3)})`);
				propState._stepStartCenterPathAngle = mapPositionToAngle(startLoc);
				// ... (rest of initialization logic as before) ...
				if (startOri) {
					const oriAngle = mapOrientationToAngle(startOri);
					if (oriAngle !== null) propState._stepStartStaffRotationAngle = oriAngle;
					else if (startOri.toLowerCase() === 'in')
						propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle + PI;
					else if (startOri.toLowerCase() === 'out')
						propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle;
					else propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle + PI;
				} else if (motionType === 'pro') {
					propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle + PI;
				} else {
					propState._stepStartStaffRotationAngle = propState._stepStartCenterPathAngle;
				}
				propState.centerPathAngle = propState._stepStartCenterPathAngle;
				propState.staffRotationAngle = propState._stepStartStaffRotationAngle;
				propState._initialized = true;
			} else {
				// --- Condition 2 or 3: Transition to a new step (or loop back) ---
				// Capture the current angles (which *should* be the end state of the previous step)
				// This now runs whenever the stepIndex changes, ensuring capture even if t isn't exactly 0.

				// Special logging for Beat 2 transition (Step index 1)
				const isTransitioningToBeat2 = currentStepIndex === 1 && previousStepIndex === 0;

				// CRITICAL CAPTURE:
				propState._stepStartCenterPathAngle = propState.centerPathAngle;
				propState._stepStartStaffRotationAngle = propState.staffRotationAngle;

				// Check for data discontinuity (optional, but good sanity check)
				if (prevAttributes && prevAttributes.end_loc !== startLoc && !isFirstStepOverall) {
					// Don't warn on loop back
					console.warn(
						`${propName} - Potential sequence data discontinuity: ` +
							`Prev step ends at '${prevAttributes.end_loc}', current step starts at '${startLoc}'.`
					);
				}
			}
		}

		// STEP 2: Calculate target angles for the *current* step
		const currentStartCenterAngle = propState._stepStartCenterPathAngle ?? 0;
		const currentStartStaffAngle = propState._stepStartStaffRotationAngle ?? 0;
		propState._stepTargetCenterPathAngle = mapPositionToAngle(endLoc);
		const currentTargetCenterAngle = propState._stepTargetCenterPathAngle;

		let calculatedTargetStaffAngle = currentStartStaffAngle;
		if (motionType === 'pro') {
			// iso
			calculatedTargetStaffAngle = currentTargetCenterAngle + PI;
		} else if (motionType === 'anti') {
			// anti
			const rotationMultiplier = rotDir === 'cw' ? 1 : rotDir === 'ccw' ? -1 : 0;
			const totalRotation = TWO_PI * turns * rotationMultiplier;
			calculatedTargetStaffAngle = currentStartStaffAngle + totalRotation;
		} else if (motionType === 'static' || motionType === 'dash') {
			calculatedTargetStaffAngle = currentStartStaffAngle;
		}

		if (motionType !== 'pro' && endOri) {
			const endOriAngle = mapOrientationToAngle(endOri);
			if (endOriAngle !== null) calculatedTargetStaffAngle = endOriAngle;
			else if (endOri.toLowerCase() === 'in')
				calculatedTargetStaffAngle = currentTargetCenterAngle + PI;
			else if (endOri.toLowerCase() === 'out')
				calculatedTargetStaffAngle = currentTargetCenterAngle;
		}
		propState._stepTargetStaffRotationAngle = calculatedTargetStaffAngle;
		const currentTargetStaffAngle = propState._stepTargetStaffRotationAngle;

		// STEP 3: Interpolate between start and target angles for the current frame (t)
		propState.centerPathAngle = lerpAngle(currentStartCenterAngle, currentTargetCenterAngle, t);

		if (motionType === 'pro') {
			// iso
			propState.staffRotationAngle = normalizeAnglePositive(propState.centerPathAngle + PI);
		} else {
			// anti, static, dash
			propState.staffRotationAngle = lerpAngle(currentStartStaffAngle, currentTargetStaffAngle, t);
		}

		// STEP 4: Update tracking properties
		propState._currentStepIndex = currentStepIndex; // Update the index *after* using it
		propState._lastT = t; // Track the last t value

		// Special logging for the end of Beat 1 (Step index 0) when t is close to 1

	}
}
