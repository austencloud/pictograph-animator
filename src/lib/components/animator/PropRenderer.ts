import type { PropState } from '../../types/sequence.js';
import { STAFF_CENTER_X, STAFF_CENTER_Y, STAFF_VIEWBOX_WIDTH, STAFF_VIEWBOX_HEIGHT } from '../../utils/gridMapping.js';

/**
 * Utility class for rendering staff props on a canvas
 */
export class PropRenderer {
  /**
   * Draws a staff with the given state
   */
  static drawStaff(
    ctx: CanvasRenderingContext2D,
    staffImage: HTMLImageElement,
    propState: PropState,
    width: number,
    height: number,
    scaledHalfwayRadius: number,
    gridScaleFactor: number
  ) {
    if (!ctx) return;

    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate position based on centerPathAngle and halfway radius
    const x = centerX + Math.cos(propState.centerPathAngle) * scaledHalfwayRadius;
    const y = centerY + Math.sin(propState.centerPathAngle) * scaledHalfwayRadius;

    // Calculate staff dimensions
    const staffWidth = STAFF_VIEWBOX_WIDTH * gridScaleFactor * 0.5; // Scale down for better visuals
    const staffHeight = STAFF_VIEWBOX_HEIGHT * gridScaleFactor * 0.5;

    // Save current context state
    ctx.save();

    // Translate to the prop's position
    ctx.translate(x, y);

    // Rotate by the staff rotation angle
    ctx.rotate(propState.staffRotationAngle);

    // Draw the staff centered on its rotation point
    ctx.drawImage(
      staffImage,
      -STAFF_CENTER_X * gridScaleFactor * 0.5, // Adjust for the staff's center point
      -STAFF_CENTER_Y * gridScaleFactor * 0.5,
      staffWidth,
      staffHeight
    );

    // Restore context state
    ctx.restore();
  }

  /**
   * Draws the grid image on the canvas
   */
  static drawGrid(
    ctx: CanvasRenderingContext2D,
    gridImage: HTMLImageElement,
    width: number,
    height: number,
    canvasSize: number
  ) {
    if (!ctx) return;

    // Draw grid centered in the canvas
    const gridX = (width - canvasSize) / 2;
    const gridY = (height - canvasSize) / 2;
    ctx.drawImage(gridImage, gridX, gridY, canvasSize, canvasSize);
  }

  /**
   * Draws an error message on the canvas
   */
  static drawErrorMessage(
    ctx: CanvasRenderingContext2D,
    errorMessage: string,
    width: number,
    height: number
  ) {
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'red';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(errorMessage, width / 2, height / 2);
  }
}
