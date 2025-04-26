<script lang="ts">
	import { getAllSequences } from '$lib/data/sequences/loader.js';
  import type { SequenceData } from '../../types/sequence.js';
  
  // Props
  export let selectedSequence: SequenceData;
  
  // Get all available sequences
  const sequences = getAllSequences();
  
  // Event handler for sequence selection
  function handleSelect(sequence: SequenceData) {
    selectedSequence = sequence;
  }
</script>

<div class="sequence-selector">
  <h3>Select Sequence</h3>
  
  <div class="buttons">
    {#each sequences as sequence}
      <button 
        class:active={selectedSequence === sequence}
        on:click={() => handleSelect(sequence)}
      >
        {sequence[0].word}
      </button>
    {/each}
  </div>
</div>

<style>
  .sequence-selector {
    margin-bottom: 1.5rem;
  }
  
  h3 {
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
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
</style>
