/**
 * Core animation engine for calculating prop states
 */

import type { SequenceData, SequenceStep, PropState, PropAttributes } from '../../types/core.js';
import { mapPositionToAngle, lerpAngle } from '../../utils/math/angles.js';
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

			// Extract steps (skip metadata)
			this.steps = data.slice(1) as SequenceStep[];

			if (this.steps.length === 0) {
				return false;
			}

			// Calculate total beats (last step's beat number)
			this.totalBeats = this.steps.length > 0 ? this.steps[this.steps.length - 1].beat : 0;

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
	 */
	calculateState(beat: number): void {
		if (!this.sequenceData || this.steps.length === 0) {
			return;
		}

		// Constrain beat to valid range
		const constrainedBeat = Math.max(0, Math.min(beat, this.totalBeats));

		// Find the current step based on beat number
		const stepIndex = Math.floor(constrainedBeat);
		const nextStepIndex = Math.min(stepIndex + 1, this.steps.length - 1);

		// Get t value (fraction within step)
		const t = constrainedBeat - stepIndex;

		// Get steps
		const currentStep = this.steps[stepIndex];
		const nextStep = this.steps[nextStepIndex];

		if (!currentStep || !nextStep) {
			return;
		}

		// Calculate prop states
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

	getSequenceMetadata() {
		return this.sequenceData?.[0] || {};
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

	getPropStates() {
		return {
			blueProp: this.getBluePropState(),
			redProp: this.getRedPropState()
		};
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
		// Calculate center path angle
		const startAngle = mapPositionToAngle(currentAttrs.start_loc);
		const endAngle = mapPositionToAngle(nextAttrs.start_loc);
		propState.centerPathAngle = lerpAngle(startAngle, endAngle, t);

		// Calculate position using configurable radius
		const radius = ANIMATION_CONSTANTS.DEFAULT_CANVAS_RADIUS;
		propState.x = Math.cos(propState.centerPathAngle) * radius;
		propState.y = Math.sin(propState.centerPathAngle) * radius;

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
