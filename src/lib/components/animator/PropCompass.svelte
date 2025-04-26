<script lang="ts">
	// Props
	export let location: string = 'n'; // 'n', 'e', 's', 'w'
	export let orientation: string = 'in'; // 'in', 'out'
	export let color: string = '#333333';
	export let label: string = '';

	// Calculate the rotation angle based on the location
	$: rotationAngle = getRotationAngle(location);

	// Calculate the arrow direction based on orientation
	$: arrowDirection = orientation?.toLowerCase() === 'in' ? 'inward' : 'outward';

	// Helper function to get rotation angle from location
	function getRotationAngle(loc: string): number {
		switch (loc?.toLowerCase()) {
			case 'n':
				return 0;
			case 'e':
				return 90;
			case 's':
				return 180;
			case 'w':
				return 270;
			default:
				return 0;
		}
	}

	// Get a readable label for the location
	$: locationLabel = getLocationLabel(location);

	function getLocationLabel(loc: string): string {
		switch (loc?.toLowerCase()) {
			case 'n':
				return 'North';
			case 'e':
				return 'East';
			case 's':
				return 'South';
			case 'w':
				return 'West';
			default:
				return 'Unknown';
		}
	}
</script>

<div class="compass-container">
	{#if label}
		<div class="compass-label">{label}</div>
	{/if}
	<div class="compass">
		<!-- Cardinal directions -->
		<div class="cardinal n">N</div>
		<div class="cardinal e">E</div>
		<div class="cardinal s">S</div>
		<div class="cardinal w">W</div>

		<!-- Center point -->
		<div class="center"></div>

		<!-- Position marker -->
		<div class="position-marker" style="transform: rotate({rotationAngle}deg) translateY(-18px);">
			<div class="marker" style="background-color: {color};"></div>
		</div>

		<!-- Orientation arrow -->
		<div
			class="orientation-arrow {arrowDirection}"
			style="transform: rotate({rotationAngle}deg) translateY(-18px);"
		>
			<div class="arrow" style="border-color: {color};"></div>
		</div>
	</div>

	<div class="info-text">
		<div class="location">{locationLabel}</div>
		<div class="orientation">{orientation?.toLowerCase() === 'in' ? 'Inward' : 'Outward'}</div>
	</div>
</div>

<style>
	.compass-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 5px 0;
	}

	.compass-label {
		font-size: 12px;
		font-weight: bold;
		margin-bottom: 2px;
		color: #555;
	}

	.compass {
		position: relative;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: 1px solid #ccc;
		background-color: #f9f9f9;
	}

	.cardinal {
		position: absolute;
		font-size: 10px;
		font-weight: bold;
		color: #777;
	}

	.n {
		top: 2px;
		left: 50%;
		transform: translateX(-50%);
	}

	.e {
		right: 2px;
		top: 50%;
		transform: translateY(-50%);
	}

	.s {
		bottom: 2px;
		left: 50%;
		transform: translateX(-50%);
	}

	.w {
		left: 2px;
		top: 50%;
		transform: translateY(-50%);
	}

	.center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background-color: #aaa;
	}

	.position-marker {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2px;
		height: 25px;
		transform-origin: bottom center;
	}

	.marker {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	.orientation-arrow {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2px;
		height: 25px;
		transform-origin: bottom center;
	}

	.arrow {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-style: solid;
	}

	.orientation-arrow.inward .arrow {
		border-width: 0 5px 8px 5px;
		border-color: transparent transparent currentColor transparent;
		top: 10px;
	}

	.orientation-arrow.outward .arrow {
		border-width: 8px 5px 0 5px;
		border-color: currentColor transparent transparent transparent;
		top: 0;
	}

	.info-text {
		margin-top: 5px;
		text-align: center;
		font-size: 10px;
	}

	.location {
		font-weight: bold;
		color: #555;
	}

	.orientation {
		color: #777;
		font-style: italic;
	}
</style>
