<script lang="ts">
  import { PictographAnimator } from '$lib/components';
  import { createAnimatorStore } from '$lib/stores/animator';
  import type { Pictograph } from '$lib/types';
  
  // Create a custom pictograph
  const customPictograph: Pictograph = {
    id: 'custom-animation',
    name: 'Custom Animation',
    frames: [
      {
        id: 'frame-1',
        content: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect x="50" y="50" width="100" height="100" fill="#3498db" />
        </svg>`,
        duration: 500
      },
      {
        id: 'frame-2',
        content: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect x="50" y="50" width="100" height="100" fill="#3498db" transform="rotate(45 100 100)" />
        </svg>`,
        duration: 500
      },
      {
        id: 'frame-3',
        content: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect x="50" y="50" width="100" height="100" fill="#3498db" transform="rotate(90 100 100)" />
        </svg>`,
        duration: 500
      },
      {
        id: 'frame-4',
        content: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect x="50" y="50" width="100" height="100" fill="#3498db" transform="rotate(135 100 100)" />
        </svg>`,
        duration: 500
      },
      {
        id: 'frame-5',
        content: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect x="50" y="50" width="100" height="100" fill="#3498db" transform="rotate(180 100 100)" />
        </svg>`,
        duration: 500
      },
      {
        id: 'frame-6',
        content: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect x="50" y="50" width="100" height="100" fill="#3498db" transform="rotate(225 100 100)" />
        </svg>`,
        duration: 500
      },
      {
        id: 'frame-7',
        content: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect x="50" y="50" width="100" height="100" fill="#3498db" transform="rotate(270 100 100)" />
        </svg>`,
        duration: 500
      },
      {
        id: 'frame-8',
        content: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
          <rect x="50" y="50" width="100" height="100" fill="#3498db" transform="rotate(315 100 100)" />
        </svg>`,
        duration: 500
      }
    ],
    loop: true
  };
  
  // Create a shared animator store
  const animator = createAnimatorStore(customPictograph);
  
  // Local state
  let currentFrameIndex = 0;
  let isPlaying = false;
  let progress = 0;
  
  // Subscribe to animator store
  const unsubscribe = animator.subscribe(state => {
    currentFrameIndex = state.currentFrameIndex;
    isPlaying = state.isPlaying;
  });
  
  // Subscribe to progress
  const unsubscribeProgress = animator.progress.subscribe(value => {
    progress = value;
  });
  
  // Event handlers
  function handleFrameClick(index: number) {
    animator.goToFrame(index);
  }
  
  function togglePlayPause() {
    if (isPlaying) {
      animator.pause();
    } else {
      animator.play();
    }
  }
  
  function handleSpeedChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const speed = parseFloat(input.value);
    animator.setSpeed(speed);
  }
  
  function handleLoopChange(event: Event) {
    const input = event.target as HTMLInputElement;
    animator.setLoop(input.checked);
  }
  
  // Cleanup on component destroy
  onDestroy(() => {
    unsubscribe();
    unsubscribeProgress();
  });
</script>

<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6">Advanced Pictograph Animation</h1>
  
  <p class="mb-4">
    This example demonstrates advanced usage with a shared animator store and custom controls.
  </p>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="border rounded-lg p-4 bg-gray-50">
      <h2 class="text-xl font-semibold mb-4">Animation</h2>
      
      <div class="w-full h-64 border rounded bg-white flex items-center justify-center">
        <PictographAnimator pictograph={customPictograph} />
      </div>
      
      <div class="mt-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm font-medium">Progress:</span>
          <span class="text-sm">{(progress * 100).toFixed(0)}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="bg-blue-600 h-2.5 rounded-full" style="width: {progress * 100}%"></div>
        </div>
      </div>
    </div>
    
    <div class="border rounded-lg p-4 bg-gray-50">
      <h2 class="text-xl font-semibold mb-4">Controls</h2>
      
      <div class="mb-4">
        <button 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
          on:click={togglePlayPause}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Speed</label>
        <input 
          type="range" 
          min="0.1" 
          max="3" 
          step="0.1" 
          value="1" 
          class="w-full"
          on:input={handleSpeedChange}
        />
      </div>
      
      <div class="mb-4 flex items-center">
        <input 
          id="loop" 
          type="checkbox" 
          checked={true}
          on:change={handleLoopChange}
          class="mr-2"
        />
        <label for="loop" class="text-sm font-medium">Loop animation</label>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Frames</label>
        <div class="grid grid-cols-4 gap-2">
          {#each customPictograph.frames as frame, i}
            <button 
              class="p-2 border rounded text-center text-sm {currentFrameIndex === i ? 'bg-blue-100 border-blue-500' : 'bg-white'}"
              on:click={() => handleFrameClick(i)}
            >
              {i + 1}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
  
  <div class="mt-8">
    <h2 class="text-xl font-semibold mb-2">Using a Shared Animator Store</h2>
    <pre class="bg-gray-100 p-4 rounded overflow-x-auto">
{`<script>
  import { PictographAnimator } from 'pictograph-animator';
  import { createAnimatorStore } from 'pictograph-animator';
  
  // Create a shared animator store
  const animator = createAnimatorStore(myPictograph);
  
  // Subscribe to animator state
  animator.subscribe(state => {
    // Access animation state
    console.log(state.currentFrameIndex, state.isPlaying);
  });
  
  // Control the animation
  function playAnimation() {
    animator.play();
  }
</script>

<PictographAnimator pictograph={myPictograph} />`}
    </pre>
  </div>
</div>
