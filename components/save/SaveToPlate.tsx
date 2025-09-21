import { Bookmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { savedItemsService } from "../services/savedItemsService";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export type ItemType = "restaurant" | "recipe" | "photo" | "other";

export interface SaveToPlateProps {
  itemId: string;
  itemType: ItemType;
  title?: string;
  imageUrl?: string;
  defaultSaved?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "button";
  onSaved?: () => void;
  className?: string;
}

export function SaveToPlate({
  itemId,
  itemType,
  title,
  imageUrl,
  defaultSaved = false,
  size = "md",
  variant = "icon",
  onSaved,
  className = "",
}: SaveToPlateProps) {
  const [isSaved, setIsSaved] = useState(defaultSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { user } = useAuth();

  const handleSaveClick = async () => {
    if (!user) {
      // TODO: Show login modal or redirect to sign-in
      toast.error("Please sign in to save items to your Plate");
      return;
    }

    if (isSaved) {
      // Already saved - could implement unsave functionality here
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setShowConfirmDialog(false);

    try {
      // Optimistic update
      setIsSaved(true);

      // Prepare metadata
      const metadata: Record<string, any> = {};
      if (title) metadata.title = title;
      if (imageUrl) metadata.image_url = imageUrl;

      // Save to backend
      const result = await savedItemsService.saveItem({
        itemId,
        itemType,
        metadata,
      });

      if (result.success) {
        toast.success("Saved to your Plate");
        onSaved?.();
      } else {
        // Rollback optimistic update on failure
        setIsSaved(false);
        toast.error(result.message || "Couldn't save. Please try again.");
      }
    } catch (error) {
      // Rollback optimistic update on error
      setIsSaved(false);
      console.error("Save to plate error:", error);
      toast.error("Couldn't save. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  // Size classes
  const sizeClasses = {
    sm: variant === "icon" ? "w-6 h-6" : "px-2 py-1 text-xs",
    md: variant === "icon" ? "w-8 h-8" : "px-3 py-2 text-sm",
    lg: variant === "icon" ? "w-10 h-10" : "px-4 py-3 text-base",
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const buttonContent =
    variant === "icon" ? (
      <Bookmark
        className={`${iconSizeClasses[size]} ${isSaved ? "fill-current" : ""}`}
      />
    ) : (
      <>
        <Bookmark
          className={`${iconSizeClasses[size]} mr-2 ${
            isSaved ? "fill-current" : ""
          }`}
        />
        {isSaved ? "Saved" : "Save"}
      </>
    );

  return (
    <>
      <Button
        variant={isSaved ? "default" : "outline"}
        size="sm"
        onClick={handleSaveClick}
        disabled={isLoading}
        className={`${sizeClasses[size]} ${className} ${
          isSaved
            ? "bg-[#F14C35] text-white border-[#F14C35] hover:bg-[#E63E26]"
            : "hover:bg-[#F14C35] hover:text-white hover:border-[#F14C35]"
        } transition-colors`}
        aria-label={isSaved ? "Saved to Plate" : "Save to Plate"}
      >
        {buttonContent}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Plate?</DialogTitle>
            <DialogDescription>
              {title
                ? `Save "${title}" to your Plate?`
                : `Save this ${itemType} to your Plate?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSave}
              disabled={isLoading}
              className="bg-[#F14C35] hover:bg-[#E63E26]"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Convenience components for different item types
export function SaveRestaurantToPlate({
  restaurantId,
  restaurantName,
  imageUrl,
  ...props
}: Omit<SaveToPlateProps, "itemId" | "itemType"> & {
  restaurantId: string;
  restaurantName?: string;
}) {
  return (
    <SaveToPlate
      itemId={restaurantId}
      itemType="restaurant"
      title={restaurantName}
      imageUrl={imageUrl}
      {...props}
    />
  );
}

export function SaveRecipeToPlate({
  recipeId,
  recipeTitle,
  imageUrl,
  ...props
}: Omit<SaveToPlateProps, "itemId" | "itemType"> & {
  recipeId: string;
  recipeTitle?: string;
}) {
  return (
    <SaveToPlate
      itemId={recipeId}
      itemType="recipe"
      title={recipeTitle}
      imageUrl={imageUrl}
      {...props}
    />
  );
}

export function SavePhotoToPlate({
  photoId,
  photoCaption,
  imageUrl,
  ...props
}: Omit<SaveToPlateProps, "itemId" | "itemType"> & {
  photoId: string;
  photoCaption?: string;
}) {
  return (
    <SaveToPlate
      itemId={photoId}
      itemType="photo"
      title={photoCaption}
      imageUrl={imageUrl}
      {...props}
    />
  );
}
