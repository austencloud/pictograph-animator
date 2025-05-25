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
	const endAngle = mapOrientationToAngle((endOri as 'in' | 'out' | 'n' | 'e' | 's' | 'w') || 'in');
	const numTurns = turns ?? 0;

	let totalRotation = endAngle - startAngle;

	if (propRotDir === 'cw') {
		totalRotation += numTurns * TWO_PI;
	} else if (propRotDir === 'ccw') {
		totalRotation -= numTurns * TWO_PI;
	}

	const staffAngle = startAngle + totalRotation * t;
	return normalizeAnglePositive(staffAngle - centerPathAngle);
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
