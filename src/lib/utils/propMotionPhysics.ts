import { PI, TWO_PI, normalizeAnglePositive, normalizeAngleSigned } from './gridMapping.js';

/**
 * Calculates the target staff rotation angle for a pro isolation motion.
 * In pro isolation, the staff always points toward the center during movement.
 *
 * @param centerPathAngle - The angle of the prop's center on the circular path
 * @param propRotDir - The rotation direction ('cw' or 'ccw')
 * @returns The staff rotation angle in radians
 */
export function calculateProIsolationStaffAngle(
	centerPathAngle: number,
	propRotDir: string
): number {
	// Pro isolation: Staff always points toward the center
	// The rotation is perpendicular to the path angle
	return normalizeAnglePositive(centerPathAngle + PI);
}

/**
 * Calculates the target staff rotation angle for antispin motion.
 * In antispin with 0 turns, when a prop moves along a 90° arc, its orientation changes by 180°
 * Additional turns (1 turn = 180°) add more rotation during the motion.
 *
 * @param startCenterAngle - The starting angle of the center path
 * @param endCenterAngle - The ending angle of the center path
 * @param startStaffAngle - The starting staff rotation angle
 * @param turns - Number of additional 180° rotations
 * @param propRotDir - The rotation direction ('cw' or 'ccw')
 * @returns The target staff rotation angle in radians
 */
export function calculateAntispinTargetAngle(
	startCenterAngle: number,
	endCenterAngle: number,
	startStaffAngle: number,
	turns: number,
	propRotDir: string
): number {
	// Calculate the change in center path angle
	let centerAngleDelta = normalizeAngleSigned(endCenterAngle - startCenterAngle);

	// Ensure we use the shortest path
	if (Math.abs(centerAngleDelta) > PI) {
		centerAngleDelta = normalizeAngleSigned(centerAngleDelta);
	}

	// For antispin with 0 turns:
	// - 90° path movement = 180° staff rotation
	// - So, the ratio is 2:1
	const baseStaffRotation = -centerAngleDelta * 2;

	// Apply additional turns (1 turn = 180° = PI radians)
	// Direction affects whether we add or subtract
	const turnAngle = PI * turns;
	const directionMultiplier = propRotDir.toLowerCase() === 'ccw' ? -1 : 1;
	const additionalRotation = turnAngle * directionMultiplier;

	// Calculate the final target angle by adding the base rotation and any additional turns
	const targetStaffAngle = normalizeAnglePositive(
		startStaffAngle + baseStaffRotation + additionalRotation
	);

	return targetStaffAngle;
}

/**
 * Calculates the staff orientation for static holds.
 * In static hold, the staff position doesn't change but may maintain a specific orientation.
 *
 * @param centerPathAngle - The angle of the prop's center on the circular path
 * @param orientation - The desired orientation ('in', 'out', or any cardinal direction)
 * @returns The staff rotation angle in radians
 */
export function calculateStaticStaffAngle(centerPathAngle: number, orientation: string): number {
	// Handle 'in' and 'out' orientations
	if (orientation) {
		const lowerOri = orientation.toLowerCase();
		if (lowerOri === 'in') {
			// 'in' means pointing toward center
			return normalizeAnglePositive(centerPathAngle + PI);
		} else if (lowerOri === 'out') {
			// 'out' means pointing away from center
			return centerPathAngle;
		}
		// Other orientations would be handled by specific angles from gridMapping
	}

	// Default: point toward center if no orientation specified
	return normalizeAnglePositive(centerPathAngle + PI);
}

/**
 * Calculates the target staff orientation angle for dash motion.
 * Dash is similar to antispin but with different physics.
 *
 * @param startCenterAngle - The starting angle of the center path
 * @param endCenterAngle - The ending angle of the center path
 * @param startStaffAngle - The starting staff rotation angle
 * @param propRotDir - The rotation direction ('cw' or 'ccw')
 * @returns The target staff rotation angle in radians
 */
export function calculateDashTargetAngle(
	startCenterAngle: number,
	endCenterAngle: number,
	startStaffAngle: number,
	propRotDir: string
): number {
	// Dash has its own rotation behavior - minimal rotation to maintain orientation
	// This is a simplified implementation that maintains general direction
	const directionMultiplier = propRotDir.toLowerCase() === 'ccw' ? -0.5 : 0.5;
	const centerAngleDelta = normalizeAngleSigned(endCenterAngle - startCenterAngle);
	const targetStaffAngle = normalizeAnglePositive(
		startStaffAngle + centerAngleDelta * directionMultiplier
	);

	return targetStaffAngle;
}
