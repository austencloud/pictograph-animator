import type { Pictograph, PictographFrame } from '../types';

/**
 * Validates a pictograph object to ensure it has all required properties
 * @param pictograph The pictograph to validate
 * @returns True if valid, false otherwise
 */
export function validatePictograph(pictograph: Partial<Pictograph>): boolean {
  if (!pictograph) return false;
  if (!pictograph.id) return false;
  if (!pictograph.name) return false;
  if (!Array.isArray(pictograph.frames) || pictograph.frames.length === 0) return false;
  
  // Validate each frame
  for (const frame of pictograph.frames) {
    if (!validateFrame(frame)) return false;
  }
  
  return true;
}

/**
 * Validates a pictograph frame
 * @param frame The frame to validate
 * @returns True if valid, false otherwise
 */
export function validateFrame(frame: Partial<PictographFrame>): boolean {
  if (!frame) return false;
  if (!frame.id) return false;
  if (!frame.content) return false;
  if (typeof frame.duration !== 'number' || frame.duration <= 0) return false;
  
  return true;
}

/**
 * Calculates the total duration of a pictograph animation
 * @param pictograph The pictograph
 * @param speed Optional speed multiplier
 * @returns Total duration in milliseconds
 */
export function calculateTotalDuration(pictograph: Pictograph, speed = 1): number {
  if (!pictograph || !pictograph.frames) return 0;
  
  return pictograph.frames.reduce((total, frame) => total + frame.duration, 0) / speed;
}

/**
 * Determines if content is an SVG string or a path to an SVG file
 * @param content The content to check
 * @returns True if content is an SVG string, false if it's a path
 */
export function isSvgContent(content: string): boolean {
  return content.trim().startsWith('<svg') || content.trim().startsWith('<?xml');
}

/**
 * Calculates the frame index at a specific time point in the animation
 * @param pictograph The pictograph
 * @param timeMs Current time in milliseconds
 * @param speed Speed multiplier
 * @returns The index of the frame that should be displayed
 */
export function getFrameAtTime(pictograph: Pictograph, timeMs: number, speed = 1): number {
  if (!pictograph || !pictograph.frames || pictograph.frames.length === 0) return 0;
  
  const adjustedTime = timeMs * speed;
  let elapsedTime = 0;
  
  for (let i = 0; i < pictograph.frames.length; i++) {
    elapsedTime += pictograph.frames[i].duration;
    if (adjustedTime < elapsedTime) {
      return i;
    }
  }
  
  return pictograph.frames.length - 1;
}

/**
 * Creates a delay promise for animation timing
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
