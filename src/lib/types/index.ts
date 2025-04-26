/**
 * Represents a single frame in a pictograph animation
 */
export interface PictographFrame {
  /** Unique identifier for the frame */
  id: string;
  /** SVG content or path to SVG file */
  content: string;
  /** Duration to display this frame in milliseconds */
  duration: number;
  /** Optional metadata for the frame */
  metadata?: Record<string, any>;
}

/**
 * Represents a complete pictograph animation sequence
 */
export interface Pictograph {
  /** Unique identifier for the pictograph */
  id: string;
  /** Name of the pictograph */
  name: string;
  /** Array of frames that make up the animation */
  frames: PictographFrame[];
  /** Default playback speed multiplier (1.0 = normal speed) */
  speed?: number;
  /** Whether the animation should loop by default */
  loop?: boolean;
  /** Optional metadata for the pictograph */
  metadata?: Record<string, any>;
}

/**
 * Configuration options for the pictograph animator
 */
export interface AnimatorConfig {
  /** Auto-play the animation on mount */
  autoplay?: boolean;
  /** Loop the animation */
  loop?: boolean;
  /** Playback speed multiplier */
  speed?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback when animation starts */
  onStart?: () => void;
  /** Callback when frame changes */
  onFrameChange?: (frameIndex: number) => void;
}

/**
 * Animation state
 */
export interface AnimationState {
  /** Current frame index */
  currentFrameIndex: number;
  /** Whether animation is currently playing */
  isPlaying: boolean;
  /** Current playback speed */
  speed: number;
  /** Whether animation is looping */
  loop: boolean;
  /** Total number of frames */
  totalFrames: number;
}
