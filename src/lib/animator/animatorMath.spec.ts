import { describe, it, expect } from 'vitest';
import {
	PI,
	TWO_PI,
	HALF_PI,
	locationAngles,
	normalizeAnglePositive,
	normalizeAngleSigned,
	mapPositionToAngle,
	mapOrientationToAngle,
	lerp,
	lerpAngle,
	calculateProIsolationStaffAngle,
	calculateAntispinTargetAngle,
	calculateStaticStaffAngle,
	calculateDashTargetAngle
} from './utils/math/index.js';

describe('animatorMath', () => {
	it('locationAngles are correct', () => {
		expect(locationAngles.e).toBe(0);
		expect(locationAngles.s).toBeCloseTo(HALF_PI);
		expect(locationAngles.w).toBeCloseTo(PI);
		expect(locationAngles.n).toBeCloseTo(-HALF_PI);
	});

	it('normalizeAnglePositive wraps correctly', () => {
		expect(normalizeAnglePositive(0)).toBe(0);
		expect(normalizeAnglePositive(TWO_PI)).toBe(0);
		expect(normalizeAnglePositive(-PI)).toBeCloseTo(PI);
		expect(normalizeAnglePositive(3 * PI)).toBeCloseTo(PI);
	});

	it('normalizeAngleSigned wraps correctly', () => {
		expect(normalizeAngleSigned(0)).toBe(0);
		expect(normalizeAngleSigned(TWO_PI)).toBe(0);
		expect(normalizeAngleSigned(-PI)).toBeCloseTo(PI); // -PI normalizes to PI in signed range
		expect(normalizeAngleSigned(3 * PI)).toBeCloseTo(PI); // 3*PI normalizes to PI in signed range
	});

	it('mapPositionToAngle returns correct angles', () => {
		expect(mapPositionToAngle('e')).toBe(0);
		expect(mapPositionToAngle('s')).toBeCloseTo(HALF_PI);
		expect(mapPositionToAngle('w')).toBeCloseTo(PI);
		expect(mapPositionToAngle('n')).toBeCloseTo(-HALF_PI);
		expect(mapPositionToAngle('X')).toBe(0);
		expect(mapPositionToAngle(undefined)).toBe(0);
	});

	it('mapOrientationToAngle returns correct angles', () => {
		expect(mapOrientationToAngle('in')).toBeCloseTo(PI);
		expect(mapOrientationToAngle('out')).toBeCloseTo(0);
		expect(mapOrientationToAngle('n')).toBeCloseTo(-HALF_PI);
		expect(mapOrientationToAngle('e')).toBeCloseTo(0);
		expect(mapOrientationToAngle('s')).toBeCloseTo(HALF_PI);
		expect(mapOrientationToAngle('w')).toBeCloseTo(PI);
	});

	it('lerp interpolates linearly', () => {
		expect(lerp(0, 10, 0)).toBe(0);
		expect(lerp(0, 10, 1)).toBe(10);
		expect(lerp(0, 10, 0.5)).toBe(5);
	});

	it('lerpAngle interpolates angles correctly', () => {
		expect(lerpAngle(0, PI, 0.5)).toBeCloseTo(PI / 2);
		expect(lerpAngle(PI, 0, 0.5)).toBeCloseTo((3 * PI) / 2); // Takes the shorter path around the circle
		expect(lerpAngle(0, TWO_PI, 0.5)).toBeCloseTo(0); // 0 and 2*PI are the same angle
	});

	it('calculateProIsolationStaffAngle returns correct angle', () => {
		// Test interpolation from 'in' (PI) to 'out' (0) at t=0.5
		// The function interpolates and normalizes, so we expect 3*PI/2 for clockwise from PI to 0
		expect(calculateProIsolationStaffAngle('in', 'out', 'cw', 0, 0.5)).toBeCloseTo(3 * HALF_PI);
		expect(calculateProIsolationStaffAngle('out', 'in', 'ccw', 0, 0.5)).toBeCloseTo(3 * HALF_PI);
	});

	it('calculateAntispinTargetAngle returns correct angle', () => {
		// Test antispin calculation with center path angle 0
		// The function returns 3*PI/2 for this interpolation case
		expect(calculateAntispinTargetAngle(0, 'in', 'out', 'cw', 0, 0.5)).toBeCloseTo(3 * HALF_PI);
		expect(calculateAntispinTargetAngle(0, 'in', 'out', 'cw', 1, 0.5)).toBeCloseTo(3 * HALF_PI);
	});

	it('calculateStaticStaffAngle returns correct angle', () => {
		expect(calculateStaticStaffAngle(0, 'in')).toBeCloseTo(PI);
		expect(calculateStaticStaffAngle(0, 'out')).toBeCloseTo(0);
	});

	it('calculateDashTargetAngle returns correct angle', () => {
		expect(calculateDashTargetAngle(0, 'in', 'out', 0.5)).toBeCloseTo(HALF_PI);
	});
});
