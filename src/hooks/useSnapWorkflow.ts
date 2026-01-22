import { useState, useCallback, useRef } from 'react';
import type {
  SnapWorkflowState,
  ImageMetadata,
  SnapTag,
  SnapCard,
  WorkflowStep,
  UseSnapWorkflowReturn
} from '../types/snap';
import { snapPublishService } from '../services/snapPublishService';

const initialState: SnapWorkflowState = {
  imageSource: null,
  imageMetadata: null,
  tags: [],
  pointsEarned: 0,
  cardPreview: null,
  publishTarget: null,
  isPublished: false,
  currentStep: 'input',
  isLoading: false,
  error: null
};

export function useSnapWorkflow(): UseSnapWorkflowReturn {
  const [state, setState] = useState<SnapWorkflowState>(initialState);
  const historyRef = useRef<WorkflowStep[]>([]);

  // Setters
  const setImageMetadata = useCallback((metadata: ImageMetadata) => {
    setState(prev => ({
      ...prev,
      imageMetadata: metadata,
      imageSource: metadata.source
    }));
  }, []);

  const setTags = useCallback((tags: SnapTag[]) => {
    const pointsEarned = tags.reduce((total, tag) => total + tag.pointValue, 0);
    setState(prev => ({
      ...prev,
      tags,
      pointsEarned
    }));
  }, []);

  const setCardPreview = useCallback((card: SnapCard) => {
    setState(prev => ({
      ...prev,
      cardPreview: card
    }));
  }, []);

  const updateCardCaption = useCallback((caption: string) => {
    setState(prev => {
      if (!prev.cardPreview) return prev;
      return {
        ...prev,
        cardPreview: {
          ...prev.cardPreview,
          caption
        }
      };
    });
  }, []);

  const setPublishTarget = useCallback((target: 'plate' | 'feed') => {
    setState(prev => ({
      ...prev,
      publishTarget: target
    }));
  }, []);

  // Navigation
  const nextStep = useCallback(() => {
    setState(prev => {
      const steps: WorkflowStep[] = ['input', 'tag', 'format', 'publish', 'success'];
      const currentIndex = steps.indexOf(prev.currentStep);
      
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        historyRef.current.push(nextStep);
        return {
          ...prev,
          currentStep: nextStep,
          error: null // Clear errors on step change
        };
      }
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => {
      const steps: WorkflowStep[] = ['input', 'tag', 'format', 'publish', 'success'];
      const currentIndex = steps.indexOf(prev.currentStep);
      
      if (currentIndex > 0) {
        const prevStep = steps[currentIndex - 1];
        historyRef.current = historyRef.current.slice(0, -1);
        return {
          ...prev,
          currentStep: prevStep,
          error: null // Clear errors on step change
        };
      }
      return prev;
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    historyRef.current = [];
  }, []);

  // Publishing
  const publish = useCallback(async (userId: string, target: 'plate' | 'feed') => {
    if (!state.cardPreview) {
      setState(prev => ({ ...prev, error: 'No card to publish' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      let result;
      if (target === 'plate') {
        result = await snapPublishService.publishToPlate(state.cardPreview, userId);
      } else {
        result = await snapPublishService.publishToFeed(state.cardPreview, userId);
      }

      if (!result.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Publication failed'
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isPublished: true,
        publishTarget: target,
        publishedCardId: result.postId || result.feedCardId,
        currentStep: 'success'
      }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
      return false;
    }
  }, [state.cardPreview]);

  // Utility functions
  const canGoBack = useCallback(() => {
    return state.currentStep !== 'input';
  }, [state.currentStep]);

  const canGoForward = useCallback(() => {
    return state.currentStep !== 'success';
  }, [state.currentStep]);

  const stepProgress = useCallback(() => {
    const steps = ['input', 'tag', 'format', 'publish', 'success'];
    return {
      current: steps.indexOf(state.currentStep) + 1,
      total: steps.length
    };
  }, [state.currentStep]);

  // Return state and methods
  return {
    ...state,
    
    // Setters
    setImageMetadata,
    setTags,
    setCardPreview,
    updateCardCaption,
    setPublishTarget,
    
    // Navigation
    nextStep,
    prevStep,
    reset,
    
    // Publishing
    publish,
    
    // Utility
    canGoBack,
    canGoForward,
    stepProgress
  };
}
