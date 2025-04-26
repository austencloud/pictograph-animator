import type { SequenceData, SequenceStep, SequenceMetadata } from '../../types/sequence.js';

// Define the JSON sequence format
interface JsonSequence {
  metadata: Record<string, any>;
  steps: Record<string, any>[];
}

// Load JSON files
// Note: We need to use dynamic imports for JSON files in SvelteKit
async function loadJsonSequence(path: string): Promise<JsonSequence> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load sequence: ${response.statusText}`);
    }
    return await response.json() as JsonSequence;
  } catch (error) {
    console.error('Error loading sequence:', error);
    throw error;
  }
}

// Convert JSON sequence to SequenceData format
function convertJsonToSequenceData(jsonSequence: JsonSequence): SequenceData {
  const { metadata, steps } = jsonSequence;
  
  // Create the sequence data array with metadata as the first element
  const sequenceData: SequenceData = [
    metadata as SequenceMetadata,
    ...steps as SequenceStep[]
  ];
  
  return sequenceData;
}

// Create placeholder sequences until we can load the JSON files
export const aabbSequence: SequenceData = [
  {
    word: 'AABB',
    author: 'Example Author',
    level: 1,
    prop_type: 'staff',
    grid_mode: 'diamond',
    is_circular: true
  },
  {
    beat: 1,
    letter: 'A',
    start_pos: 'alpha1',
    end_pos: 'alpha3',
    blue_attributes: {
      motion_type: 'pro',
      prop_rot_dir: 'cw',
      start_loc: 's',
      end_loc: 'w',
    },
    red_attributes: {
      motion_type: 'pro',
      prop_rot_dir: 'cw',
      start_loc: 'n',
      end_loc: 'e'
    }
  }, 
  {
    beat: 2,
    letter: 'A',
    start_pos: 'alpha3',
    end_pos: 'alpha5',
    blue_attributes: {
      motion_type: 'pro',
      prop_rot_dir: 'cw',
      start_loc: 'w',
      end_loc: 'n'
    },
    red_attributes: {
      motion_type: 'pro',
      prop_rot_dir: 'cw',
      start_loc: 'e',
      end_loc: 's'
    }
  }
];

export const complexSequence: SequenceData = [
  {
    word: 'Complex',
    author: 'Example Author',
    level: 2,
    prop_type: 'staff',
    grid_mode: 'diamond',
    is_circular: true
  },
  {
    beat: 1,
    start_pos: 'n',
    end_pos: 'e',
    blue_attributes: {
      motion_type: 'pro',
      prop_rot_dir: 'no_rot',
      start_loc: 'n',
      end_loc: 'e'
    },
    red_attributes: {
      motion_type: 'pro',
      prop_rot_dir: 'no_rot',
      start_loc: 'n',
      end_loc: 'e'
    }
  }
];

export const aSequence: SequenceData = [
  {
    word: 'A',
    author: 'Example Author',
    level: 1,
    prop_type: 'staff',
    grid_mode: 'diamond',
    is_circular: true
  },
  {
    beat: 1,
    letter: 'A',
    start_pos: 'n',
    end_pos: 'e',
    blue_attributes: {
      motion_type: 'pro',
      prop_rot_dir: 'no_rot',
      start_loc: 'n',
      end_loc: 'e'
    },
    red_attributes: {
      motion_type: 'pro',
      prop_rot_dir: 'no_rot',
      start_loc: 'n',
      end_loc: 'e'
    }
  }
];

// Create a registry of all available sequences
export const sequenceRegistry: Record<string, SequenceData> = {
  aabb: aabbSequence,
  complex: complexSequence,
  a: aSequence
};

// Helper functions
export function getSequenceById(id: string): SequenceData | undefined {
  return sequenceRegistry[id];
}

export function getAllSequenceIds(): string[] {
  return Object.keys(sequenceRegistry);
}

export function getAllSequences(): SequenceData[] {
  return Object.values(sequenceRegistry);
}

export function getSequenceMetadata(id: string): Record<string, any> | undefined {
  const sequence = sequenceRegistry[id];
  if (!sequence || sequence.length === 0) return undefined;
  return sequence[0];
}

// In a real implementation, we would load the JSON files at startup
// For now, we're using placeholder data
export async function initializeSequences(): Promise<void> {
  try {
    // This would be where we load the JSON files
    // For example:
    // const aabbJson = await loadJsonSequence('/sequences/aabb.json');
    // sequenceRegistry.aabb = convertJsonToSequenceData(aabbJson);
    
    console.log('Sequences initialized');
  } catch (error) {
    console.error('Failed to initialize sequences:', error);
  }
}
