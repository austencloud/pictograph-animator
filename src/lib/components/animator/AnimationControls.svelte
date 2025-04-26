<script lang="ts">
  // Props
  export let isPlaying: boolean = false;
  export let speed: number = 1.0;
  
  // Events
  export let onPlay: () => void;
  export let onPause: () => void;
  export let onReset: () => void;
  export let onSpeedChange: (newSpeed: number) => void;
</script>

<div class="controls">
  <button on:click={onPlay} disabled={isPlaying}>Play</button>
  <button on:click={onPause} disabled={!isPlaying}>Pause</button>
  <button on:click={onReset}>Reset</button>
  
  <div class="speed-control">
    <label for="speed-slider">Speed: {speed.toFixed(1)}x</label>
    <input 
      id="speed-slider" 
      type="range" 
      min="0.1" 
      max="3.0" 
      step="0.1" 
      bind:value={speed}
      on:input={() => onSpeedChange(speed)}
    />
  </div>
</div>

<style>
  .controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 1rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    background-color: #0072BC;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .speed-control {
    display: flex;
    flex-direction: column;
    margin-left: 1rem;
  }
</style>
