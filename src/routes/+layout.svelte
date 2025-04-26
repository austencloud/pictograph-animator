<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import '$lib/styles/global.css';
	import { initTheme } from '$lib/stores/theme.js';

	onMount(() => {
		initTheme();
	});
</script>

<div class="app-layout">
	<header class="app-header">
		<div class="header-container container">
			<a href="/" class="logo">Sequence Animator</a>
			<nav class="main-nav">
				<ul>
					<li><a href="/" class:active={$page.url.pathname === '/'}>Home</a></li>
				</ul>
			</nav>
			<div class="header-actions">
				<ThemeToggle />
			</div>
		</div>
	</header>

	<main class="app-main">
		<slot />
	</main>

	<footer class="app-footer">
		<div class="container">
			<p>&copy; {new Date().getFullYear()} Sequence Animator</p>
		</div>
	</footer>
</div>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.app-header {
		background-color: var(--surface-color);
		border-bottom: 1px solid var(--border-color);
		padding: var(--spacing-md) 0;
		position: sticky;
		top: 0;
		z-index: var(--z-index-sticky);
		box-shadow: var(--shadow-sm);
		transition:
			background-color var(--transition-normal),
			border-color var(--transition-normal);
	}

	.header-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.logo {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-color);
		text-decoration: none;
		transition: color var(--transition-fast);
	}

	.logo:hover {
		color: var(--primary-color);
		text-decoration: none;
	}

	.main-nav ul {
		display: flex;
		list-style: none;
		gap: var(--spacing-md);
	}

	.main-nav a {
		color: var(--text-color-secondary);
		text-decoration: none;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--border-radius-md);
		transition: all var(--transition-fast);
	}

	.main-nav a:hover {
		color: var(--text-color);
		background-color: var(--surface-color-hover);
		text-decoration: none;
	}

	.main-nav a.active {
		color: var(--primary-color);
		font-weight: 600;
		background-color: var(--surface-color-hover);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
	}

	.app-main {
		flex: 1;
		padding: var(--spacing-xl) 0;
	}

	.app-footer {
		background-color: var(--surface-color);
		border-top: 1px solid var(--border-color);
		padding: var(--spacing-lg) 0;
		text-align: center;
		color: var(--text-color-secondary);
		font-size: var(--font-size-sm);
		transition:
			background-color var(--transition-normal),
			border-color var(--transition-normal);
	}

	@media (max-width: 640px) {
		.header-container {
			flex-direction: column;
			gap: var(--spacing-sm);
		}

		.main-nav {
			order: 3;
			width: 100%;
		}

		.main-nav ul {
			justify-content: center;
		}

		.header-actions {
			order: 2;
		}
	}
</style>
