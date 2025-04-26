<script lang="ts">
  import SequenceAnimator from '../../lib/components/SequenceAnimator.svelte';
  import type { SequenceData } from '../../lib/types/sequence.js';
  import { 
    aabbSequence, 
    complexSequence, 
    aSequence,
    getAllSequences,
    getSequenceById
  } from '../../lib/data/sequences/index.js';

  // Get all available sequences
  const sequences = getAllSequences();
  
  // Currently selected sequence
  let selectedSequence: SequenceData = aabbSequence;

  // Function to switch between sequences
  function selectSequence(id: string) {
    const sequence = getSequenceById(id);
    if (sequence) {
      selectedSequence = sequence;
    }
  }

  // Canvas size
  let canvasSize = 600;
  
  // Animation speed
  let animationSpeed = 1.0;
  
  // Show sequence data
  let showSequenceData = false;
</script>

<div class="container">
  <h1>Sequence Animator</h1>
  
  <div class="sequence-selector">
    <h3>Select Sequence</h3>
    <div class="buttons">
      <button 
        class:active={selectedSequence === aabbSequence} 
        on:click={() => selectSequence('aabb')}
      >
        AABB Pattern
      </button>
      <button 
        class:active={selectedSequence === complexSequence} 
        on:click={() => selectSequence('complex')}
      >
        Complex Pattern
      </button>
      <button 
        class:active={selectedSequence === aSequence} 
        on:click={() => selectSequence('a')}
      >
        A Pattern
      </button>
    </div>
  </div>
  
  <div class="animator-container">
    <SequenceAnimator 
      sequenceData={selectedSequence}
      width={canvasSize}
      height={canvasSize}
      speed={animationSpeed}
    />
  </div>
  
  <div class="settings">
    <div class="setting">
      <label for="canvas-size">Canvas Size: {canvasSize}px</label>
      <input 
        id="canvas-size" 
        type="range" 
        min="300" 
        max="900" 
        step="50" 
        bind:value={canvasSize}
      />
    </div>
    
    <div class="setting">
      <label for="speed">Animation Speed: {animationSpeed.toFixed(1)}x</label>
      <input 
        id="speed" 
        type="range" 
        min="0.1" 
        max="3.0" 
        step="0.1" 
        bind:value={animationSpeed}
      />
    </div>
  </div>
  
  <div class="sequence-info">
    <h2>Current Sequence: {selectedSequence[0].word}</h2>
    <p>Author: {selectedSequence[0].author || 'Unknown'}</p>
    <p>Level: {selectedSequence[0].level || 'N/A'}</p>
    <p>Steps: {selectedSequence.length - 1}</p>
    
    <h3>Motion Types</h3>
    <ul>
      <li><strong>Pro:</strong> Staff points toward center</li>
      <li><strong>Anti:</strong> Staff rotates based on rotation direction and turns</li>
      <li><strong>Static:</strong> Staff maintains its orientation</li>
      <li><strong>Dash:</strong> Staff maintains orientation but may have specific end orientation</li>
    </ul>
    
    <h3>Rotation Directions</h3>
    <ul>
      <li><strong>CW:</strong> Clockwise rotation</li>
      <li><strong>CCW:</strong> Counter-clockwise rotation</li>
      <li><strong>No Rot:</strong> No rotation</li>
    </ul>
    
    <div class="data-toggle">
      <label>
        <input type="checkbox" bind:checked={showSequenceData} />
        Show Sequence Data
      </label>
    </div>
  </div>
  
  {#if showSequenceData}
    <div class="sequence-data">
      <h3>Sequence Data</h3>
      <pre>{JSON.stringify(selectedSequence, null, 2)}</pre>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  h2 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .sequence-selector {
    margin-bottom: 2rem;
  }
  
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  button:hover {
    background-color: #e0e0e0;
  }
  
  button.active {
    background-color: #0072BC;
    color: white;
  }
  
  .animator-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }
  
  .settings {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .setting {
    display: flex;
    flex-direction: column;
  }
  
  .sequence-info {
    margin-bottom: 2rem;
  }
  
  .sequence-info ul {
    margin-top: 0.5rem;
    margin-bottom: 1.5rem;
    padding-left: 1.5rem;
  }
  
  .data-toggle {
    margin-top: 1.5rem;
  }
  
  .sequence-data {
    margin-top: 2rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  pre {
    margin: 0;
    white-space: pre-wrap;
    font-size: 0.9rem;
  }
</style>
