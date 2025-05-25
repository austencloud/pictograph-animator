<script lang="ts">
	import AnimatorApp from '$lib/animator/AnimatorApp.svelte';
	import { browser } from '$app/environment';

	// State using Svelte 5 runes
	let isClient = $state(false);

	// Metadata for SEO and accessibility
	const title = 'Pictograph Animator - Interactive Prop Visualization';
	const description =
		'Visualize and animate flow art patterns with this interactive tool for props like poi, staff, and hoops.';

	// Handle client-side hydration properly to avoid SSR issues with canvas
	$effect(() => {
		if (browser) {
			isClient = true;
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<main>
	<section class="hero">
		<div class="container">
			<h1>Pictograph Animator</h1>
			<p>Visualize flow art patterns and movements with this interactive animation tool</p>
		</div>
	</section>

	<section class="content">
		{#if isClient}
			<div class="animator-container">
				<AnimatorApp />
			</div>
		{:else}
			<div class="container">
				<div class="loading">
					<p>Loading animator...</p>
				</div>
				<div class="info-box">
					<h2>How to use</h2>
					<ol>
						<li>Upload or paste a pictograph sequence</li>
						<li>Use the controls to play, pause, and adjust animation speed</li>
						<li>Watch the visualization of your flow patterns</li>
					</ol>
					<p class="note">For best results, use sequences with proper start and end positions.</p>
				</div>
			</div>
		{/if}
	</section>
</main>

<style>
	/* Page layout */
	main {
		width: 100%;
		max-width: 100%;
		margin: 0 auto;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.container {
		width: 100%;
		max-width: 960px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.animator-container {
		width: 100%;
		max-width: none;
		margin: 0;
		padding: 0;
	}

	/* Hero section */
	.hero {
		background: linear-gradient(to right, #2196f3, #4dabf7);
		color: white;
		padding: 2rem 0;
		text-align: center;
	}

	.hero h1 {
		font-size: 2.5rem;
		margin: 0;
		font-weight: 700;
	}

	.hero p {
		font-size: 1.2rem;
		margin: 0.5rem 0 0;
		opacity: 0.9;
	}

	/* Content section */
	.content {
		padding: 0;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.animator-container {
		flex: 1;
		min-height: 0;
	}

	.info-box {
		margin-top: 3rem;
		padding: 1.5rem;
		background-color: #f5f5f5;
		border-radius: 6px;
		border-left: 4px solid #2196f3;
	}

	.info-box h2 {
		margin-top: 0;
		font-size: 1.5rem;
		color: #2196f3;
	}

	.note {
		font-style: italic;
		font-size: 0.9rem;
		color: #666;
	}

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
		background-color: #f9f9f9;
		border-radius: 6px;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2rem;
		}

		.hero p {
			font-size: 1rem;
		}
	}
</style>
