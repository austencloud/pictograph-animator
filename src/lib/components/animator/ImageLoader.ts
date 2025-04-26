/**
 * Utility for loading SVG images for the animator
 */
export class ImageLoader {
  // SVG strings for grid and staff
  static readonly gridSvgString = `
    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
         viewBox="0 0 950 950" style="enable-background:new 0 0 950 950; background-color: #ffffff;" xml:space="preserve">
    <g id="outer_points"><circle fill="#000000" cx="475" cy="175" r="25"/><circle fill="#000000" cx="775" cy="475" r="25"/><circle fill="#000000" cx="475" cy="775" r="25"/><circle fill="#000000" cx="175" cy="475" r="25"/></g>
    <g id="halfway_points"><circle fill="#000000" cx="475" cy="323.5" r="8"/><circle fill="#000000" cx="626.5" cy="475" r="8"/><circle fill="#000000" cx="475" cy="626.5" r="8"/><circle fill="#000000" cx="323.5" cy="475" r="8"/></g>
    <g id="center_group"><circle fill="#000000" cx="475" cy="475" r="12"/></g>
    </svg>
  `;

  static readonly staffBaseSvgString = (fillColor: string) => `
    <svg version="1.1" id="staff" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
         viewBox="0 0 252.8 77.8" style="enable-background:new 0 0 252.8 77.8;" xml:space="preserve">
    <path fill="${fillColor}" stroke="#555555" stroke-width="1" stroke-miterlimit="10" d="M251.4,67.7V10.1c0-4.8-4.1-8.7-9.1-8.7s-9.1,3.9-9.1,8.7v19.2H10.3c-4.9,0-8.9,3.8-8.9,8.5V41 c0,4.6,4,8.5,8.9,8.5h222.9v18.2c0,4.8,4.1,8.7,9.1,8.7S251.4,72.5,251.4,67.7z"/>
    <circle id="centerPoint" fill="#FF0000" cx="126.4" cy="38.9" r="5" />
    </svg>
  `;

  static readonly blueColor = '#0072BC'; // CMYK Blue Approx for Blue Prop
  static readonly redColor = '#ED1C24';  // CMYK Red Approx for Red Prop

  /**
   * Loads all required images from SVG strings
   * @returns Promise that resolves when all images are loaded
   */
  static loadImages(): Promise<{
    gridImage: HTMLImageElement;
    blueStaffImage: HTMLImageElement;
    redStaffImage: HTMLImageElement;
  }> {
    return new Promise((resolve, reject) => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        reject(new Error('Cannot load images in non-browser environment'));
        return;
      }

      // Initialize Image objects
      const gridImage = new Image();
      const blueStaffImage = new Image();
      const redStaffImage = new Image();

      // Convert SVG strings to data URLs
      const gridSvgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.gridSvgString);
      const blueStaffSvgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.staffBaseSvgString(this.blueColor));
      const redStaffSvgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this.staffBaseSvgString(this.redColor));

      let loadedCount = 0;
      const totalImages = 3;

      // Function to check if all images are loaded
      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          resolve({
            gridImage,
            blueStaffImage,
            redStaffImage
          });
        }
      };

      // Load grid image
      gridImage.onload = checkAllLoaded;
      gridImage.onerror = () => reject(new Error('Failed to load grid image'));
      gridImage.src = gridSvgDataUrl;

      // Load blue staff image
      blueStaffImage.onload = checkAllLoaded;
      blueStaffImage.onerror = () => reject(new Error('Failed to load blue staff image'));
      blueStaffImage.src = blueStaffSvgDataUrl;

      // Load red staff image
      redStaffImage.onload = checkAllLoaded;
      redStaffImage.onerror = () => reject(new Error('Failed to load red staff image'));
      redStaffImage.src = redStaffSvgDataUrl;
    });
  }
}
