import { describe, it, expect } from 'vitest';
import {
	validatePictograph,
	validateFrame,
	calculateTotalDuration,
	isSvgContent,
	getFrameAtTime
} from './animation.js';
import type { Pictograph, PictographFrame } from '../types/index.js';

describe('Animation Utilities', () => {
	describe('validatePictograph', () => {
		it('should validate a valid pictograph', () => {
			const validPictograph: Pictograph = {
				id: 'test',
				name: 'Test Pictograph',
				frames: [
					{
						id: 'frame1',
						content: '<svg></svg>',
						duration: 1000
					}
				]
			};

			expect(validatePictograph(validPictograph)).toBe(true);
		});

		it('should reject a pictograph without id', () => {
			const invalidPictograph: Partial<Pictograph> = {
				name: 'Test Pictograph',
				frames: [
					{
						id: 'frame1',
						content: '<svg></svg>',
						duration: 1000
					}
				]
			};

			expect(validatePictograph(invalidPictograph)).toBe(false);
		});

		it('should reject a pictograph without frames', () => {
			const invalidPictograph: Partial<Pictograph> = {
				id: 'test',
				name: 'Test Pictograph',
				frames: []
			};

			expect(validatePictograph(invalidPictograph)).toBe(false);
		});

		it('should reject a pictograph with invalid frames', () => {
			const invalidPictograph: Pictograph = {
				id: 'test',
				name: 'Test Pictograph',
				frames: [
					{
						id: 'frame1',
						content: '<svg></svg>',
						duration: -1000 // Invalid duration
					}
				]
			};

			expect(validatePictograph(invalidPictograph)).toBe(false);
		});
	});

	describe('validateFrame', () => {
		it('should validate a valid frame', () => {
			const validFrame: PictographFrame = {
				id: 'frame1',
				content: '<svg></svg>',
				duration: 1000
			};

			expect(validateFrame(validFrame)).toBe(true);
		});

		it('should reject a frame without id', () => {
			const invalidFrame: Partial<PictographFrame> = {
				content: '<svg></svg>',
				duration: 1000
			};

			expect(validateFrame(invalidFrame)).toBe(false);
		});

		it('should reject a frame without content', () => {
			const invalidFrame: Partial<PictographFrame> = {
				id: 'frame1',
				duration: 1000
			};

			expect(validateFrame(invalidFrame)).toBe(false);
		});

		it('should reject a frame with invalid duration', () => {
			const invalidFrame: PictographFrame = {
				id: 'frame1',
				content: '<svg></svg>',
				duration: 0
			};

			expect(validateFrame(invalidFrame)).toBe(false);
		});
	});

	describe('calculateTotalDuration', () => {
		it('should calculate the total duration of a pictograph', () => {
			const pictograph: Pictograph = {
				id: 'test',
				name: 'Test Pictograph',
				frames: [
					{ id: 'frame1', content: '<svg></svg>', duration: 1000 },
					{ id: 'frame2', content: '<svg></svg>', duration: 2000 },
					{ id: 'frame3', content: '<svg></svg>', duration: 3000 }
				]
			};

			expect(calculateTotalDuration(pictograph)).toBe(6000);
		});

		it('should apply speed multiplier to total duration', () => {
			const pictograph: Pictograph = {
				id: 'test',
				name: 'Test Pictograph',
				frames: [
					{ id: 'frame1', content: '<svg></svg>', duration: 1000 },
					{ id: 'frame2', content: '<svg></svg>', duration: 2000 },
					{ id: 'frame3', content: '<svg></svg>', duration: 3000 }
				]
			};

			expect(calculateTotalDuration(pictograph, 2)).toBe(3000);
		});

		it('should return 0 for invalid pictograph', () => {
			expect(calculateTotalDuration(undefined as unknown as Pictograph)).toBe(0);
		});
	});

	describe('isSvgContent', () => {
		it('should identify SVG content', () => {
			expect(isSvgContent('<svg width="100" height="100"></svg>')).toBe(true);
			expect(isSvgContent('<?xml version="1.0"?><svg></svg>')).toBe(true);
		});

		it('should identify non-SVG content', () => {
			expect(isSvgContent('/path/to/image.svg')).toBe(false);
			expect(isSvgContent('not svg content')).toBe(false);
		});
	});

	describe('getFrameAtTime', () => {
		it('should return the correct frame index for a given time', () => {
			const pictograph: Pictograph = {
				id: 'test',
				name: 'Test Pictograph',
				frames: [
					{ id: 'frame1', content: '<svg></svg>', duration: 1000 },
					{ id: 'frame2', content: '<svg></svg>', duration: 2000 },
					{ id: 'frame3', content: '<svg></svg>', duration: 3000 }
				]
			};

			expect(getFrameAtTime(pictograph, 500)).toBe(0);
			expect(getFrameAtTime(pictograph, 1500)).toBe(1);
			expect(getFrameAtTime(pictograph, 3500)).toBe(2);
			expect(getFrameAtTime(pictograph, 7000)).toBe(2); // Past the end
		});

		it('should apply speed multiplier', () => {
			const pictograph: Pictograph = {
				id: 'test',
				name: 'Test Pictograph',
				frames: [
					{ id: 'frame1', content: '<svg></svg>', duration: 1000 },
					{ id: 'frame2', content: '<svg></svg>', duration: 2000 },
					{ id: 'frame3', content: '<svg></svg>', duration: 3000 }
				]
			};

			expect(getFrameAtTime(pictograph, 250, 2)).toBe(0);
			expect(getFrameAtTime(pictograph, 750, 2)).toBe(1);
			expect(getFrameAtTime(pictograph, 1750, 2)).toBe(2);
		});

		it('should handle invalid inputs', () => {
			expect(getFrameAtTime(undefined as unknown as Pictograph, 1000)).toBe(0);

			const emptyPictograph: Pictograph = {
				id: 'test',
				name: 'Test Pictograph',
				frames: []
			};
			expect(getFrameAtTime(emptyPictograph, 1000)).toBe(0);
		});
	});
});
