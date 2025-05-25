/**
 * Core type definitions for the Pictograph Animator
 */

export type MotionType = 'pro' | 'anti' | 'static' | 'dash' | 'none';
export type PropRotDir = 'cw' | 'ccw' | 'no_rot' | undefined;
export type Orientation = 'in' | 'out' | 'n' | 'e' | 's' | 'w' | undefined;

export interface PropAttributes {
	start_loc: string;
	end_loc: string;
	start_ori?: Orientation;
	end_ori?: Orientation;
	prop_rot_dir?: PropRotDir;
	turns?: number;
	motion_type: MotionType;
}

export interface SequenceStep {
	beat: number;
	letter?: string;
	start_pos?: string;
	end_pos?: string;
	blue_attributes: PropAttributes;
	red_attributes: PropAttributes;
	[key: string]: unknown;
}

export interface SequenceMeta {
	word?: string;
	author?: string;
	level?: number;
	prop_type?: string;
	grid_mode?: string;
	[key: string]: unknown;
}

export type SequenceData = [SequenceMeta, ...SequenceStep[]];

export interface PropState {
	centerPathAngle: number;
	staffRotationAngle: number;
	x: number;
	y: number;
}
