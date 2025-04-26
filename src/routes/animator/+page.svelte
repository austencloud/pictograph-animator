<script lang="ts">
	import SequenceAnimator from '../../lib/components/SequenceAnimator.svelte';
	import type { SequenceData } from '../../lib/types/sequence.js';

	// Sample sequence data for "AABB" pattern
	const aabbSequence: SequenceData = [
		{
			// Metadata
			word: 'AABB',
			author: 'Example Author',
			level: 1,
			prop_type: 'staff',
			grid_mode: 'diamond',
			is_circular: true,
			can_be_CAP: true,
			is_strict_rotated_CAP: false,
			is_strict_mirrored_CAP: false,
			is_strict_swapped_CAP: false,
			is_mirrored_swapped_CAP: false,
			is_rotated_swapped_CAP: false
		},
		{
			// Step 1: A
			beat: 1,
			letter: 'A',
			letter_type: 'Type1',
			duration: 1,
			start_pos: 'n',
			end_pos: 'e',
			timing: 'tog',
			direction: 'same',
			blue_attributes: {
				motion_type: 'pro',
				prop_rot_dir: 'no_rot',
				start_loc: 'n',
				end_loc: 'e'
			},
			red_attributes: {
				motion_type: 'pro',
				prop_rot_dir: 'no_rot',
				start_loc: 'n',
				end_loc: 'e'
			}
		},
		{
			// Step 2: A
			beat: 2,
			letter: 'A',
			letter_type: 'Type1',
			duration: 1,
			start_pos: 'e',
			end_pos: 's',
			timing: 'tog',
			direction: 'same',
			blue_attributes: {
				motion_type: 'pro',
				prop_rot_dir: 'no_rot',
				start_loc: 'e',
				end_loc: 's'
			},
			red_attributes: {
				motion_type: 'pro',
				prop_rot_dir: 'no_rot',
				start_loc: 'e',
				end_loc: 's'
			}
		},
		{
			// Step 3: B
			beat: 3,
			letter: 'B',
			letter_type: 'Type2',
			duration: 1,
			start_pos: 's',
			end_pos: 'w',
			timing: 'tog',
			direction: 'same',
			blue_attributes: {
				motion_type: 'anti',
				prop_rot_dir: 'cw',
				start_loc: 's',
				end_loc: 'w',
				turns: 1
			},
			red_attributes: {
				motion_type: 'anti',
				prop_rot_dir: 'ccw',
				start_loc: 's',
				end_loc: 'w',
				turns: 1
			}
		},
		{
			// Step 4: B
			beat: 4,
			letter: 'B',
			letter_type: 'Type2',
			duration: 1,
			start_pos: 'w',
			end_pos: 'n',
			timing: 'tog',
			direction: 'same',
			blue_attributes: {
				motion_type: 'anti',
				prop_rot_dir: 'cw',
				start_loc: 'w',
				end_loc: 'n',
				turns: 1
			},
			red_attributes: {
				motion_type: 'anti',
				prop_rot_dir: 'ccw',
				start_loc: 'w',
				end_loc: 'n',
				turns: 1
			}
		}
	];

	// More complex sequence with static and dash movements
	const complexSequence: SequenceData = [
		{
			// Metadata
			word: 'Complex Pattern',
			author: 'Example Author',
			level: 2,
			prop_type: 'staff',
			grid_mode: 'diamond',
			is_circular: true
		},
		{
			// Step 1: Start at north, move to east with pro motion
			beat: 1,
			duration: 1,
			start_pos: 'n',
			end_pos: 'e',
			blue_attributes: {
				motion_type: 'pro',
				prop_rot_dir: 'no_rot',
				start_loc: 'n',
				end_loc: 'e'
			},
			red_attributes: {
				motion_type: 'pro',
				prop_rot_dir: 'no_rot',
				start_loc: 'n',
				end_loc: 'e'
			}
		},
		{
			// Step 2: Static at east
			beat: 2,
			duration: 1,
			start_pos: 'e',
			end_pos: 'e',
			blue_attributes: {
				motion_type: 'static',
				prop_rot_dir: 'cw',
				start_loc: 'e',
				end_loc: 'e',
				turns: 1
			},
			red_attributes: {
				motion_type: 'static',
				prop_rot_dir: 'ccw',
				start_loc: 'e',
				end_loc: 'e',
				turns: 1
			}
		},
		{
			// Step 3: Dash from east to south
			beat: 3,
			duration: 1,
			start_pos: 'e',
			end_pos: 's',
			blue_attributes: {
				motion_type: 'dash',
				prop_rot_dir: 'no_rot',
				start_loc: 'e',
				end_loc: 's',
				start_ori: 'in',
				end_ori: 'out'
			},
			red_attributes: {
				motion_type: 'dash',
				prop_rot_dir: 'no_rot',
				start_loc: 'e',
				end_loc: 's',
				start_ori: 'out',
				end_ori: 'in'
			}
		},
		{
			// Step 4: Anti from south to west
			beat: 4,
			duration: 1,
			start_pos: 's',
			end_pos: 'w',
			blue_attributes: {
				motion_type: 'anti',
				prop_rot_dir: 'cw',
				start_loc: 's',
				end_loc: 'w',
				turns: 1.5
			},
			red_attributes: {
				motion_type: 'anti',
				prop_rot_dir: 'ccw',
				start_loc: 's',
				end_loc: 'w',
				turns: 1.5
			}
		},
		{
			// Step 5: Pro from west to north
			beat: 5,
			duration: 1,
			start_pos: 'w',
			end_pos: 'n',
			blue_attributes: {
				motion_type: 'pro',
				prop_rot_dir: 'no_rot',
				start_loc: 'w',
				end_loc: 'n'
			},
			red_attributes: {
				motion_type: 'pro',
				prop_rot_dir: 'no_rot',
				start_loc: 'w',
				end_loc: 'n'
			}
		}
	];

	// Currently selected sequence
	let selectedSequence: SequenceData = aabbSequence;

	// Function to switch between sequences
	function selectSequence(sequence: 'aabb' | 'complex') {
		selectedSequence = sequence === 'aabb' ? aabbSequence : complexSequence;
	}

	// Canvas size
	let canvasSize = 600;

	// Animation speed
	let animationSpeed = 1.0;
</script>

<div class="container">
	<h1>Sequence Animator</h1>

	<div class="sequence-selector">
		<button
			class:active={selectedSequence === aabbSequence}
			on:click={() => selectSequence('aabb')}
		>
			AABB Pattern
		</button>
		<button
			class:active={selectedSequence === complexSequence}
			on:click={() => selectSequence('complex')}
		>
			Complex Pattern
		</button>
	</div>

	<div class="animator-container">
		<SequenceAnimator
			sequenceData={selectedSequence}
			width={canvasSize}
			height={canvasSize}
			speed={animationSpeed}
		/>
	</div>

	<div class="settings">
		<div class="setting">
			<label for="canvas-size">Canvas Size: {canvasSize}px</label>
			<input id="canvas-size" type="range" min="300" max="900" step="50" bind:value={canvasSize} />
		</div>
	</div>

	<div class="sequence-info">
		<h2>Current Sequence: {selectedSequence[0].word}</h2>
		<p>Author: {selectedSequence[0].author || 'Unknown'}</p>
		<p>Level: {selectedSequence[0].level || 'N/A'}</p>
		<p>Steps: {selectedSequence.length - 1}</p>
	</div>

	<div class="sequence-data">
		<h3>Sequence Data</h3>
		<pre>{JSON.stringify(selectedSequence, null, 2)}</pre>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		text-align: center;
		margin-bottom: 2rem;
	}

	.sequence-selector {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.sequence-selector button {
		padding: 0.5rem 1rem;
		background-color: #f0f0f0;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
	}

	.sequence-selector button.active {
		background-color: #0072bc;
		color: white;
	}

	.animator-container {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.setting {
		display: flex;
		flex-direction: column;
	}

	.sequence-info {
		margin-bottom: 2rem;
	}

	.sequence-data {
		margin-top: 2rem;
		padding: 1rem;
		background-color: #f5f5f5;
		border-radius: 4px;
		overflow-x: auto;
	}

	pre {
		margin: 0;
		white-space: pre-wrap;
		font-size: 0.9rem;
	}
</style>
