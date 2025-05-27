/**
 * Core animation engine for calculating prop states
 */

import type { SequenceData, SequenceStep, PropState, PropAttributes } from '../../types/core.js';
import { mapPositionToCoordinates, lerpCoordinates } from '../../utils/math/diamond-grid.js';
import {
	calculateProIsolationStaffAngle,
	calculateAntispinTargetAngle,
	calculateStaticStaffAngle,
	calculateDashTargetAngle
} from '../../utils/math/prop-calculations.js';
import { ANIMATION_CONSTANTS } from '../../constants/animation.js';

/**
 * Core class that handles the animation calculations and state
 */
export class AnimationEngine {
	private sequenceData: SequenceData | null = null;
	private steps: SequenceStep[] = [];
	private totalBeats = 0;

	private bluePropState: PropState = {
		centerPathAngle: 0,
		staffRotationAngle: 0,
		x: 0,
		y: 0
	};

	private redPropState: PropState = {
		centerPathAngle: 0,
		staffRotationAngle: 0,
		x: 0,
		y: 0
	};

	/**
	 * Initialize the engine with sequence data
	 */
	initialize(data: SequenceData): boolean {
		try {
			this.sequenceData = data;

			// Extract steps (skip metadata and start position)
			this.steps = data.slice(2) as SequenceStep[];

			if (this.steps.length === 0) {
				return false;
			}

			// Calculate total beats (number of animation steps)
			this.totalBeats = this.steps.length;

			// Initialize prop states
			this.initializePropStates();

			return true;
		} catch (err) {
			console.error('Error initializing animation engine:', err);
			return false;
		}
	}

	/**
	 * Reset animation state
	 */
	reset(): void {
		this.initializePropStates();
	}

	/**
	 * Calculate prop states based on current beat
	 *
	 * Timing System:
	 * - Beat 0: Start position (initial state)
	 * - Beat 1 to totalBeats: Animation steps (each step gets full beat duration)
	 * - Beat totalBeats+: Final step completion (holds final position)
	 * - Start position is NOT counted as an animation frame
	 */
	calculateState(beat: number): void {
		if (!this.sequenceData || this.steps.length === 0) {
			return;
		}

		// Allow beat to go beyond totalBeats for final step completion
		// Constrain to reasonable range (0 to totalBeats+1)
		const constrainedBeat = Math.max(0, Math.min(beat, this.totalBeats + 1));

		// Get start position (index 1 in sequence data)
		const startPosition = this.sequenceData[1] as SequenceStep;

		if (constrainedBeat === 0) {
			// At beat 0, show start position (initial state)
			this.calculatePropState(
				this.bluePropState,
				startPosition.blue_attributes,
				startPosition.blue_attributes,
				0
			);
			this.calculatePropState(
				this.redPropState,
				startPosition.red_attributes,
				startPosition.red_attributes,
				0
			);
			return;
		}

		// For beats 1 to totalBeats, show animation steps
		// Beat 1.0 = start of first step, Beat 2.0 = start of second step, etc.
		const stepIndex = Math.floor(constrainedBeat - 1);
		const nextStepIndex = stepIndex + 1;

		// Get t value (fraction within current step, 0.0 to 1.0)
		const t = constrainedBeat - 1 - stepIndex;

		// Get current and next steps for interpolation
		let currentStep: SequenceStep;
		let nextStep: SequenceStep;

		if (stepIndex < 0) {
			// This shouldn't happen with our constraints, but handle gracefully
			currentStep = startPosition;
			nextStep = this.steps[0];
		} else if (stepIndex >= this.steps.length) {
			// At or past the end - show final step
			const finalStep = this.steps[this.steps.length - 1];
			currentStep = finalStep;
			nextStep = finalStep;
		} else {
			// Normal case: interpolating between steps
			currentStep = this.steps[stepIndex];

			if (nextStepIndex < this.steps.length) {
				// Interpolate to next step
				nextStep = this.steps[nextStepIndex];
			} else {
				// Last step - hold final position
				nextStep = currentStep;
			}
		}

		if (!currentStep || !nextStep) {
			return;
		}

		// Calculate prop states with interpolation
		this.calculatePropState(
			this.bluePropState,
			currentStep.blue_attributes,
			nextStep.blue_attributes,
			t
		);
		this.calculatePropState(
			this.redPropState,
			currentStep.red_attributes,
			nextStep.red_attributes,
			t
		);
	}

	/**
	 * Get current prop states
	 */
	getBluePropState(): PropState {
		return { ...this.bluePropState };
	}

	getRedPropState(): PropState {
		return { ...this.redPropState };
	}

	getTotalBeats(): number {
		return this.totalBeats;
	}

	getMetadata() {
		const meta = this.sequenceData?.[0] || {};
		return {
			totalBeats: this.totalBeats,
			word: meta.word || '',
			author: meta.author || ''
		};
	}

	canLoop(): boolean {
		return this.totalBeats > 0;
	}

	private initializePropStates(): void {
		this.bluePropState = { centerPathAngle: 0, staffRotationAngle: 0, x: 0, y: 0 };
		this.redPropState = { centerPathAngle: 0, staffRotationAngle: 0, x: 0, y: 0 };
	}

	private calculatePropState(
		propState: PropState,
		currentAttrs: PropAttributes,
		nextAttrs: PropAttributes,
		t: number
	): void {
		// Calculate position using direct coordinate mapping to hand points
		const startCoords = mapPositionToCoordinates(currentAttrs.start_loc);
		const endCoords = mapPositionToCoordinates(nextAttrs.start_loc);
		const currentCoords = lerpCoordinates(startCoords, endCoords, t);

		// Store coordinates in grid space (will be converted to canvas space in rendering)
		propState.x = currentCoords.x;
		propState.y = currentCoords.y;

		// Calculate center path angle for staff rotation calculations (backward compatibility)
		const centerX = ANIMATION_CONSTANTS.GRID_CENTER;
		const centerY = ANIMATION_CONSTANTS.GRID_CENTER;
		propState.centerPathAngle = Math.atan2(currentCoords.y - centerY, currentCoords.x - centerX);

		// Calculate staff rotation based on motion type
		propState.staffRotationAngle = this.calculateStaffRotation(
			propState.centerPathAngle,
			currentAttrs,
			nextAttrs,
			t
		);
	}

	private calculateStaffRotation(
		centerPathAngle: number,
		currentAttrs: PropAttributes,
		_nextAttrs: PropAttributes,
		t: number
	): number {
		switch (currentAttrs.motion_type) {
			case 'pro':
				return calculateProIsolationStaffAngle(
					currentAttrs.start_ori,
					currentAttrs.end_ori,
					currentAttrs.prop_rot_dir,
					currentAttrs.turns,
					t
				);

			case 'anti':
				return calculateAntispinTargetAngle(
					centerPathAngle,
					currentAttrs.start_ori,
					currentAttrs.end_ori,
					currentAttrs.prop_rot_dir,
					currentAttrs.turns,
					t
				);

			case 'static':
				return calculateStaticStaffAngle(centerPathAngle, currentAttrs.start_ori);

			case 'dash':
				return calculateDashTargetAngle(
					centerPathAngle,
					currentAttrs.start_ori,
					currentAttrs.end_ori,
					t
				);

			default:
				return 0;
		}
	}
}
