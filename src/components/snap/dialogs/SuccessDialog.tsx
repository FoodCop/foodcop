import { X } from 'lucide-react';
import { Button } from '../../ui/button';
import type { SnapCard, SnapTag } from '../../../types/snap';

interface SuccessDialogProps {
  readonly card?: SnapCard;
  readonly imageUrl?: string;
  readonly caption?: string;
  readonly tags?: SnapTag[];
  readonly pointsEarned: number;
  readonly onViewInPlate: () => void;
  readonly onDone: () => void;
}

export function SuccessDialog({
  card,
  tags,
  pointsEarned,
  onViewInPlate,
  onDone
}: SuccessDialogProps) {
  const displayTags = card?.tags || tags || [];
  const tagBreakdown = displayTags.map((t: SnapTag) => `${t.label} (+${t.pointValue})`).join(', ');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-8 space-y-6 text-center">
        {/* Close button */}
        <button
          onClick={onDone}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Success header */}
        <div className="space-y-2">
          <h2 className="font-[Poppins] font-bold text-2xl text-gray-900">Saved! 🎉</h2>
          <p className="text-gray-600">Your food photo is now in your Plate</p>
        </div>

        {/* Points display */}
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-[#FFC909] to-[#E6B508] text-white rounded-full font-semibold">
          <span className="text-xl">🏆</span>
          <span>+{pointsEarned} Points</span>
        </div>

        {/* Tag breakdown */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-2">Tags earned:</p>
          <p className="text-sm text-gray-800">{tagBreakdown}</p>
        </div>

        {/* Caption preview */}
        {card.caption && (
          <div className="text-left">
            <p className="text-xs text-gray-500 mb-2">Your caption:</p>
            <p className="text-sm text-gray-700 italic">"{card.caption}"</p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={onViewInPlate}
            className="w-full bg-linear-to-r from-[#FFC909] to-[#E6B508] text-white"
          >
            View in Plate
          </Button>
          <Button
            variant="outline"
            onClick={onDone}
            className="w-full"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
