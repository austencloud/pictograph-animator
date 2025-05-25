/**
 * PNG file parsing utilities for extracting sequence metadata
 */

import type { SequenceData } from '../../types/core.js';
import { ANIMATION_CONSTANTS } from '../../constants/animation.js';

export interface PNGParseResult {
	success: boolean;
	data?: SequenceData;
	error?: string;
}

export async function extractSequenceFromPNG(file: File): Promise<PNGParseResult> {
	try {
		const arrayBuffer = await readFileAsArrayBuffer(file);
		const uint8Array = new Uint8Array(arrayBuffer);

		const metadata = parsePNGMetadata(uint8Array);
		if (metadata && metadata.sequence) {
			return {
				success: true,
				data: metadata.sequence as SequenceData
			};
		} else {
			return {
				success: false,
				error: 'No sequence metadata found in PNG file'
			};
		}
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error parsing PNG'
		};
	}
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (e) => {
			const result = e.target?.result as ArrayBuffer;
			if (result) {
				resolve(result);
			} else {
				reject(new Error('Failed to read file'));
			}
		};

		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsArrayBuffer(file);
	});
}

interface PNGMetadata {
	sequence?: SequenceData;
	[key: string]: unknown;
}

function parsePNGMetadata(data: Uint8Array): PNGMetadata | null {
	// Verify PNG signature using constants
	const pngSignature = ANIMATION_CONSTANTS.PNG_SIGNATURE;
	for (let i = 0; i < pngSignature.length; i++) {
		if (data[i] !== pngSignature[i]) {
			throw new Error('Invalid PNG file');
		}
	}

	let offset = 8; // Skip PNG signature

	while (offset < data.length) {
		// Read chunk length (4 bytes, big-endian)
		const length =
			(data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
		offset += 4;

		// Read chunk type (4 bytes)
		const type = String.fromCharCode(
			data[offset],
			data[offset + 1],
			data[offset + 2],
			data[offset + 3]
		);
		offset += 4;

		if (type === 'tEXt') {
			// Parse text chunk
			const textData = data.slice(offset, offset + length);
			const textString = new TextDecoder('latin1').decode(textData);
			const nullIndex = textString.indexOf('\0');

			if (nullIndex !== -1) {
				const keyword = textString.substring(0, nullIndex);
				const text = textString.substring(nullIndex + 1);

				if (keyword === ANIMATION_CONSTANTS.METADATA_KEYWORD) {
					try {
						return JSON.parse(text);
					} catch (e) {
						console.warn('Failed to parse metadata JSON:', e);
					}
				}
			}
		}

		// Skip chunk data and CRC (4 bytes)
		offset += length + 4;

		// Stop at IEND chunk
		if (type === 'IEND') {
			break;
		}
	}

	return null;
}
