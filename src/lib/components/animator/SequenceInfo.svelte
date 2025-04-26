<script lang="ts">
  import type { SequenceData } from '../../types/sequence.js';
  
  // Props
  export let sequence: SequenceData;
  export let showData: boolean = false;
</script>

<div class="sequence-info">
  <h3>Sequence Information</h3>
  
  <div class="info-grid">
    <div class="info-item">
      <span class="label">Name:</span>
      <span class="value">{sequence[0].word}</span>
    </div>
    
    <div class="info-item">
      <span class="label">Author:</span>
      <span class="value">{sequence[0].author || 'Unknown'}</span>
    </div>
    
    <div class="info-item">
      <span class="label">Level:</span>
      <span class="value">{sequence[0].level || 'N/A'}</span>
    </div>
    
    <div class="info-item">
      <span class="label">Steps:</span>
      <span class="value">{sequence.length - 1}</span>
    </div>
    
    {#if sequence[0].description}
      <div class="info-item full-width">
        <span class="label">Description:</span>
        <span class="value">{sequence[0].description}</span>
      </div>
    {/if}
  </div>
  
  {#if showData}
    <div class="sequence-data">
      <h4>Sequence Data</h4>
      <pre>{JSON.stringify(sequence, null, 2)}</pre>
    </div>
  {/if}
</div>

<style>
  .sequence-info {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }
  
  h4 {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
  }
  
  .full-width {
    grid-column: 1 / -1;
  }
  
  .label {
    font-weight: bold;
    font-size: 0.9rem;
    color: #555;
  }
  
  .value {
    font-size: 1rem;
  }
  
  .sequence-data {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #ddd;
  }
  
  pre {
    margin: 0;
    padding: 0.5rem;
    background-color: #f0f0f0;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.85rem;
    white-space: pre-wrap;
  }
</style>
