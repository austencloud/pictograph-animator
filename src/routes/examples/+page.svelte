<script lang="ts">
  import { PictographAnimator } from '$lib/components';
  import { simpleShapeAnimation, loadingSpinner, facialExpression } from '$lib/examples/samplePictographs';
  
  let activeExample = simpleShapeAnimation;
  let animatorConfig = {
    autoplay: true,
    loop: true,
    speed: 1
  };
  
  // References to animator components
  let animator: PictographAnimator;
  
  function setExample(example: 'shapes' | 'spinner' | 'face') {
    switch (example) {
      case 'shapes':
        activeExample = simpleShapeAnimation;
        break;
      case 'spinner':
        activeExample = loadingSpinner;
        break;
      case 'face':
        activeExample = facialExpression;
        break;
    }
  }
  
  function updateSpeed(event: Event) {
    const input = event.target as HTMLInputElement;
    const speed = parseFloat(input.value);
    animatorConfig = { ...animatorConfig, speed };
    
    // Update the current animator if it exists
    if (animator) {
      animator.setSpeed(speed);
    }
  }
  
  function toggleLoop() {
    animatorConfig = { ...animatorConfig, loop: !animatorConfig.loop };
  }
  
  function playAnimation() {
    if (animator) {
      animator.play();
    }
  }
  
  function pauseAnimation() {
    if (animator) {
      animator.pause();
    }
  }
  
  function stopAnimation() {
    if (animator) {
      animator.stop();
    }
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-3xl font-bold mb-6">Pictograph Animator Examples</h1>
  
  <div class="mb-6">
    <h2 class="text-xl font-semibold mb-2">Select Example</h2>
    <div class="flex gap-2">
      <button 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        on:click={() => setExample('shapes')}
      >
        Simple Shapes
      </button>
      <button 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        on:click={() => setExample('spinner')}
      >
        Loading Spinner
      </button>
      <button 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        on:click={() => setExample('face')}
      >
        Facial Expression
      </button>
    </div>
  </div>
  
  <div class="mb-6">
    <h2 class="text-xl font-semibold mb-2">Controls</h2>
    <div class="flex flex-wrap gap-4 items-center">
      <div>
        <label for="speed" class="block text-sm font-medium">Speed: {animatorConfig.speed}x</label>
        <input 
          id="speed" 
          type="range" 
          min="0.1" 
          max="3" 
          step="0.1" 
          value={animatorConfig.speed} 
          on:input={updateSpeed}
          class="w-32"
        />
      </div>
      
      <div class="flex items-center gap-2">
        <input 
          id="loop" 
          type="checkbox" 
          checked={animatorConfig.loop} 
          on:change={toggleLoop}
        />
        <label for="loop" class="text-sm font-medium">Loop animation</label>
      </div>
      
      <div class="flex gap-2">
        <button 
          class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          on:click={playAnimation}
        >
          Play
        </button>
        <button 
          class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          on:click={pauseAnimation}
        >
          Pause
        </button>
        <button 
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          on:click={stopAnimation}
        >
          Stop
        </button>
      </div>
    </div>
  </div>
  
  <div class="border rounded-lg p-4 bg-gray-50">
    <h2 class="text-xl font-semibold mb-4">{activeExample.name}</h2>
    
    <div class="w-64 h-64 mx-auto border rounded bg-white flex items-center justify-center">
      <PictographAnimator 
        pictograph={activeExample} 
        config={animatorConfig}
        bind:this={animator}
      />
    </div>
    
    <div class="mt-4">
      <h3 class="font-medium">Animation Details:</h3>
      <ul class="list-disc list-inside text-sm mt-2">
        <li>ID: {activeExample.id}</li>
        <li>Frames: {activeExample.frames.length}</li>
        <li>Total Duration: {activeExample.frames.reduce((sum, frame) => sum + frame.duration, 0) / 1000}s</li>
      </ul>
    </div>
  </div>
</div>
