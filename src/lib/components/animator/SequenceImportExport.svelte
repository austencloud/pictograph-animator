<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { SequenceData } from '../../types/sequence.js';
  import { 
    parseAndConvertToSequenceData, 
    stringifySequenceOldFormat 
  } from '../../utils/sequenceConverter.js';

  // Props
  export let sequence: SequenceData;
  
  // Local state
  let jsonInput = '';
  let importError = '';
  let importSuccess = '';
  let showImportForm = false;
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    import: { sequence: SequenceData };
  }>();
  
  // Toggle import form
  function toggleImportForm() {
    showImportForm = !showImportForm;
    if (showImportForm) {
      // Clear previous messages
      importError = '';
      importSuccess = '';
    }
  }
  
  // Import sequence from JSON
  function importSequence() {
    try {
      importError = '';
      importSuccess = '';
      
      if (!jsonInput.trim()) {
        importError = 'Please enter JSON data';
        return;
      }
      
      // Parse and convert the JSON to SequenceData
      const importedSequence = parseAndConvertToSequenceData(jsonInput);
      
      // Validate the imported sequence
      if (!importedSequence || !Array.isArray(importedSequence) || importedSequence.length < 2) {
        importError = 'Invalid sequence data: must contain metadata and at least one step';
        return;
      }
      
      // Dispatch the import event
      dispatch('import', { sequence: importedSequence });
      
      // Show success message
      importSuccess = 'Sequence imported successfully!';
      
      // Clear the input
      jsonInput = '';
      
      // Close the import form after a delay
      setTimeout(() => {
        showImportForm = false;
      }, 2000);
    } catch (error) {
      importError = `Error importing sequence: ${(error as Error).message}`;
    }
  }
  
  // Export sequence to JSON
  function exportSequence() {
    try {
      // Convert the sequence to JSON
      const json = stringifySequenceOldFormat(sequence);
      
      // Create a blob with the JSON data
      const blob = new Blob([json], { type: 'application/json' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a link element
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sequence[0].word || 'sequence'}.json`;
      
      // Append the link to the document
      document.body.appendChild(a);
      
      // Click the link
      a.click();
      
      // Remove the link
      document.body.removeChild(a);
      
      // Revoke the URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting sequence:', error);
      alert(`Error exporting sequence: ${(error as Error).message}`);
    }
  }
</script>

<div class="sequence-import-export">
  <div class="buttons">
    <button class="import-btn" on:click={toggleImportForm}>
      Import Sequence
    </button>
    
    <button class="export-btn" on:click={exportSequence}>
      Export Sequence
    </button>
  </div>
  
  {#if showImportForm}
    <div class="import-form">
      <h3>Import Sequence</h3>
      
      <div class="form-group">
        <label for="json-input">Paste JSON sequence data:</label>
        <textarea 
          id="json-input" 
          bind:value={jsonInput} 
          rows="10" 
          placeholder="Paste JSON sequence data here..."
        ></textarea>
      </div>
      
      {#if importError}
        <div class="error-message">
          {importError}
        </div>
      {/if}
      
      {#if importSuccess}
        <div class="success-message">
          {importSuccess}
        </div>
      {/if}
      
      <div class="form-actions">
        <button class="cancel-btn" on:click={toggleImportForm}>
          Cancel
        </button>
        
        <button class="import-btn" on:click={importSequence}>
          Import
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .sequence-import-export {
    margin-top: 1rem;
  }
  
  .buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .import-btn {
    background-color: #4CAF50;
    color: white;
  }
  
  .export-btn {
    background-color: #2196F3;
    color: white;
  }
  
  .cancel-btn {
    background-color: #f44336;
    color: white;
  }
  
  .import-form {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  
  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: monospace;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
  
  .error-message {
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: #ffebee;
    color: #f44336;
    border-radius: 4px;
  }
  
  .success-message {
    margin-bottom: 1rem;
    padding: 0.5rem;
    background-color: #e8f5e9;
    color: #4CAF50;
    border-radius: 4px;
  }
</style>
