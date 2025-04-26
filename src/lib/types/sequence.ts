/** Defines movement attributes for a single prop within one step */
export interface PropAttributes {
	motion_type: 'pro' | 'anti' | 'static' | 'dash';
	prop_rot_dir: 'cw' | 'ccw' | 'no_rot';
	start_loc: string; // e.g., 'n', 's', 'alpha1', 'beta3' - Needs mapping
	end_loc: string;   // e.g., 'n', 's', 'alpha5', 'beta7' - Needs mapping
    start_ori?: 'in' | 'out' | string; // Optional: For specific start orientations
	end_ori?: 'in' | 'out' | string;   // Optional: For specific end orientations
	turns?: number; // Optional: Number of full rotations during the step (for 'anti' primarily)
}

/** Defines a single step or beat in the animation sequence */
export interface SequenceStep {
	beat: number;
	letter?: string; // Identifier like 'A', 'B', 'C'
	letter_type?: string; // e.g., 'Type1'
	duration?: number; // Duration in beats (default: 1)
	start_pos?: string; // Grid state identifier at the start
	end_pos: string;   // Grid state identifier at the end
	timing?: 'split' | 'tog' | 'none' | string; // Timing relative to the other prop
	direction?: 'same' | 'opp' | 'none' | string; // Direction relative to the other prop
	blue_attributes: PropAttributes; // Attributes for Blue Prop (Left)
	red_attributes: PropAttributes; // Attributes for Red Prop (Right)
}

/** Defines the metadata for the entire sequence */
export interface SequenceMetadata {
	word: string; // Name of the sequence
	author?: string;
	level?: number;
	prop_type?: 'staff' | string; // Currently 'staff'
	grid_mode?: 'diamond' | string; // Currently 'diamond'
	is_circular?: boolean;
    // Include all other boolean flags from the example JSON
    can_be_CAP?: boolean;
    is_strict_rotated_CAP?: boolean;
    is_strict_mirrored_CAP?: boolean;
    is_strict_swapped_CAP?: boolean;
    is_mirrored_swapped_CAP?: boolean;
    is_rotated_swapped_CAP?: boolean;
	[key: string]: any; // Allow other metadata
}

/** The complete sequence data structure: Metadata object followed by Step objects */
export type SequenceData = [SequenceMetadata, ...SequenceStep[]];

/** Represents the state of a single prop during animation */
export interface PropState {
    centerPathAngle: number; // Current angle of the prop's center on its path (radians)
    staffRotationAngle: number; // Current rotation angle of the staff itself (radians)
    x: number; // Current calculated canvas X position
    y: number; // Current calculated canvas Y position
    // Internal state used for interpolation within calculateState
    _stepStartStaffRotationAngle?: number; // Staff angle at the beginning of the current step
    _stepTargetStaffRotationAngle?: number; // Calculated target staff angle for the end of the current step
    _stepStartCenterPathAngle?: number; // Center path angle at the beginning of the current step
    _stepTargetCenterPathAngle?: number; // Calculated target center path angle for the end of the current step
}
