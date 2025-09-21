import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface SaveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  itemName?: string;
  itemType?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function SaveConfirmDialog({
  open,
  onOpenChange,
  title = "Save to Plate?",
  itemName,
  itemType,
  onConfirm,
  onCancel,
  loading = false,
}: SaveConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus management
  useEffect(() => {
    if (open && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onCancel();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onCancel]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-dialog-title"
      aria-describedby="save-dialog-description"
    >
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl p-6 m-4 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            id="save-dialog-title"
            className="text-xl font-bold text-[#0B1F3A]"
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Close dialog"
            disabled={loading}
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p id="save-dialog-description" className="text-gray-600 mb-2">
            {itemName && itemType ? (
              <>
                Save{" "}
                <span className="font-semibold text-[#0B1F3A]">{itemName}</span>{" "}
                <span className="text-[#F14C35]">({itemType})</span> to your
                Plate?
              </>
            ) : (
              "Save this item to your Plate?"
            )}
          </p>
          <p className="text-sm text-gray-500">
            You can view and manage all your saved items in the Plate section.
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[#F14C35] text-white rounded-xl hover:bg-[#E03A28] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              "Save to Plate"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
