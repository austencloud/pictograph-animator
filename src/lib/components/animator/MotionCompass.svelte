<script context="module">
	// Helper function to generate SVG path data for the curved line
	function getPathData(startAngle: number, endAngle: number): string {
		// Convert angles to radians
		const startRad = (startAngle * Math.PI) / 180;
		const endRad = (endAngle * Math.PI) / 180;

		// Calculate start and end points (on a circle with radius 40)
		const startX = 50 + Math.sin(startRad) * 40;
		const startY = 50 - Math.cos(startRad) * 40;
		const endX = 50 + Math.sin(endRad) * 40;
		const endY = 50 - Math.cos(endRad) * 40;

		// Calculate control points for a curved path
		// We'll use a simple quadratic curve with the control point at the center
		// For more complex paths, you could calculate better control points
		const controlX = 50;
		const controlY = 50;

		// Return the path data
		return `M ${startX} ${startY} Q ${controlX} ${controlY}, ${endX} ${endY}`;
	}
</script>

<script lang="ts">
	// Props
	export let startLocation: string = 'n'; // 'n', 'e', 's', 'w'
	export let endLocation: string = 's'; // 'n', 'e', 's', 'w'
	export let endOrientation: string = 'in'; // 'in', 'out'
	export let color: string = '#333333';
	export let propName: string = '';

	// Calculate the rotation angles based on the locations
	$: startAngle = getRotationAngle(startLocation);
	$: endAngle = getRotationAngle(endLocation);

	// Calculate the arrow direction based on orientation
	$: arrowDirection = endOrientation?.toLowerCase() === 'in' ? 'inward' : 'outward';

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

	// Get motion type based on start and end locations
	$: motionType = getMotionType(startLocation, endLocation, endOrientation);

	function getMotionType(startLoc: string, endLoc: string, endOri: string): string {
		// This is a simplified version - in a real app, you'd have more complex logic
		if (startLoc === endLoc) {
			return 'Static';
		}

		// Check if it's clockwise or counter-clockwise
		const startAngle = getRotationAngle(startLoc);
		const endAngle = getRotationAngle(endLoc);

		// Normalize angles for comparison
		const normalizedEndAngle = endAngle > startAngle ? endAngle : endAngle + 360;
		const diff = normalizedEndAngle - startAngle;

		if (diff <= 180) {
			return 'Clockwise';
		} else {
			return 'Counter-Clockwise';
		}
	}
</script>

<div class="compass-container">
	<div class="compass-title">{propName} Motion</div>
	<div class="compass">
		<!-- Cardinal directions -->
		<div class="cardinal n">N</div>
		<div class="cardinal e">E</div>
		<div class="cardinal s">S</div>
		<div class="cardinal w">W</div>

		<!-- Center point -->
		<div class="center"></div>

		<!-- Start position marker (dot) -->
		<div class="start-marker" style="transform: rotate({startAngle}deg) translateY(-20px);">
			<div class="dot" style="background-color: {color};"></div>
		</div>

		<!-- End position marker (arrow) -->
		<div
			class="end-marker {arrowDirection}"
			style="transform: rotate({endAngle}deg) translateY(-20px);"
		>
			<div class="arrow" style="border-color: {color};"></div>
		</div>

		<!-- Motion path (curved line connecting start and end) -->
		<svg class="motion-path" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
			<!-- We'll draw a curved path between start and end points -->
			<path
				d={getPathData(startAngle, endAngle)}
				fill="none"
				stroke={color}
				stroke-width="1.5"
				stroke-dasharray="2,2"
			/>
		</svg>
	</div>

	<div class="info-text">
		<div class="motion-type">{motionType}</div>
		<div class="locations">
			{getLocationLabel(startLocation)} → {getLocationLabel(endLocation)}
		</div>
		<div class="orientation">
			{endOrientation?.toLowerCase() === 'in' ? 'Inward' : 'Outward'} Facing
		</div>
	</div>
</div>

<style>
	.compass-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: var(--spacing-md) 0;
		width: 100%;
		transition: all var(--transition-fast);
	}

	.compass-container:hover {
		transform: scale(1.05);
	}

	.compass-title {
		font-size: var(--font-size-sm);
		font-weight: 600;
		margin-bottom: var(--spacing-xs);
		color: var(--text-color);
		position: relative;
		display: inline-block;
	}

	.compass-title::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 25%;
		width: 50%;
		height: 2px;
		background-color: var(--primary-color);
		border-radius: var(--border-radius-full);
	}

	.compass {
		position: relative;
		width: 90px;
		height: 90px;
		border-radius: 50%;
		border: 2px solid var(--border-color);
		background-color: var(--surface-color);
		margin-bottom: var(--spacing-sm);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-normal);
	}

	.compass:hover {
		box-shadow: var(--shadow-md);
		border-color: var(--border-color-hover);
	}

	.cardinal {
		position: absolute;
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--text-color-secondary);
		transition: color var(--transition-fast);
	}

	.compass:hover .cardinal {
		color: var(--text-color);
	}

	.n {
		top: 4px;
		left: 50%;
		transform: translateX(-50%);
	}

	.e {
		right: 4px;
		top: 50%;
		transform: translateY(-50%);
	}

	.s {
		bottom: 4px;
		left: 50%;
		transform: translateX(-50%);
	}

	.w {
		left: 4px;
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
		background-color: var(--text-color-tertiary);
		transition: background-color var(--transition-fast);
	}

	.compass:hover .center {
		background-color: var(--text-color-secondary);
	}

	.start-marker,
	.end-marker {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 2px;
		height: 45px;
		transform-origin: bottom center;
		transition: all var(--transition-fast);
	}

	.dot {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 10px;
		height: 10px;
		border-radius: 50%;
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-fast);
	}

	.compass:hover .dot {
		transform: translateX(-50%) scale(1.2);
		box-shadow: var(--shadow-md);
	}

	.arrow {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-style: solid;
		transition: all var(--transition-fast);
	}

	.compass:hover .arrow {
		transform: translateX(-50%) scale(1.2);
	}

	.end-marker.inward .arrow {
		border-width: 0 6px 10px 6px;
		border-color: transparent transparent currentColor transparent;
		top: 0;
	}

	.end-marker.outward .arrow {
		border-width: 10px 6px 0 6px;
		border-color: currentColor transparent transparent transparent;
		top: 0;
	}

	.motion-path {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		opacity: 0.7;
		transition: opacity var(--transition-fast);
	}

	.compass:hover .motion-path {
		opacity: 1;
	}

	.info-text {
		text-align: center;
		font-size: var(--font-size-xs);
		max-width: 100%;
		background-color: var(--surface-color-hover);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--border-radius-md);
		transition: all var(--transition-fast);
	}

	.compass-container:hover .info-text {
		background-color: var(--surface-color-active);
		transform: translateY(2px);
	}

	.motion-type {
		font-weight: 600;
		color: var(--text-color);
	}

	.locations {
		color: var(--text-color-secondary);
		margin: 2px 0;
	}

	.orientation {
		color: var(--text-color-tertiary);
		font-style: italic;
		font-size: var(--font-size-xs);
	}
</style>
