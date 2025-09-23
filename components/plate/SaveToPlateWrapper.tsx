import { motion } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ItemType,
  ensureRemoved,
  ensureSaved,
  isItemSaved,
} from "../../src/lib/plate";
import { useToast } from "../ui/Toast";
import { SaveConfirmDialog } from "./SaveConfirmDialog";

interface SaveToPlateWrapperProps {
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
  tenantId?: string;
  userId?: string;
}

export function SaveToPlateWrapper({
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
  tenantId = "default-tenant", // Default tenant for single-tenant apps
  userId,
}: SaveToPlateWrapperProps) {
  const [isSaved, setIsSaved] = useState(defaultSaved);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(true);
  const { showSuccess, showError } = useToast();

  // Check if item is already saved on mount
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!userId) return;

      try {
        const saved = await isItemSaved({
          tenantId,
          userId,
          itemType,
          itemId,
        });
        setIsSaved(saved);
      } catch (error) {
        console.error("Error checking saved status:", error);
      } finally {
        setCheckingSaved(false);
      }
    };

    checkSavedStatus();
  }, [itemId, itemType, tenantId, userId]);

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
    if (!userId) {
      showError("Authentication required", "Please sign in to save items");
      return;
    }

    setLoading(true);
    try {
      console.log("🔄 SaveToPlate: Starting save operation", {
        itemId,
        itemType,
        title,
        tenantId,
        userId,
      });

      await ensureSaved({
        tenantId,
        userId,
        itemType,
        itemId,
        meta: {
          title,
          imageUrl,
          saved_at: new Date().toISOString(),
        },
      });

      console.log("✅ SaveToPlate: Successfully saved to plate");
      setIsSaved(true);
      setShowDialog(false);
      onSaved?.();

      // Show success toast
      showSuccess(
        "Saved to your Plate!",
        title ? `${title} has been saved` : "Item saved successfully"
      );
    } catch (error) {
      console.error("❌ SaveToPlate: Error saving to plate:", error);
      // Show error toast
      showError("Failed to save to Plate", "Please try again later");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async () => {
    if (!userId) {
      showError(
        "Authentication required",
        "Please sign in to manage your saved items"
      );
      return;
    }

    setLoading(true);
    try {
      await ensureRemoved({
        tenantId,
        userId,
        itemType,
        itemId,
      });

      setIsSaved(false);
      onUnsaved?.();

      // Show success toast
      showSuccess(
        "Removed from your Plate",
        title ? `${title} has been removed` : "Item removed successfully"
      );
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

