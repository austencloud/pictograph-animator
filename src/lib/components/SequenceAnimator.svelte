<script lang="ts">
	import { SequenceAnimator as ModularSequenceAnimator } from './animator/index';
	import type { SequenceData } from '../types/sequence';

	// Props
	export let sequenceData: SequenceData;
	export let width: number = 600;
	export let height: number = 600;
	export let speed: number = 1.0;
</script>

<!-- Use the modular SequenceAnimator component -->
<ModularSequenceAnimator {sequenceData} {width} {height} {speed} />
