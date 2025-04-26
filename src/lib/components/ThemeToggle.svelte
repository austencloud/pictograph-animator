<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/theme';
	import { fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
</script>

<button
	class="theme-toggle"
	on:click={toggleTheme}
	aria-label={$theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
>
	<div class="icon-container">
		{#if $theme === 'light'}
			<div
				in:scale={{ duration: 400, start: 0.5, opacity: 0, easing: quintOut }}
				out:fly={{ y: 20, duration: 250, opacity: 0 }}
				class="icon moon"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
				</svg>
			</div>
		{:else}
			<div
				in:scale={{ duration: 400, start: 0.5, opacity: 0, easing: quintOut }}
				out:fly={{ y: -20, duration: 250, opacity: 0 }}
				class="icon sun"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<circle cx="12" cy="12" r="4"></circle>
					<path d="M12 2v2"></path>
					<path d="M12 20v2"></path>
					<path d="m4.93 4.93 1.41 1.41"></path>
					<path d="m17.66 17.66 1.41 1.41"></path>
					<path d="M2 12h2"></path>
					<path d="M20 12h2"></path>
					<path d="m6.34 17.66-1.41 1.41"></path>
					<path d="m19.07 4.93-1.41 1.41"></path>
				</svg>
			</div>
		{/if}
	</div>
</button>

<style>
	.theme-toggle {
		background: var(--surface-color);
		border: 1px solid var(--border-color);
		cursor: pointer;
		width: 40px;
		height: 40px;
		border-radius: var(--border-radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}

	.theme-toggle:hover {
		background-color: var(--surface-color-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.theme-toggle:active {
		transform: translateY(0);
		box-shadow: var(--shadow-sm);
	}

	.icon-container {
		position: relative;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-color);
	}

	.moon {
		color: var(--secondary-color);
	}

	.sun {
		color: var(--accent-color);
	}

	/* Add a subtle glow effect on hover */
	.theme-toggle:hover .moon {
		filter: drop-shadow(0 0 3px var(--secondary-color-focus));
	}

	.theme-toggle:hover .sun {
		filter: drop-shadow(0 0 3px var(--accent-color-focus));
	}

	/* Add a subtle rotation on hover */
	.theme-toggle:hover .icon svg {
		animation: wiggle 1s ease-in-out infinite;
	}

	@keyframes wiggle {
		0%,
		100% {
			transform: rotate(0);
		}
		25% {
			transform: rotate(8deg);
		}
		75% {
			transform: rotate(-8deg);
		}
	}
</style>
