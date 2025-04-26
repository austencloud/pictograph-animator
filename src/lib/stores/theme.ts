import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Check if we're in a browser environment and get the stored theme or system preference
const getInitialTheme = () => {
  if (browser) {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  
  // Default to light theme
  return 'light';
};

// Create the theme store
export const theme = writable<'light' | 'dark'>(getInitialTheme());

// Function to toggle the theme
export function toggleTheme() {
  theme.update(currentTheme => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    if (browser) {
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    
    return newTheme;
  });
}

// Initialize theme on app load
export function initTheme() {
  if (browser) {
    theme.subscribe(value => {
      document.documentElement.setAttribute('data-theme', value);
    });
  }
}
