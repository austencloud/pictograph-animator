export const PI = Math.PI;
export const TWO_PI = Math.PI * 2;
export const HALF_PI = Math.PI / 2;

// Map cardinal locations to angles (radians) for the *halfway* path
// 0 = East, PI/2 = South, PI = West, -PI/2 (or 3PI/2) = North
export const locationAngles: Record<string, number> = {
	'e': 0,
	's': HALF_PI,
	'w': PI,
	'n': -HALF_PI,
};

// Grid constants (relative to a viewBox of 950x950)
export const GRID_VIEWBOX_SIZE = 950;
export const GRID_CENTER = GRID_VIEWBOX_SIZE / 2; // 475
export const GRID_HALFWAY_POINT_OFFSET = 151.5; // Equidistant offset from center

// Staff constants (relative to its viewBox)
export const STAFF_VIEWBOX_WIDTH = 252.8;
export const STAFF_VIEWBOX_HEIGHT = 77.8;
export const STAFF_CENTER_X = 126.4;
export const STAFF_CENTER_Y = 38.9;

/**
 * Gets the angle in radians for a given location string ('n', 'e', 's', 'w').
 * Returns 0 (East) if location is unknown.
 */
export function getAngleForLocation(loc: string): number {
	const lowerLoc = loc?.toLowerCase();
    if (!lowerLoc) return 0;
	return locationAngles[lowerLoc] ?? 0;
}

/** Normalizes an angle to be within the range [0, 2*PI). */
export function normalizeAnglePositive(angle: number): number {
    return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

/** Normalizes an angle to be within the range (-PI, PI]. */
export function normalizeAngleSigned(angle: number): number {
    let normalized = normalizeAnglePositive(angle);
    if (normalized > PI) { normalized -= TWO_PI; }
    return normalized;
}

/** Calculates the shortest angle difference between two angles (result between -PI and PI). */
export function angleDifferenceSigned(angle1: number, angle2: number): number {
    return normalizeAngleSigned(angle1 - angle2);
}

/** Maps abstract position identifiers ('alpha1', 'beta3', etc.) to specific angles. Placeholder. */
export function mapPositionToAngle(pos: string): number {
     // CRITICAL TODO: Implement full mapping for alpha/beta grid states.
     // For now, only handle cardinal directions for path interpolation.
     return getAngleForLocation(pos);
}

/** Maps orientation identifiers ('in', 'out', 'N', 'E', etc.) to specific angles (radians). Placeholder. */
export function mapOrientationToAngle(ori: string | undefined): number | null {
    if (!ori) return null;
    const lowerOri = ori.toLowerCase();
    if (lowerOri === 'in') return HALF_PI; // Pointing South relative to path
    if (lowerOri === 'out') return -HALF_PI; // Pointing North relative to path
    if (locationAngles.hasOwnProperty(lowerOri)) { return locationAngles[lowerOri]; }
    // CRITICAL TODO: Implement mapping for other orientations if needed.
    return null;
}
