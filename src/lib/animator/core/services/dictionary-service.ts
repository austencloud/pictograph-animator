/**
 * Dictionary service for managing the sequence catalog
 */

import type { DictionaryItem, DictionaryIndex, SequenceData } from '../../types/core.js';
import { extractSequenceFromPNG } from '../../utils/file/png-parser.js';

export class DictionaryService {
	private static instance: DictionaryService;
	private index: DictionaryIndex | null = null;
	private isLoading = false;

	private constructor() {}

	static getInstance(): DictionaryService {
		if (!DictionaryService.instance) {
			DictionaryService.instance = new DictionaryService();
		}
		return DictionaryService.instance;
	}

	/**
	 * Get the dictionary index, loading it if necessary
	 */
	async getIndex(): Promise<DictionaryIndex> {
		if (this.index) {
			return this.index;
		}

		if (this.isLoading) {
			// Wait for existing load to complete
			while (this.isLoading) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
			return this.index!;
		}

		return this.loadIndex();
	}

	/**
	 * Load the dictionary index from the file system
	 */
	private async loadIndex(): Promise<DictionaryIndex> {
		this.isLoading = true;

		try {
			const items = await this.scanDictionaryFiles();
			const categories = this.extractCategories(items);

			this.index = {
				items,
				categories,
				totalCount: items.length,
				lastUpdated: new Date()
			};

			return this.index;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Scan the dictionary directory for PNG files
	 */
	private async scanDictionaryFiles(): Promise<DictionaryItem[]> {
		const items: DictionaryItem[] = [];

		try {
			// In a browser environment, we need to use a different approach
			// For now, we'll use a predefined list of known sequences
			const knownSequences = await this.getKnownSequences();

			for (const sequenceInfo of knownSequences) {
				try {
					const item = await this.createDictionaryItem(sequenceInfo);
					if (item) {
						items.push(item);
					}
				} catch (error) {
					console.warn(`Failed to process ${sequenceInfo.name}:`, error);
				}
			}
		} catch (error) {
			console.error('Failed to scan dictionary files:', error);
		}

		return items.sort((a, b) => a.name.localeCompare(b.name));
	}

	/**
	 * Get a list of known sequences from the dictionary
	 * This is a temporary solution until we can implement proper directory scanning
	 */
	private async getKnownSequences(): Promise<Array<{ name: string; versions: string[] }>> {
		// This would ideally be generated from the actual directory structure
		// For now, we'll return a subset of known sequences
		return [
			{ name: 'ABC', versions: ['ABC_ver1.png'] },
			{ name: 'AABB', versions: ['AABB_ver1.png', 'AABB_ver2.png'] },
			{ name: 'AAKE', versions: ['AAKE_ver1.png'] },
			{ name: 'AB', versions: ['AB_ver1.png'] },
			{ name: 'AKE', versions: ['AKE_ver2.png'] },
			{ name: 'AKIΦ', versions: ['AKIΦ_ver1.png', 'AKIΦ_ver2.png'] },
			{ name: 'B', versions: ['B_ver1.png'] },
			{ name: 'C', versions: ['C_ver1.png', 'C_ver2.png', 'C_ver3.png'] },
			{ name: 'CAKE', versions: ['CAKE_ver1.png'] },
			{ name: 'DJ', versions: ['DJ_ver1.png'] },
			{ name: 'EJ', versions: ['EJ_ver2.png'] },
			{ name: 'FL', versions: ['FL_ver1.png'] },
			{ name: 'G', versions: ['G_ver1.png'] },
			{ name: 'H', versions: ['H_ver1.png'] },
			{ name: 'I', versions: ['I_ver1.png'] },
			{ name: 'LF', versions: ['LF_ver1.png', 'LF_ver2.png'] },
			{ name: 'MOON', versions: ['MOON_ver1.png'] },
			{ name: 'MOONS', versions: ['MOONS_ver1.png'] },
			{ name: 'POSSUM', versions: ['POSSUM_ver1.png'] },
			{ name: 'S', versions: ['S_ver1.png'] },
			{ name: 'T', versions: ['T_ver1.png', 'T_ver2.png'] },
			{ name: 'U', versions: ['U_ver1.png'] },
			{ name: 'V', versions: ['V_ver1.png', 'V_ver2.png'] }
		];
	}

	/**
	 * Create a dictionary item from sequence information
	 */
	private async createDictionaryItem(sequenceInfo: {
		name: string;
		versions: string[];
	}): Promise<DictionaryItem | null> {
		try {
			// Use the first version to extract metadata
			const primaryVersion = sequenceInfo.versions[0];
			const filePath = `/api/dictionary/${sequenceInfo.name}/${primaryVersion}`;

			// Fetch the file through our API endpoint
			const response = await fetch(filePath);
			if (!response.ok) {
				// If fetch fails, create a placeholder item
				console.warn(`Could not fetch ${filePath}, creating placeholder`);
				return this.createPlaceholderItem(sequenceInfo);
			}

			const blob = await response.blob();
			const file = new File([blob], primaryVersion, { type: 'image/png' });

			const extractResult = await extractSequenceFromPNG(file);
			if (!extractResult.success || !extractResult.data) {
				console.warn(`Failed to extract metadata from ${filePath}, creating placeholder`);
				return this.createPlaceholderItem(sequenceInfo);
			}

			const metadata = extractResult.data[0] || {};

			return {
				id: sequenceInfo.name,
				name: sequenceInfo.name,
				filePath,
				metadata,
				sequenceData: extractResult.data,
				thumbnailUrl: filePath, // Use the PNG file itself as thumbnail
				versions: sequenceInfo.versions
			};
		} catch (error) {
			console.warn(`Failed to create dictionary item for ${sequenceInfo.name}:`, error);
			return this.createPlaceholderItem(sequenceInfo);
		}
	}

	/**
	 * Create a placeholder item when the actual file cannot be loaded
	 */
	private createPlaceholderItem(sequenceInfo: {
		name: string;
		versions: string[];
	}): DictionaryItem {
		return {
			id: sequenceInfo.name,
			name: sequenceInfo.name,
			filePath: `/api/dictionary/${sequenceInfo.name}/${sequenceInfo.versions[0]}`,
			metadata: {
				word: sequenceInfo.name,
				author: 'Unknown',
				level: 1,
				prop_type: 'staff',
				grid_mode: 'standard'
			},
			sequenceData: [
				{
					word: sequenceInfo.name,
					author: 'Unknown',
					level: 1,
					prop_type: 'staff',
					grid_mode: 'standard'
				},
				// Add some basic sequence data
				{
					beat: 1,
					blue_attributes: {
						start_loc: 's',
						end_loc: 's',
						start_ori: 'in',
						end_ori: 'in',
						prop_rot_dir: 'no_rot',
						turns: 0,
						motion_type: 'static'
					},
					red_attributes: {
						start_loc: 'n',
						end_loc: 'n',
						start_ori: 'in',
						end_ori: 'in',
						prop_rot_dir: 'no_rot',
						turns: 0,
						motion_type: 'static'
					}
				},
				{
					beat: 2,
					blue_attributes: {
						start_loc: 's',
						end_loc: 'w',
						start_ori: 'in',
						end_ori: 'in',
						prop_rot_dir: 'cw',
						turns: 0,
						motion_type: 'pro'
					},
					red_attributes: {
						start_loc: 'n',
						end_loc: 'e',
						start_ori: 'in',
						end_ori: 'in',
						prop_rot_dir: 'cw',
						turns: 0,
						motion_type: 'pro'
					}
				}
			],
			versions: sequenceInfo.versions
		};
	}

	/**
	 * Extract categories from dictionary items
	 */
	private extractCategories(items: DictionaryItem[]): string[] {
		const categories = new Set<string>();

		items.forEach((item) => {
			// Extract categories based on sequence properties
			if (item.metadata.level) {
				categories.add(`Level ${item.metadata.level}`);
			}
			if (item.metadata.prop_type) {
				categories.add(item.metadata.prop_type);
			}
			if (item.metadata.grid_mode) {
				categories.add(item.metadata.grid_mode);
			}

			// Add length-based categories
			const stepCount = item.sequenceData.length - 2; // Subtract metadata and start position
			if (stepCount <= 5) {
				categories.add('Short (≤5 steps)');
			} else if (stepCount <= 10) {
				categories.add('Medium (6-10 steps)');
			} else {
				categories.add('Long (>10 steps)');
			}
		});

		return Array.from(categories).sort();
	}

	/**
	 * Search dictionary items
	 */
	async searchItems(query: string, category?: string): Promise<DictionaryItem[]> {
		const index = await this.getIndex();
		let items = index.items;

		// Filter by category
		if (category && category !== 'All') {
			items = items.filter((item) => {
				if (category.startsWith('Level ')) {
					return item.metadata.level?.toString() === category.replace('Level ', '');
				}
				if (category.includes('steps')) {
					const stepCount = item.sequenceData.length - 1;
					if (category.includes('≤5')) return stepCount <= 5;
					if (category.includes('6-10')) return stepCount >= 6 && stepCount <= 10;
					if (category.includes('>10')) return stepCount > 10;
				}
				return item.metadata.prop_type === category || item.metadata.grid_mode === category;
			});
		}

		// Filter by search query
		if (query.trim()) {
			const lowerQuery = query.toLowerCase();
			items = items.filter(
				(item) =>
					item.name.toLowerCase().includes(lowerQuery) ||
					item.metadata.word?.toLowerCase().includes(lowerQuery) ||
					item.metadata.author?.toLowerCase().includes(lowerQuery)
			);
		}

		return items;
	}

	/**
	 * Get a specific dictionary item by ID
	 */
	async getItem(id: string): Promise<DictionaryItem | null> {
		const index = await this.getIndex();
		return index.items.find((item) => item.id === id) || null;
	}

	/**
	 * Refresh the dictionary index
	 */
	async refresh(): Promise<DictionaryIndex> {
		this.index = null;
		return this.loadIndex();
	}
}
