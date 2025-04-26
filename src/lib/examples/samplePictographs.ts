import type { Pictograph } from '../types';

/**
 * A simple two-frame animation that alternates between a circle and a square
 */
export const simpleShapeAnimation: Pictograph = {
  id: 'simple-shapes',
  name: 'Simple Shapes',
  frames: [
    {
      id: 'circle',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#3498db" />
      </svg>`,
      duration: 1000
    },
    {
      id: 'square',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect x="10" y="10" width="80" height="80" fill="#e74c3c" />
      </svg>`,
      duration: 1000
    }
  ],
  loop: true
};

/**
 * A loading spinner animation with 8 frames
 */
export const loadingSpinner: Pictograph = {
  id: 'loading-spinner',
  name: 'Loading Spinner',
  frames: [
    {
      id: 'spinner-1',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3498db" stroke-width="8" stroke-dasharray="251.2" stroke-dashoffset="0" />
      </svg>`,
      duration: 125
    },
    {
      id: 'spinner-2',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3498db" stroke-width="8" stroke-dasharray="251.2" stroke-dashoffset="31.4" />
      </svg>`,
      duration: 125
    },
    {
      id: 'spinner-3',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3498db" stroke-width="8" stroke-dasharray="251.2" stroke-dashoffset="62.8" />
      </svg>`,
      duration: 125
    },
    {
      id: 'spinner-4',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3498db" stroke-width="8" stroke-dasharray="251.2" stroke-dashoffset="94.2" />
      </svg>`,
      duration: 125
    },
    {
      id: 'spinner-5',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3498db" stroke-width="8" stroke-dasharray="251.2" stroke-dashoffset="125.6" />
      </svg>`,
      duration: 125
    },
    {
      id: 'spinner-6',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3498db" stroke-width="8" stroke-dasharray="251.2" stroke-dashoffset="157" />
      </svg>`,
      duration: 125
    },
    {
      id: 'spinner-7',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3498db" stroke-width="8" stroke-dasharray="251.2" stroke-dashoffset="188.4" />
      </svg>`,
      duration: 125
    },
    {
      id: 'spinner-8',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#3498db" stroke-width="8" stroke-dasharray="251.2" stroke-dashoffset="219.8" />
      </svg>`,
      duration: 125
    }
  ],
  loop: true,
  speed: 1
};

/**
 * A simple face animation that changes expressions
 */
export const facialExpression: Pictograph = {
  id: 'facial-expression',
  name: 'Facial Expression',
  frames: [
    {
      id: 'neutral',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#ffd700" />
        <circle cx="35" cy="40" r="5" fill="#000" />
        <circle cx="65" cy="40" r="5" fill="#000" />
        <line x1="35" y1="70" x2="65" y2="70" stroke="#000" stroke-width="3" />
      </svg>`,
      duration: 2000
    },
    {
      id: 'happy',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#ffd700" />
        <circle cx="35" cy="40" r="5" fill="#000" />
        <circle cx="65" cy="40" r="5" fill="#000" />
        <path d="M 30 70 Q 50 85 70 70" fill="none" stroke="#000" stroke-width="3" />
      </svg>`,
      duration: 2000
    },
    {
      id: 'sad',
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#ffd700" />
        <circle cx="35" cy="40" r="5" fill="#000" />
        <circle cx="65" cy="40" r="5" fill="#000" />
        <path d="M 30 75 Q 50 60 70 75" fill="none" stroke="#000" stroke-width="3" />
      </svg>`,
      duration: 2000
    }
  ],
  loop: true
};
