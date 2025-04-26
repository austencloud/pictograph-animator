/**
 * Utility functions to adapt sequence data between different formats
 *
 * The component expects data in array format: [metadata, start_position, step1, step2, ...]
 * But sometimes receives data in object format: { metadata, steps: [...] }
 */
import type {
	SequenceData,
	SequenceMetadata,
	SequenceStep,
	PropAttributes
} from '../types/sequence';

/**
 * Interface representing the object-based sequence format
 */
interface ObjectFormatSequence {
	metadata?: Partial<SequenceMetadata>;
	steps?: Array<Partial<SequenceStep>>;
	[key: string]: unknown;
}

/**
 * Type guards for more precise type checking
 */
function isPropAttributes(obj: unknown): obj is Partial<PropAttributes> {
	return obj !== null && typeof obj === 'object';
}

/**
 * Safely extracts a string property from an unknown object
 */
function extractStringProp(obj: unknown, propName: string, fallback: string): string {
	if (obj && typeof obj === 'object' && propName in obj) {
		const value = (obj as Record<string, unknown>)[propName];
		return typeof value === 'string' ? value : fallback;
	}
	return fallback;
}

/**
 * Safely extracts a prop attributes object
 */
function extractPropAttributes(
	step: Partial<SequenceStep> | undefined,
	propKey: 'blue_prop' | 'red_prop' | 'blue_attributes' | 'red_attributes'
): Partial<PropAttributes> | undefined {
	if (!step || typeof step !== 'object') return undefined;

	const prop = step[propKey];
	return isPropAttributes(prop) ? prop : undefined;
}

/**
 * Creates a basic step that can be used as part of a sequence
 */
function createBasicStep(
	beat: number,
	letter: string,
	blueStartLoc: string,
	blueEndLoc: string,
	redStartLoc: string,
	redEndLoc: string
): SequenceStep {
	return {
		beat,
		letter,
		blue_attributes: {
			motion_type: 'static',
			prop_rot_dir: 'no_rot',
			start_loc: blueStartLoc,
			end_loc: blueEndLoc
		},
		red_attributes: {
			motion_type: 'static',
			prop_rot_dir: 'no_rot',
			start_loc: redStartLoc,
			end_loc: redEndLoc
		}
	};
}

/**
 * Converts sequence data into the expected array format required by the animator
 * Handles both object format and array format inputs to ensure compatibility
 */
export function normalizeSequenceFormat(input: unknown): SequenceData | null {
	// Return null for empty inputs
	if (!input) return null;

	// Special handling for arrays with a single metadata object - fix for the [{...}] format
	if (
		Array.isArray(input) &&
		input.length === 1 &&
		typeof input[0] === 'object' &&
		input[0] !== null
	) {
		console.log('Found array with single metadata object, cannot expand without sequence data');
		// Insufficient data to create a complete sequence - return null
		return null;
	}

	// If already an array with metadata + start position + actual steps, return as is
	if (Array.isArray(input) && input.length >= 3) {
		// Basic validation
		const potentialMetadata = input[0];
		if (typeof potentialMetadata === 'object' && potentialMetadata !== null) {
			return input as SequenceData;
		}
	}

	// If array with just metadata and start position but no steps
	if (Array.isArray(input) && input.length === 2) {
		console.log('Found sequence with metadata and start position but no steps');
		// Cannot add default steps anymore - return null
		return null;
	}

	// Handle object format - common in newer APIs
	if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
		const objInput = input as ObjectFormatSequence;

		// Extract metadata (spread after setting empty defaults to avoid overwrite warning)
		const metadata: SequenceMetadata = {
			...{ word: '' },
			...(objInput.metadata || {})
		};

		// If there's no metadata or steps, this isn't valid sequence data
		if (!objInput.steps || !Array.isArray(objInput.steps) || objInput.steps.length === 0) {
			return null;
		}

		// Get the first step to reference for the starting position
		const firstStep = objInput.steps[0];

		// Extract location data for blue prop
		const blueProp = extractPropAttributes(firstStep, 'blue_prop');
		const blueAttrs = extractPropAttributes(firstStep, 'blue_attributes');
		const blueStartLoc = extractStringProp(
			blueProp,
			'start_loc',
			extractStringProp(blueAttrs, 'start_loc', 'N')
		);
		const blueEndLoc = extractStringProp(blueProp, 'end_loc', blueStartLoc);

		// Extract location data for red prop
		const redProp = extractPropAttributes(firstStep, 'red_prop');
		const redAttrs = extractPropAttributes(firstStep, 'red_attributes');
		const redStartLoc = extractStringProp(
			redProp,
			'start_loc',
			extractStringProp(redAttrs, 'start_loc', 'S')
		);
		const redEndLoc = extractStringProp(redProp, 'end_loc', redStartLoc);

		// Create a synthetic start position
		const startPos: SequenceStep = {
			beat: 0,
			letter: 'START',
			start_pos: 'start',
			end_pos: 'start',
			blue_attributes: {
				motion_type: 'static',
				prop_rot_dir: 'no_rot',
				start_loc: blueStartLoc,
				end_loc: blueEndLoc
			},
			red_attributes: {
				motion_type: 'static',
				prop_rot_dir: 'no_rot',
				start_loc: redStartLoc,
				end_loc: redEndLoc
			}
		};

		// Convert steps to expected format with proper type checking
		const steps: SequenceStep[] = objInput.steps
			.filter((step): step is Partial<SequenceStep> => typeof step === 'object' && step !== null)
			.map((step) => {
				// Ensure the step has the required properties
				const validStep: SequenceStep = {
					beat: typeof step.beat === 'number' ? step.beat : 0,
					blue_attributes: (step.blue_attributes as PropAttributes) || {
						motion_type: 'static',
						prop_rot_dir: 'no_rot',
						start_loc: blueStartLoc,
						end_loc: blueEndLoc
					},
					red_attributes: (step.red_attributes as PropAttributes) || {
						motion_type: 'static',
						prop_rot_dir: 'no_rot',
						start_loc: redStartLoc,
						end_loc: redEndLoc
					}
				};

				// Copy additional properties if they exist
				if (step.letter) validStep.letter = step.letter;
				if (step.start_pos) validStep.start_pos = step.start_pos;
				if (step.end_pos) validStep.end_pos = step.end_pos;
				if (step.duration) validStep.duration = step.duration;
				if (step.timing) validStep.timing = step.timing;
				if (step.direction) validStep.direction = step.direction;
				if (step.letter_type) validStep.letter_type = step.letter_type;

				return validStep;
			});

		// Check if we have any steps beyond the start position
		if (steps.length === 0) {
			console.log('No animation steps provided, cannot create valid sequence');
			// No actual animation steps, we can't provide a valid sequence
			return null;
		}

		// Combine everything into the expected array format
		return [metadata, startPos, ...steps] as SequenceData;
	}

	// If we get here, the format is not recognized
	console.log('Unrecognized sequence data format:', input);
	return null;
}
