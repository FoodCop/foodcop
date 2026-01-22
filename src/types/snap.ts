/**
 * SNAP Feature Types
 * 
 * Complete type definitions for the SNAP food photography feature,
 * including image metadata, tags, cards, and workflow states.
 */

/**
 * Raw image metadata captured or uploaded
 */
export interface ImageMetadata {
  imageData: string;        // Base64 encoded image data
  latitude: number | null;  // GPS latitude
  longitude: number | null; // GPS longitude
  timestamp: Date;          // When image was taken/uploaded
  accuracy: number | null;  // GPS accuracy in meters
  source: 'camera' | 'gallery';
  fileName?: string;        // Original file name from gallery
}

/**
 * User-added tag with associated points
 */
export interface SnapTag {
  id: string;
  label: string;
  category: 'cuisine' | 'dish' | 'restaurant' | 'ambiance' | 'custom';
  pointValue: number;  // 5, 10, or 15
  iconClass?: string;  // Font Awesome class if applicable
}

/**
 * Formatted card ready for feed display
 */
export interface SnapCard {
  id: string;
  imageUrl: string;           // Processed/optimized image URL or data URL
  imageData: string;          // Original base64 (for fallback)
  caption: string;
  tags: SnapTag[];
  pointsEarned: number;
  author: {
    userId: string;
    displayName: string;
    avatar: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    address?: string;          // Optional: reverse geocoded address
  };
  createdAt: Date;
  publishedTo: 'plate' | 'feed' | null;
  metadata?: {
    // Additional metadata for future features
    contentModeration?: boolean;
    aiTags?: string[];         // AI-detected tags
    imageQualityScore?: number; // 0-100
  };
}

/**
 * Workflow step types
 */
export type WorkflowStep = 'input' | 'tag' | 'format' | 'publish' | 'success';

/**
 * Workflow state
 */
export interface SnapWorkflowState {
  // Image input
  imageSource: 'camera' | 'gallery' | null;
  imageMetadata: ImageMetadata | null;
  
  // Tagging
  tags: SnapTag[];
  pointsEarned: number;
  
  // Card
  cardPreview: SnapCard | null;
  caption?: string;
  
  // Publishing
  publishTarget: 'plate' | 'feed' | null;
  isPublished: boolean;
  publishedCardId?: string;
  
  // Flow control
  currentStep: WorkflowStep;
  isLoading: boolean;
  error: string | null;
}

/**
 * Notification for points display
 */
export interface PointsNotification {
  title: string;
  description: string;
  icon: string;
  pointValue: number;
}

/**
 * For tracking user points
 */
export interface UserSnapStats {
  totalSnaps: number;
  totalPointsEarned: number;
  averagePointsPerSnap: number;
  lastSnapDate: Date | null;
  mostUsedTag?: string;
}

/**
 * Hook return type
 */
export interface UseSnapWorkflowReturn extends SnapWorkflowState {
  // Setters
  setImageMetadata: (metadata: ImageMetadata) => void;
  setTags: (tags: SnapTag[]) => void;
  setCardPreview: (card: SnapCard) => void;
  updateCardCaption: (caption: string) => void;
  setPublishTarget: (target: 'plate' | 'feed') => void;
  
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  
  // Publishing
  publish: (userId: string, target: 'plate' | 'feed') => Promise<boolean>;
  
  // Utility
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  stepProgress: () => { current: number; total: number };
}
