/**
 * Angle calculation utilities
 */

import type { Orientation } from '../../types/core.js';
import { locationAngles, PI, TWO_PI } from './constants.js';

export function normalizeAnglePositive(angle: number): number {
	return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

export function normalizeAngleSigned(angle: number): number {
	const norm = normalizeAnglePositive(angle);
	return norm > PI ? norm - TWO_PI : norm;
}

export function mapPositionToAngle(loc: string | undefined): number {
	const l = loc?.toLowerCase();
	return locationAngles[l ?? ''] ?? 0;
}

export function mapOrientationToAngle(ori: Orientation): number {
	switch (ori) {
		case 'in':
			return PI;
		case 'out':
			return 0;
		case 'n':
			return -PI / 2;
		case 'e':
			return 0;
		case 's':
			return PI / 2;
		case 'w':
			return PI;
		default:
			return 0;
	}
}

export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

export function lerpAngle(a: number, b: number, t: number): number {
	const diff = normalizeAngleSigned(b - a);
	return normalizeAnglePositive(a + diff * t);
}
