/**
 * Prop-specific calculation utilities
 * Updated to use the new sequence interpretation configuration system
 */

import type { PropRotDir } from '../../types/core.js';
import { PI, TWO_PI } from './constants.js';
import { normalizeAnglePositive } from './angles.js';
import {
	getDegreesForTurns,
	getRotationMultiplier,
	getOrientationAngle,
	degreesToRadians,
	normalizeAngle,
	calculateProFloatRotation
} from '../../config/sequence-interpretation.js';

export function calculateProIsolationStaffAngle(
	startOri: string | undefined,
	endOri: string | undefined,
	propRotDir: PropRotDir,
	turns: number | undefined,
	t: number
): number {
	const startAngle = getOrientationAngle(startOri);
	const endAngle = getOrientationAngle(endOri);
	const numTurns = turns ?? 0;

	// Special case: 0 turns is a "float" - handle differently
	if (numTurns === 0) {
		// For 0 turns (float), the staff should rotate 90 degrees
		// in the same direction as the center path rotation to cancel visual rotation
		const baseRotation = startAngle;
		const floatRotation = degreesToRadians(90) * getRotationMultiplier(propRotDir);
		return normalizeAngle(baseRotation + floatRotation * t);
	}

	// Calculate total rotation for non-zero turns
	let totalRotation = endAngle - startAngle;

	// Add the turn rotation
	const turnRotation = degreesToRadians(getDegreesForTurns(numTurns));
	const directionMultiplier = getRotationMultiplier(propRotDir);

	totalRotation += turnRotation * directionMultiplier;

	// Ensure we take the shortest path for orientation change
	if (totalRotation > PI) totalRotation -= TWO_PI;
	if (totalRotation < -PI) totalRotation += TWO_PI;

	return normalizeAngle(startAngle + totalRotation * t);
}

export function calculateAntispinTargetAngle(
	centerPathAngle: number,
	startOri: string | undefined,
	endOri: string | undefined,
	propRotDir: PropRotDir,
	turns: number | undefined,
	t: number
): number {
	const startAngle = getOrientationAngle(startOri);
	const endAngle = getOrientationAngle(endOri);
	const numTurns = turns ?? 0;

	// Calculate orientation change
	let totalRotation = endAngle - startAngle;

	// Add turn rotation
	const turnRotation = degreesToRadians(getDegreesForTurns(numTurns));
	const directionMultiplier = getRotationMultiplier(propRotDir);

	totalRotation += turnRotation * directionMultiplier;

	// Calculate current staff angle
	const staffAngle = startAngle + totalRotation * t;

	// For antispin, subtract the center path angle to maintain orientation relative to grid
	return normalizeAngle(staffAngle - centerPathAngle);
}

export function calculateStaticStaffAngle(
	centerPathAngle: number,
	startOri: string | undefined
): number {
	const startAngle = getOrientationAngle(startOri);
	// For static motion, maintain fixed orientation relative to grid
	return normalizeAngle(startAngle - centerPathAngle);
}

export function calculateDashTargetAngle(
	centerPathAngle: number,
	startOri: string | undefined,
	endOri: string | undefined,
	t: number
): number {
	const startAngle = getOrientationAngle(startOri);
	const endAngle = getOrientationAngle(endOri);

	// Calculate the shortest path between orientations
	let angleDiff = endAngle - startAngle;
	if (angleDiff > PI) angleDiff -= TWO_PI;
	if (angleDiff < -PI) angleDiff += TWO_PI;

	// Interpolate between start and end orientations
	const staffAngle = startAngle + angleDiff * t;

	// Adjust for center path rotation to maintain orientation relative to grid
	return normalizeAngle(staffAngle - centerPathAngle);
}
