/**
 * PropStateImpl class - Implements animation logic for a single prop
 * Handles precise mathematically-correct transitions between prop states
 * with support for pro isolations and antispins
 */
import type { PropState } from '../../types/sequence';

/**
 * Maps location strings to angles in radians
 */
export const LOCATION_TO_ANGLE_MAP: Record<string, number> = {
	// Cardinal directions
	n: -Math.PI / 2, // North = -90°
	ne: -Math.PI / 4, // Northeast = -45°
	e: 0, // East = 0°
	se: Math.PI / 4, // Southeast = 45°
	s: Math.PI / 2, // South = 90°
	sw: (3 * Math.PI) / 4, // Southwest = 135°
	w: Math.PI, // West = 180°
	nw: (-3 * Math.PI) / 4 // Northwest = -135°
};

export class PropStateImpl implements PropState {
	// Core properties
	id: string;
	color: string;
	centerPathAngle: number;
	staffRotationAngle: number;
	x: number;
	y: number;

	// Current step attributes
	current_start_loc: string;
	current_end_loc: string;
	current_start_ori: 'in' | 'out' | 'cw' | 'ccw';
	current_end_ori: 'in' | 'out' | 'cw' | 'ccw';
	current_motion_type: 'pro' | 'anti' | 'static' | 'dash';
	current_prop_rot_dir: 'cw' | 'ccw' | 'no_rot';
	current_turns: number;

	// Internal animation state
	_stepStartCenterPathAngle: number; // Made public to match interface
	_stepTargetCenterPathAngle: number;
	_stepStartStaffRotationAngle: number; // Made public to match interface
	_stepTargetStaffRotationAngle: number; // Made public to match interface
	_previousEndCenterPathAngle: number | null;
	_previousEndStaffRotationAngle: number | null;
	_lastT = 0;

	// Constants
	private static readonly HALFWAY_RADIUS = 151.5; // Distance from center in logical coordinates

	/**
	 * Create a new PropStateImpl instance
	 * @param id Identifier for this prop ('blue' or 'red')
	 * @param color CSS color value
	 * @param initialLocation Starting location name (e.g., 'n', 's')
	 * @param initialOrientation Starting orientation ('in', 'out', 'cw', 'ccw')
	 */
	constructor(
		id: string,
		color: string,
		initialLocation: string,
		initialOrientation: 'in' | 'out' | 'cw' | 'ccw' = 'in'
	) {
		this.id = id;
		this.color = color;
		this.centerPathAngle = 0;
		this.staffRotationAngle = 0;
		this.x = 0;
		this.y = 0;

		// Initialize with defaults
		this.current_start_loc = initialLocation;
		this.current_end_loc = initialLocation;
		this.current_start_ori = initialOrientation;
		this.current_end_ori = initialOrientation;
		this.current_motion_type = 'static';
		this.current_prop_rot_dir = 'no_rot';
		this.current_turns = 0;

		// Set internal state
		this._stepStartCenterPathAngle = 0;
		this._stepTargetCenterPathAngle = 0;
		this._stepStartStaffRotationAngle = 0;
		this._stepTargetStaffRotationAngle = 0;
		this._previousEndCenterPathAngle = null;
		this._previousEndStaffRotationAngle = null;

		// Set initial location and orientation
		this.setLocationByName(initialLocation);
		this.setOrientationByName(initialOrientation);
	}
	_initialized?: boolean | undefined;
	_currentStepIndex?: number | undefined;

	/**
	 * Converts a location name to an angle and updates the center path angle
	 * @param locationName Name of the location (e.g., 'n', 's')
	 */
	setLocationByName(locationName: string): void {
		const lcLocation = locationName.toLowerCase();

		if (LOCATION_TO_ANGLE_MAP[lcLocation] !== undefined) {
			this.centerPathAngle = LOCATION_TO_ANGLE_MAP[lcLocation];
			this.current_start_loc = lcLocation;

			// Update position based on new angle
			this.updatePosition();
		} else {
			console.error(`Unknown location: ${locationName}`);
		}
	}

	/**
	 * Sets the staff orientation angle based on orientation name
	 * @param orientationName Orientation name ('in', 'out', 'cw', 'ccw')
	 */
	setOrientationByName(orientationName: 'in' | 'out' | 'cw' | 'ccw'): void {
		// Current center angle determines the reference point
		const baseAngle = this.centerPathAngle;

		switch (orientationName) {
			case 'in':
				this.staffRotationAngle = baseAngle + Math.PI; // Point toward center
				break;
			case 'out':
				this.staffRotationAngle = baseAngle; // Point away from center
				break;
			case 'cw':
				this.staffRotationAngle = baseAngle - Math.PI / 2; // 90° clockwise from center line
				break;
			case 'ccw':
				this.staffRotationAngle = baseAngle + Math.PI / 2; // 90° counter-clockwise from center line
				break;
			default:
				// TypeScript should prevent this from happening with the strict type
				this.staffRotationAngle = baseAngle + Math.PI; // Default to 'in'
				break;
		}

		this.current_start_ori = orientationName;
	}

	/**
	 * Updates x/y coordinates based on center path angle
	 */
	updatePosition(): void {
		this.x = Math.cos(this.centerPathAngle) * PropStateImpl.HALFWAY_RADIUS;
		this.y = Math.sin(this.centerPathAngle) * PropStateImpl.HALFWAY_RADIUS;
	}

	/**
	 * Prepares for a new motion step
	 * @param attrs Prop attributes for this step
	 */
	prepareMotion(attrs: {
		motion_type: 'pro' | 'anti' | 'static' | 'dash';
		prop_rot_dir: 'cw' | 'ccw' | 'no_rot';
		start_loc: string;
		end_loc: string;
		start_ori?: 'in' | 'out' | 'cw' | 'ccw';
		end_ori?: 'in' | 'out' | 'cw' | 'ccw';
		turns?: number;
	}): void {
		// Set internal state from props
		this.current_motion_type = attrs.motion_type;
		this.current_prop_rot_dir = attrs.prop_rot_dir;
		this.current_start_loc = attrs.start_loc.toLowerCase();
		this.current_end_loc = attrs.end_loc.toLowerCase();
		this.current_start_ori = attrs.start_ori || 'in';
		this.current_end_ori = attrs.end_ori || 'in';
		this.current_turns = attrs.turns || 0;

		// Store starting angles for the motion
		if (this._previousEndCenterPathAngle !== null && this._previousEndStaffRotationAngle !== null) {
			// Use previous end state if available (ensures continuity)
			this._stepStartCenterPathAngle = this._previousEndCenterPathAngle;
			this._stepStartStaffRotationAngle = this._previousEndStaffRotationAngle;
		} else {
			// Otherwise use current angles
			this._stepStartCenterPathAngle = this.centerPathAngle;
			this._stepStartStaffRotationAngle = this.staffRotationAngle;
		}

		// Calculate end center path angle based on end location
		if (LOCATION_TO_ANGLE_MAP[this.current_end_loc] !== undefined) {
			const rawEndCenterAngle = LOCATION_TO_ANGLE_MAP[this.current_end_loc];

			// Calculate path direction and angle difference
			let centerAngleDiff = rawEndCenterAngle - this._stepStartCenterPathAngle;

			// Normalize to -π to π range for shortest path calculation
			while (centerAngleDiff > Math.PI) centerAngleDiff -= 2 * Math.PI;
			while (centerAngleDiff < -Math.PI) centerAngleDiff += 2 * Math.PI;

			// Apply rotation direction (cw/ccw) to determine path
			const isClockwise = this.current_prop_rot_dir === 'cw';
			if (isClockwise && centerAngleDiff < 0) {
				centerAngleDiff += 2 * Math.PI; // Go CW (positive direction)
			} else if (!isClockwise && centerAngleDiff > 0) {
				centerAngleDiff -= 2 * Math.PI; // Go CCW (negative direction)
			}

			// Calculate final center path end angle
			this._stepTargetCenterPathAngle = this._stepStartCenterPathAngle + centerAngleDiff;
		} else {
			console.error(`Unknown end location: ${this.current_end_loc}`);
			// Default to no movement
			this._stepTargetCenterPathAngle = this._stepStartCenterPathAngle;
		}

		// Calculate ending staff angle based on motion type
		this.calculateTargetStaffAngle();
	}

	/**
	 * Calculates the target staff rotation angle based on motion type
	 */
	private calculateTargetStaffAngle(): void {
		// Calculate the angle change for the center path
		const centerAngleDiff = this._stepTargetCenterPathAngle - this._stepStartCenterPathAngle;
		const isClockwise = this.current_prop_rot_dir === 'cw';

		switch (this.current_motion_type) {
			case 'pro':
				// Pro motion: Staff always points toward center
				// The staffAngle = centerPathAngle + π formula ensures the staff points to center
				this._stepTargetStaffRotationAngle = this._stepTargetCenterPathAngle + Math.PI;
				break;

			case 'anti':
				// Anti motion: Calculate based on end orientation and turns
				let endOrientationAngle: number;

				// Set the base orientation angle first
				switch (this.current_end_ori) {
					case 'in':
						endOrientationAngle = this._stepTargetCenterPathAngle + Math.PI;
						break;
					case 'out':
						endOrientationAngle = this._stepTargetCenterPathAngle;
						break;
					case 'cw':
						endOrientationAngle = this._stepTargetCenterPathAngle - Math.PI / 2;
						break;
					case 'ccw':
						endOrientationAngle = this._stepTargetCenterPathAngle + Math.PI / 2;
						break;
					default:
						// Default to 'in' orientation (should never happen with TypeScript)
						endOrientationAngle = this._stepTargetCenterPathAngle + Math.PI;
				}

				// Apply antispin mechanics - the key concept of antispin:
				// For a 90° arc with 0 turns, there's a 180° orientation change relative to center
				// We need to apply this natural antispin rotation:

				// For 0 turns: if start orientation is "in", end orientation will be "out" (and vice versa)
				// With turns: add/subtract 180° (π) per turn in the direction of rotation

				// For simplicity, we'll directly set the final angle based on end orientation
				// and the requested number of turns

				// Apply turns (1 turn = π radians = 180 degrees)
				// For CW path, adding turns means MORE CW rotation
				// For CCW path, adding turns means MORE CCW rotation
				const turnAdjustment = this.current_turns * Math.PI;

				if (isClockwise) {
					endOrientationAngle += turnAdjustment;
				} else {
					endOrientationAngle -= turnAdjustment;
				}

				this._stepTargetStaffRotationAngle = endOrientationAngle;
				break;

			case 'static':
				// Static motion: Staff angle doesn't change
				this._stepTargetStaffRotationAngle = this._stepStartStaffRotationAngle;
				break;

			case 'dash':
				// Dash is like static but with repositioning
				this._stepTargetStaffRotationAngle = this._stepStartStaffRotationAngle;
				break;

			default:
				console.error(`Unknown motion type: ${this.current_motion_type}`);
				// Default to static
				this._stepTargetStaffRotationAngle = this._stepStartStaffRotationAngle;
		}
	}

	/**
	 * Updates prop state based on progress (0-1)
	 * @param progress Animation progress from 0 (start) to 1 (complete)
	 * @returns True if motion is complete
	 */
	update(progress: number): boolean {
		const t = Math.min(1.0, Math.max(0, progress));
		this._lastT = t;

		// Linear interpolation for center path angle
		this.centerPathAngle =
			this._stepStartCenterPathAngle +
			(this._stepTargetCenterPathAngle - this._stepStartCenterPathAngle) * t;

		// Linear interpolation for staff rotation angle
		this.staffRotationAngle =
			this._stepStartStaffRotationAngle +
			(this._stepTargetStaffRotationAngle - this._stepStartStaffRotationAngle) * t;

		// Update position
		this.updatePosition();

		// Return true if motion is complete
		return t >= 1.0;
	}

	/**
	 * Finalizes the current motion step, ensuring exact end values are set
	 */
	finalizeMotion(): void {
		// Ensure we're exactly at target angles
		this.centerPathAngle = this._stepTargetCenterPathAngle;
		this.staffRotationAngle = this._stepTargetStaffRotationAngle;

		// Store these as previous end values for continuity
		this._previousEndCenterPathAngle = this._stepTargetCenterPathAngle;
		this._previousEndStaffRotationAngle = this._stepTargetStaffRotationAngle;

		// Update current attributes to end attributes for next step
		this.current_start_loc = this.current_end_loc;
		this.current_start_ori = this.current_end_ori;

		// Update position
		this.updatePosition();
	}

	/**
	 * Draws the prop on the canvas
	 * @param ctx Canvas rendering context
	 * @param staffImage Staff SVG image
	 * @param canvasCenterX X-coordinate of canvas center
	 * @param canvasCenterY Y-coordinate of canvas center
	 * @param scale Scale factor for converting logical coordinates to canvas pixels
	 * @param debug Optional flag to draw debug visuals
	 */
	draw(
		ctx: CanvasRenderingContext2D,
		staffImage: HTMLImageElement | null,
		canvasCenterX: number,
		canvasCenterY: number,
		scale: number,
		debug = false
	): void {
		if (!staffImage || !staffImage.complete) return;

		const STAFF_VIEWBOX_WIDTH = 252.8;
		const STAFF_VIEWBOX_HEIGHT = 77.8;
		const STAFF_CENTER_X = 126.4;
		const STAFF_CENTER_Y = 38.9;

		// Calculate canvas coordinates
		const drawX = canvasCenterX + this.x * scale;
		const drawY = canvasCenterY + this.y * scale;

		// Scale for staff SVG
		const staffScale = scale * 0.7; // 70% of the grid scale
		const scaledWidth = STAFF_VIEWBOX_WIDTH * staffScale;
		const scaledHeight = STAFF_VIEWBOX_HEIGHT * staffScale;

		// Center point offset
		const centerOffsetX = STAFF_CENTER_X * staffScale;
		const centerOffsetY = STAFF_CENTER_Y * staffScale;

		// Draw staff with rotation
		ctx.save();
		ctx.translate(drawX, drawY);
		ctx.rotate(this.staffRotationAngle);
		ctx.drawImage(
			staffImage,
			-centerOffsetX, // Offset to align center point
			-centerOffsetY,
			scaledWidth,
			scaledHeight
		);
		ctx.restore();

		// Debug visualization if requested
		if (debug) {
			// Draw center point
			ctx.fillStyle = this.id === 'blue' ? 'blue' : 'red';
			ctx.beginPath();
			ctx.arc(drawX, drawY, 3, 0, 2 * Math.PI);
			ctx.fill();

			// Draw line indicating orientation
			ctx.strokeStyle = this.id === 'blue' ? 'blue' : 'red';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(drawX, drawY);
			ctx.lineTo(
				drawX + Math.cos(this.staffRotationAngle) * 30,
				drawY + Math.sin(this.staffRotationAngle) * 30
			);
			ctx.stroke();
		}
	}
}
