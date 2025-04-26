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

		// When we reach the end of a step, store the final angles for the next step
		if (t >= 0.999) {
			// Save end state of current step for smooth transitions
			bluePropState._previousEndCenterPathAngle = bluePropState.centerPathAngle;
			bluePropState._previousEndStaffRotationAngle = bluePropState.staffRotationAngle;
			
			redPropState._previousEndCenterPathAngle = redPropState.centerPathAngle;
			redPropState._previousEndStaffRotationAngle = redPropState.staffRotationAngle;
		}
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
		// Determine which format the data is in
		// Use type assertion to avoid TypeScript errors
		const currentStepAny = currentStep as any;
		const isNewFormat = 'blue_prop' in currentStepAny && 'red_prop' in currentStepAny;

		// Get the appropriate prop data based on format
		let attributes: PropAttributes;
		let prevAttributes: PropAttributes | null = null;

		if (isNewFormat) {
			// New format with blue_prop and red_prop
			attributes = propName === 'Blue' ? currentStepAny.blue_prop : currentStepAny.red_prop;
			prevAttributes = prevStep
				? propName === 'Blue'
					? (prevStep as any).blue_prop
					: (prevStep as any).red_prop
				: null;
		} else {
			// Old format with blue_attributes and red_attributes
			attributes = propName === 'Blue' ? currentStep.blue_attributes : currentStep.red_attributes;
			prevAttributes = prevStep
				? propName === 'Blue'
					? prevStep.blue_attributes
					: prevStep.red_attributes
				: null;
		}

		if (!attributes) {
			console.error(`${propName} prop attributes not found in step:`, currentStep);
			return; // Skip this calculation if attributes are missing
		}

		// Get attributes from the current step's data, handling both formats
		let startLoc, endLoc, motionType, propRotDir, turns, startOri, endOri;

		if (isNewFormat) {
			// New format mapping
			startLoc = attributes.start_loc; // Use location as start_loc
			endLoc = attributes.end_loc; // In new format, location is both start and end


			startOri = attributes.start_ori;
			endOri = attributes.end_ori;
		} else {
			// Original format
			startLoc = attributes.start_loc;
			endLoc = attributes.end_loc;
			motionType = attributes.motion_type;
			propRotDir = attributes.prop_rot_dir;
			turns = attributes.turns || 0;
			startOri = attributes.start_ori;
			endOri = attributes.end_ori;
		}

		// --- Update PropState with Current Step Attributes ---
		propState.current_start_loc = startLoc;
		propState.current_end_loc = endLoc;
		propState.current_start_ori = startOri;
		propState.current_end_ori = endOri;
		propState.current_motion_type = motionType;
		propState.current_prop_rot_dir = propRotDir;
		propState.current_turns = turns;

		const isFirstStepOverall = currentStepIndex === 0;
		// Detect if this is the *first frame* of a *new* step (either the very first step or a transition)
		const isNewStepStart =
			currentStepIndex !== previousStepIndex || (isFirstStepOverall && !propState._initialized);
			
		// STEP 1: Initialize or update the starting angles for this step
		if (isNewStepStart) {
			if (isFirstStepOverall && !propState._initialized) {
				// --- Condition 1: First Render of First Step ---
				propState._stepStartCenterPathAngle = mapPositionToAngle(startLoc);
				
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
				
				// Initialize previous end angles for first step
				propState._previousEndCenterPathAngle = propState._stepStartCenterPathAngle;
				propState._previousEndStaffRotationAngle = propState._stepStartStaffRotationAngle;
			} else {
				// --- Condition 2 or 3: Transition to a new step (or loop back) ---
				// Use the stored previous end angles for smooth transitions
				if (propState._previousEndCenterPathAngle !== null && propState._previousEndStaffRotationAngle !== null) {
					propState._stepStartCenterPathAngle = propState._previousEndCenterPathAngle;
					propState._stepStartStaffRotationAngle = propState._previousEndStaffRotationAngle;
				} else {
					// Fallback if previous end angles aren't available (should rarely happen)
					propState._stepStartCenterPathAngle = propState.centerPathAngle;
					propState._stepStartStaffRotationAngle = propState.staffRotationAngle;
				}

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

		// Calculate target staff rotation angle based on motion type
		let calculatedTargetStaffAngle = currentStartStaffAngle;
		
		if (motionType === 'pro') {
			// Pro-spin: staff always points to center (perpendicular to path)
			calculatedTargetStaffAngle = currentTargetCenterAngle + PI;
		} else if (motionType === 'anti') {
			// Anti-spin: independent rotation based on turns and direction
			const rotationDirMultiplier = propRotDir === 'cw' ? 1 : propRotDir === 'ccw' ? -1 : 0;
			const totalRotationDelta = TWO_PI * (turns ?? 0) * rotationDirMultiplier;
			calculatedTargetStaffAngle = currentStartStaffAngle + totalRotationDelta;
		} else {
			// Static/dash: maintain orientation unless end_ori specifies otherwise
			calculatedTargetStaffAngle = currentStartStaffAngle;
		}
		
		// Consider end_ori if specified (except for pro-spin which always points to center)
		if (motionType !== 'pro' && endOri) {
			const endOriAngle = mapOrientationToAngle(endOri);
			if (endOriAngle !== null) {
				calculatedTargetStaffAngle = endOriAngle;
			} else if (endOri.toLowerCase() === 'in') {
				calculatedTargetStaffAngle = currentTargetCenterAngle + PI;
			} else if (endOri.toLowerCase() === 'out') {
				calculatedTargetStaffAngle = currentTargetCenterAngle;
			}
		}
		
		propState._stepTargetStaffRotationAngle = calculatedTargetStaffAngle;
		const currentTargetStaffAngle = propState._stepTargetStaffRotationAngle;

		// STEP 3: Interpolate between start and target angles for the current frame (t)
		propState.centerPathAngle = lerpAngle(currentStartCenterAngle, currentTargetCenterAngle, t);

		if (motionType === 'pro') {
			// Pro-spin: staff angle is always perpendicular to the path (recalculate based on current position)
			propState.staffRotationAngle = normalizeAnglePositive(propState.centerPathAngle + PI);
		} else {
			// Anti-spin, static, dash: interpolate between start and target angles
			propState.staffRotationAngle = lerpAngle(currentStartStaffAngle, currentTargetStaffAngle, t);
		}

		// STEP 4: Update tracking properties
		propState._currentStepIndex = currentStepIndex; // Update the index *after* using it
		propState._lastT = t; // Track the last t value
	}
}
