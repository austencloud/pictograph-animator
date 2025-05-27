/**
 * Prop-specific calculation utilities
 */

import type { PropRotDir } from '../../types/core.js';
import { PI, TWO_PI } from './constants.js';
import { normalizeAnglePositive, mapOrientationToAngle } from './angles.js';

export function calculateProIsolationStaffAngle(
	startOri: string | undefined,
	endOri: string | undefined,
	propRotDir: PropRotDir,
	turns: number | undefined,
	t: number
): number {
	const startAngle = mapOrientationToAngle(
		(startOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in'
	);
	const endAngle = mapOrientationToAngle((endOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in');
	const numTurns = turns ?? 0;

	// Special case for pro motion with 0 turns: perform 90-degree isolation
	if (numTurns === 0) {
		// For isolation with 0 turns, add 90 degrees (π/2) in the specified direction
		const isolationRotation = propRotDir === 'ccw' ? -PI / 2 : PI / 2;
		return normalizeAnglePositive(startAngle + isolationRotation * t);
	}

	// For non-zero turns, use orientation-based interpolation
	let totalRotation = endAngle - startAngle;

	if (propRotDir === 'cw') {
		totalRotation += numTurns * TWO_PI;
		if (totalRotation < 0) totalRotation += TWO_PI;
	} else if (propRotDir === 'ccw') {
		totalRotation -= numTurns * TWO_PI;
		if (totalRotation > 0) totalRotation -= TWO_PI;
	}

	return normalizeAnglePositive(startAngle + totalRotation * t);
}

export function calculateAntispinTargetAngle(
	centerPathAngle: number,
	startOri: string | undefined,
	endOri: string | undefined,
	propRotDir: PropRotDir,
	turns: number | undefined,
	t: number
): number {
	const startAngle = mapOrientationToAngle(
		(startOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in'
	);
	const numTurns = turns ?? 0;

	// For antispin, we need to calculate based on hand movement direction
	// The prop rotates opposite to the hand's movement around the center

	// Calculate the base antispin rotation (opposite to hand movement)
	// For 0 turns, this should be exactly 90 degrees (π/2) opposite to prop_rot_dir
	let baseRotation: number;

	if (numTurns === 0) {
		// Special case for 0 turns: 90-degree antispin rotation
		baseRotation = propRotDir === 'ccw' ? PI / 2 : -PI / 2;
	} else {
		// For non-zero turns, use orientation interpolation plus additional turns
		const endAngle = mapOrientationToAngle(
			(endOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in'
		);
		let orientationChange = endAngle - startAngle;

		// Normalize orientation change to shortest path
		if (orientationChange > PI) orientationChange -= TWO_PI;
		if (orientationChange < -PI) orientationChange += TWO_PI;

		// Apply antispin: opposite rotation plus additional turns
		const additionalTurns = propRotDir === 'cw' ? numTurns * PI : -numTurns * PI;
		baseRotation = -orientationChange + additionalTurns;
	}

	const staffAngle = startAngle + baseRotation * t;
	return normalizeAnglePositive(staffAngle);
}

export function calculateStaticStaffAngle(
	centerPathAngle: number,
	startOri: string | undefined
): number {
	const startAngle = mapOrientationToAngle(
		(startOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in'
	);
	return normalizeAnglePositive(startAngle - centerPathAngle);
}

export function calculateDashTargetAngle(
	centerPathAngle: number,
	startOri: string | undefined,
	endOri: string | undefined,
	t: number
): number {
	const startAngle = mapOrientationToAngle(
		(startOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in'
	);
	const endAngle = mapOrientationToAngle((endOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in');

	let angleDiff = endAngle - startAngle;
	if (angleDiff > PI) angleDiff -= TWO_PI;
	if (angleDiff < -PI) angleDiff += TWO_PI;

	const staffAngle = startAngle + angleDiff * t;
	return normalizeAnglePositive(staffAngle - centerPathAngle);
}

export function calculateFloatStaffAngle(
	startOri: string | undefined,
	endOri: string | undefined,
	t: number
): number {
	const startAngle = mapOrientationToAngle(
		(startOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in'
	);
	const endAngle = mapOrientationToAngle((endOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in');

	// Simple interpolation between start and end orientations (no additional rotation)
	let angleDiff = endAngle - startAngle;
	if (angleDiff > PI) angleDiff -= TWO_PI;
	if (angleDiff < -PI) angleDiff += TWO_PI;

	return normalizeAnglePositive(startAngle + angleDiff * t);
}
