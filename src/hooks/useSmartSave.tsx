import { useState, useCallback } from 'react';
import { PlateService } from '../services/plateService';
import type { SaveItemParams, SavedItem, PlateResponse } from '../types/plate';

interface DuplicateCheckResult {
  exactDuplicate: SavedItem | null;
  similarItems: SavedItem[];
  shouldWarn: boolean;
}

interface SmartSaveState {
  isChecking: boolean;
  isSaving: boolean;
  isAlreadySaved: boolean;
  duplicateCheck: DuplicateCheckResult | null;
  error: string | null;
  savedItem: SavedItem | null;
}

interface SmartSaveResult {
  state: SmartSaveState;
  saveToPlate: (params: SaveItemParams, options?: { 
    skipDuplicateCheck?: boolean;
    forceSave?: boolean;
  }) => Promise<boolean>;
  checkForDuplicates: (params: SaveItemParams) => Promise<DuplicateCheckResult | null>;
  resetState: () => void;
  confirmSave: (params: SaveItemParams) => Promise<boolean>;
}

/**
 * Smart save hook with duplicate detection and user experience enhancements
 */
export function useSmartSave(): SmartSaveResult {
  const [state, setState] = useState<SmartSaveState>({
    isChecking: false,
    isSaving: false,
    isAlreadySaved: false,
    duplicateCheck: null,
    error: null,
    savedItem: null
  });

  const resetState = useCallback(() => {
    setState({
      isChecking: false,
      isSaving: false,
      isAlreadySaved: false,
      duplicateCheck: null,
      error: null,
      savedItem: null
    });
  }, []);

  const checkForDuplicates = useCallback(async (params: SaveItemParams): Promise<DuplicateCheckResult | null> => {
    try {
      setState(prev => ({ ...prev, isChecking: true, error: null }));
      
      const duplicateCheck = await PlateService.checkForDuplicates(
        params.itemId,
        params.itemType,
        params.metadata
      );
      
      setState(prev => ({ 
        ...prev, 
        isChecking: false,
        duplicateCheck,
        isAlreadySaved: !!duplicateCheck.exactDuplicate
      }));
      
      return duplicateCheck;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check for duplicates';
      setState(prev => ({ 
        ...prev, 
        isChecking: false, 
        error: errorMessage 
      }));
      return null;
    }
  }, []);

  const saveToPlate = useCallback(async (
    params: SaveItemParams, 
    options: { skipDuplicateCheck?: boolean; forceSave?: boolean } = {}
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isSaving: true, error: null }));
      
      let result: PlateResponse<SavedItem> & {
        isDuplicate?: boolean;
        similarItems?: SavedItem[];
        duplicateCheck?: DuplicateCheckResult;
      };

      if (options.skipDuplicateCheck || options.forceSave) {
        // Use regular save if skipping duplicate check or forcing save
        result = await PlateService.saveToPlate(params);
      } else {
        // Use enhanced save with duplicate detection
        result = await PlateService.saveToPlateEnhanced(params);
      }
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          isAlreadySaved: !!result.isDuplicate,
          duplicateCheck: result.duplicateCheck || null,
          savedItem: result.data
        }));
        
        console.log('✅ Item saved successfully:', {
          itemType: params.itemType,
          itemId: params.itemId,
          isDuplicate: result.isDuplicate,
          similarItemsCount: result.duplicateCheck?.similarItems.length || 0
        });
        
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isSaving: false,
          error: result.error || 'Failed to save item'
        }));
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  const confirmSave = useCallback(async (params: SaveItemParams): Promise<boolean> => {
    // Force save even if duplicates exist (user confirmed)
    return await saveToPlate(params, { forceSave: true });
  }, [saveToPlate]);

  return {
    state,
    saveToPlate,
    checkForDuplicates,
    resetState,
    confirmSave
  };
}

/**
 * Hook for batch duplicate analysis
 */
export function useDuplicateAnalysis() {
  const [analysisState, setAnalysisState] = useState<{
    isLoading: boolean;
    data: {
      totalItems: number;
      potentialDuplicates: number;
      duplicateGroups: Array<{
        items: SavedItem[];
        similarity: number;
        type: 'exact' | 'similar';
      }>;
    } | null;
    error: string | null;
  }>({
    isLoading: false,
    data: null,
    error: null
  });

  const analyzeDuplicates = useCallback(async () => {
    try {
      setAnalysisState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await PlateService.getDuplicateAnalysis();
      
      if (result.success && result.data) {
        setAnalysisState({
          isLoading: false,
          data: result.data,
          error: null
        });
      } else {
        setAnalysisState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Failed to analyze duplicates'
        }));
      }
    } catch (error) {
      setAnalysisState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }));
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setAnalysisState({
      isLoading: false,
      data: null,
      error: null
    });
  }, []);

  return {
    ...analysisState,
    analyzeDuplicates,
    resetAnalysis
  };
}