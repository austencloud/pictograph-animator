import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create a writable store with initial value
export const theme = writable('light');

// Initialize theme from localStorage or system preference
export function initTheme() {
  if (browser) {
    // Check for stored theme preference
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme) {
      // Use stored theme
      setTheme(storedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    
    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// Set theme and update DOM
export function setTheme(newTheme) {
  if (browser) {
    // Update store
    theme.set(newTheme);
    
    // Update DOM
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
  }
}

// Toggle between light and dark themes
export function toggleTheme() {
  theme.update(currentTheme => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    return newTheme;
  });
}
