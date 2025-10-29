import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Save, 
  Eye,
  X
} from 'lucide-react';
import { useSmartSave } from '../../hooks/useSmartSave';
import type { SaveItemParams, SavedItem } from '../../types/plate';

interface SmartSaveButtonProps {
  item: any;
  itemType: 'restaurant' | 'recipe' | 'photo' | 'video' | 'other';
  metadata?: Record<string, unknown>;
  onSaveSuccess?: (savedItem: SavedItem, isDuplicate: boolean) => void;
  onSaveError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  showDuplicatePreview?: boolean;
}

export function SmartSaveButton({
  item,
  itemType,
  metadata,
  onSaveSuccess,
  onSaveError,
  className = '',
  variant = 'default',
  size = 'default',
  showDuplicatePreview = true
}: SmartSaveButtonProps) {
  const { state, saveToPlate, checkForDuplicates, resetState, confirmSave } = useSmartSave();
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  
  // Reset state when item changes
  useEffect(() => {
    resetState();
  }, [item.id, itemType, resetState]);

  const handleSaveClick = async () => {
    const params: SaveItemParams = {
      itemId: item.id || item.item_id,
      itemType,
      metadata: metadata || item
    };

    // If we already have duplicate check results and they show similar items, show dialog
    if (state.duplicateCheck?.shouldWarn && showDuplicatePreview) {
      setShowDuplicateDialog(true);
      return;
    }

    const success = await saveToPlate(params);
    
    if (success && state.savedItem) {
      onSaveSuccess?.(state.savedItem, state.isAlreadySaved);
      
      // If we found similar items after save, show the dialog
      if (state.duplicateCheck?.similarItems.length && showDuplicatePreview) {
        setShowDuplicateDialog(true);
      }
    } else if (state.error) {
      onSaveError?.(state.error);
    }
  };

  const handleConfirmSave = async () => {
    const params: SaveItemParams = {
      itemId: item.id || item.item_id,
      itemType,
      metadata: metadata || item
    };

    const success = await confirmSave(params);
    setShowDuplicateDialog(false);
    
    if (success && state.savedItem) {
      onSaveSuccess?.(state.savedItem, false);
    } else if (state.error) {
      onSaveError?.(state.error);
    }
  };

  const getButtonContent = () => {
    if (state.isChecking || state.isSaving) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {state.isChecking ? 'Checking...' : 'Saving...'}
        </>
      );
    }

    if (state.isAlreadySaved) {
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          Already Saved
        </>
      );
    }

    return (
      <>
        <Save className="w-4 h-4" />
        Save to Plate
      </>
    );
  };

  const getButtonVariant = () => {
    if (state.isAlreadySaved) return 'outline';
    if (state.duplicateCheck?.shouldWarn) return 'secondary';
    return variant;
  };

  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={handleSaveClick}
          disabled={state.isChecking || state.isSaving}
          variant={getButtonVariant()}
          size={size}
          className={`gap-2 ${className}`}
        >
          {getButtonContent()}
        </Button>

        {/* Duplicate Warning Alert */}
        {state.duplicateCheck?.shouldWarn && state.duplicateCheck.similarItems.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Found {state.duplicateCheck.similarItems.length} similar {itemType}(s) already saved.
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto ml-1 text-orange-700 underline"
                onClick={() => setShowDuplicateDialog(true)}
              >
                View details
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {state.error && (
          <Alert variant="destructive">
            <X className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Duplicate Confirmation Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Similar {itemType.charAt(0).toUpperCase() + itemType.slice(1)}s Found
            </DialogTitle>
            <DialogDescription>
              We found {state.duplicateCheck?.similarItems.length} similar {itemType}(s) in your saved items. 
              Would you still like to save this {itemType}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Item Preview */}
            <div>
              <h4 className="font-medium mb-2">Current {itemType}:</h4>
              <ItemPreviewCard item={item} itemType={itemType} isNew />
            </div>

            {/* Similar Items */}
            {state.duplicateCheck?.similarItems && state.duplicateCheck.similarItems.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Similar items already saved:</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {state.duplicateCheck.similarItems.map((similarItem, index) => (
                    <ItemPreviewCard
                      key={similarItem.id}
                      item={similarItem.metadata}
                      itemType={itemType}
                      savedDate={similarItem.created_at}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDuplicateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmSave} disabled={state.isSaving}>
              {state.isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Anyway
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ItemPreviewCardProps {
  item: any;
  itemType: string;
  isNew?: boolean;
  savedDate?: string;
}

function ItemPreviewCard({ item, itemType, isNew = false, savedDate }: ItemPreviewCardProps) {
  const getItemTitle = () => {
    return item.title || item.name || `Untitled ${itemType}`;
  };

  const getItemDescription = () => {
    switch (itemType) {
      case 'recipe':
        return item.summary || item.description || '';
      case 'restaurant':
        return item.formatted_address || item.address || item.vicinity || '';
      case 'video':
        return item.description || '';
      case 'photo':
        return item.description || item.restaurant_name || '';
      default:
        return item.description || '';
    }
  };

  const getItemImage = () => {
    return item.image || item.image_url || item.thumbnail || item.photo;
  };

  return (
    <Card className={`${isNew ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {getItemTitle()}
          </CardTitle>
          {isNew ? (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
              New
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
              Saved {savedDate ? new Date(savedDate).toLocaleDateString() : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-3">
          {getItemImage() && (
            <img
              src={getItemImage()}
              alt={getItemTitle()}
              className="w-16 h-16 object-cover rounded"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 line-clamp-2">
              {getItemDescription()}
            </p>
            {itemType === 'recipe' && item.readyInMinutes && (
              <p className="text-xs text-gray-500 mt-1">
                🕒 {item.readyInMinutes} minutes
              </p>
            )}
            {itemType === 'restaurant' && item.rating && (
              <p className="text-xs text-gray-500 mt-1">
                ⭐ {item.rating}/5
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}