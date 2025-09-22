import { motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { savedItemsService, ItemType } from "../services/savedItemsService";
import { useToast } from "../ui/Toast";
import { SaveConfirmDialog } from "./SaveConfirmDialog";

interface SaveToPlateProps {
  itemId: string;
  itemType: ItemType;
  title?: string;
  imageUrl?: string;
  variant?: "icon" | "button";
  defaultSaved?: boolean;
  onSaved?: () => void;
  onUnsaved?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SaveToPlate({
  itemId,
  itemType,
  title,
  imageUrl,
  variant = "icon",
  defaultSaved = false,
  onSaved,
  onUnsaved,
  className = "",
  size = "md",
}: SaveToPlateProps) {
  const [isSaved, setIsSaved] = useState(defaultSaved);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(true);
  const { showSuccess, showError } = useToast();

  // Check if item is already saved on mount
  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        const result = await savedItemsService.isItemSaved({
          itemId,
          itemType,
        });
        setIsSaved(result.isSaved);
      } catch (error) {
        console.error("Error checking saved status:", error);
      } finally {
        setCheckingSaved(false);
      }
    };

    checkSavedStatus();
  }, [itemId, itemType]);

  const handleClick = () => {
    if (isSaved) {
      // If already saved, show unsave confirmation or directly unsave
      handleUnsave();
    } else {
      // If not saved, show save confirmation
      setShowDialog(true);
    }
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    try {
      console.log("🔄 SaveToPlate: Starting save operation", {
        itemId,
        itemType,
        title,
      });

      const result = await savedItemsService.saveItem({
        itemId,
        itemType,
        metadata: {
          title,
          imageUrl,
          saved_at: new Date().toISOString(),
        },
      });

      if (result.success) {
        console.log("✅ SaveToPlate: Successfully saved to plate");
        setIsSaved(true);
        setShowDialog(false);
        onSaved?.();

        // Show success toast
        showSuccess(
          "Saved to your Plate!",
          title ? `${title} has been saved` : "Item saved successfully"
        );
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("❌ SaveToPlate: Error saving to plate:", error);
      // Show error toast
      showError("Failed to save to Plate", "Please try again later");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async () => {
    setLoading(true);
    try {
      const result = await savedItemsService.unsaveItem({
        itemId,
        itemType,
      });

      if (result.success) {
        setIsSaved(false);
        onUnsaved?.();

        // Show success toast
        showSuccess(
          "Removed from your Plate",
          title ? `${title} has been removed` : "Item removed successfully"
        );
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error removing from plate:", error);
      // Show error toast
      showError("Failed to remove from Plate", "Please try again later");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  // Size variants
  const sizeClasses = {
    sm: variant === "icon" ? "w-8 h-8" : "px-3 py-1.5 text-sm",
    md: variant === "icon" ? "w-10 h-10" : "px-4 py-2",
    lg: variant === "icon" ? "w-12 h-12" : "px-6 py-3 text-lg",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  // Button content
  const getButtonContent = () => {
    if (checkingSaved) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (variant === "icon") {
      return isSaved ? (
        <Heart className={`${iconSizes[size]} fill-current`} />
      ) : (
        <Plus className={`${iconSizes[size]}`} />
      );
    } else {
      return isSaved ? "Saved" : "Save to Plate";
    }
  };

  // Button styles
  const getButtonStyles = () => {
    const baseStyles =
      "flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    if (isSaved) {
      return `${baseStyles} bg-[#F14C35] text-white hover:bg-[#E03A28] focus:ring-[#F14C35]/50`;
    } else {
      return `${baseStyles} bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300`;
    }
  };

  return (
    <>
      <motion.button
        onClick={handleClick}
        disabled={loading || checkingSaved}
        className={`${getButtonStyles()} ${
          sizeClasses[size]
        } ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isSaved ? "Remove from Plate" : "Save to Plate"}
        title={isSaved ? "Remove from Plate" : "Save to Plate"}
      >
        {getButtonContent()}
      </motion.button>

      <SaveConfirmDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        title="Save to Plate?"
        itemName={title}
        itemType={itemType}
        onConfirm={handleConfirmSave}
        onCancel={handleCancel}
        loading={loading}
      />
    </>
  );
}
