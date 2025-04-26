import { TWO_PI, normalizeAngleSigned, normalizeAnglePositive } from './gridMapping';

/** Linear interpolation between two numbers. */
export function lerp(a: number, b: number, t: number): number {
	return a * (1 - t) + b * t;
}

/** Linear interpolation between two angles (radians), handling wrapping via the shortest path. */
export function lerpAngle(a: number, b: number, t: number): number {
    const delta = angleDifferenceSigned(b, a); // Shortest difference
    const interpolated = a + delta * t;
    return normalizeAnglePositive(interpolated); // Normalize to [0, 2*PI)
}

/** Calculates the shortest angle difference between two angles (result between -PI and PI). */
export function angleDifferenceSigned(a: number, b: number): number {
    return normalizeAngleSigned(a - b);
}
