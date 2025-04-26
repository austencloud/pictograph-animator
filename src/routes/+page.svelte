<script lang="ts">
	import SequenceAnimator from '../lib/components/SequenceAnimator.svelte';
	import type { SequenceData } from '../lib/types/sequence.js';

	// Sample sequence data for "AABB" pattern
	const aabbSequence: SequenceData = [
		{
			// Metadata
			word: 'AABB',
			author: 'Example Author',
			level: 1,
			prop_type: 'staff',
			grid_mode: 'diamond',
			is_circular: true
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

	// Canvas size and animation speed
	let canvasSize = 500;
	let animationSpeed = 1.0;
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-3xl font-bold">Sequence Animator</h1>

	<p class="mb-6">
		A powerful tool for animating choreographed movements of Blue and Red staffs on a canvas.
	</p>

	<div class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
		<div class="rounded-lg border bg-gray-50 p-6">
			<h2 class="mb-4 text-xl font-semibold">Demo</h2>
			<div class="flex w-full items-center justify-center rounded border bg-white">
				<SequenceAnimator
					sequenceData={aabbSequence}
					width={canvasSize}
					height={canvasSize}
					speed={animationSpeed}
				/>
			</div>
		</div>

		<div class="rounded-lg border bg-gray-50 p-6">
			<h2 class="mb-4 text-xl font-semibold">Features</h2>
			<ul class="list-inside list-disc space-y-2">
				<li>Canvas-based animation of two staff props</li>
				<li>Support for different motion types: pro, anti, static, dash</li>
				<li>Customizable rotation directions: cw, ccw, no_rot</li>
				<li>Smooth interpolation between positions</li>
				<li>Adjustable playback speed</li>
				<li>TypeScript support</li>
			</ul>
		</div>
	</div>

	<h2 class="mb-4 text-2xl font-bold">Examples</h2>

	<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
		<a href="/animator" class="rounded-lg border p-4 transition-colors hover:bg-gray-50">
			<h3 class="mb-2 text-lg font-semibold">Sequence Animator</h3>
			<p class="text-gray-600">View more complex animation patterns</p>
		</a>

		<a
			href="https://github.com/your-username/pictograph-animator"
			target="_blank"
			class="rounded-lg border p-4 transition-colors hover:bg-gray-50"
		>
			<h3 class="mb-2 text-lg font-semibold">Source Code</h3>
			<p class="text-gray-600">View the project on GitHub</p>
		</a>
	</div>

	<h2 class="mb-4 text-2xl font-bold">Getting Started</h2>

	<div class="mb-8 rounded-lg border bg-gray-50 p-6">
		<h3 class="mb-2 text-lg font-semibold">Basic Usage</h3>
		<pre class="overflow-x-auto rounded bg-gray-800 p-4 text-white">
{`import SequenceAnimator from './SequenceAnimator.svelte';
import type { SequenceData } from './types/sequence';

// Define your sequence data
const mySequence: SequenceData = [
  {
    // Metadata
    "word": "My Sequence",
    "author": "Your Name",
    "prop_type": "staff",
    "grid_mode": "diamond"
  },
  {
    // Step 1
    "beat": 1,
    "start_pos": "n",
    "end_pos": "e",
    "blue_attributes": {
      "motion_type": "pro",
      "prop_rot_dir": "no_rot",
      "start_loc": "n",
      "end_loc": "e"
    },
    "red_attributes": {
      "motion_type": "pro",
      "prop_rot_dir": "no_rot",
      "start_loc": "n",
      "end_loc": "e"
    }
  }
  // More steps...
];

// Use in your component
<SequenceAnimator
  sequenceData={mySequence}
  width={600}
  height={600}
  speed={1.0}
/>`}</pre>
	</div>

	<p class="text-center text-gray-600">
		Visit <a href="/animator" class="text-blue-600 hover:underline">the full animator page</a> to see
		more examples
	</p>
</div>
