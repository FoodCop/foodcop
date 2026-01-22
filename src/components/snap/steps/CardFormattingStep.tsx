import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { MinimalHeader } from '../../common/MinimalHeader';
import { snapCardFormatter } from '../../../services/snapCardFormatter';
import type { SnapTag } from '../../../types/snap';

interface CardFormattingStepProps {
  imageUrl: string;
  tags: SnapTag[];
  onCardFormatted: (caption: string) => void;
  onBack: () => void;
  onCancel: () => void;
}

export function CardFormattingStep({
  imageUrl,
  tags,
  onCardFormatted,
  onBack,
  onCancel
}: CardFormattingStepProps) {
  const [caption, setCaption] = useState('');
  const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const optimizeImage = async () => {
      try {
        setIsProcessing(true);
        // Simulate the optimization process
        // In real implementation, snapCardFormatter would handle this
        // For now, we'll use the original image
        setOptimizedImage(imageUrl);
      } catch (error) {
        console.error('Failed to optimize image:', error);
        setOptimizedImage(imageUrl); // Fallback to original
      } finally {
        setIsProcessing(false);
      }
    };

    optimizeImage();
  }, [imageUrl]);

  const handleSubmit = () => {
    if (!caption.trim()) return;
    onCardFormatted(caption.trim());
  };

  const charCount = caption.length;
  const charLimit = 200;
  const isValid = charCount > 0 && charCount <= charLimit;

  return (
    <div className="w-full max-w-[375px] mx-auto bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="py-3 px-5 border-b">
        <h2 className="font-semibold text-gray-900">Format Your Card</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-24">
        {/* Processing state */}
        {isProcessing && (
          <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-blue-600 rounded-full" />
            <p className="text-sm text-blue-700">Optimizing your image...</p>
          </div>
        )}

        {/* Card preview */}
        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <div className="aspect-square relative bg-gray-100">
            {optimizedImage ? (
              <img
                src={optimizedImage}
                alt="Formatted card preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading...</div>
              </div>
            )}
          </div>
          <div className="p-4 bg-white">
            <div className="space-y-3">
              {/* Tags display */}
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                  >
                    {tag.label}
                    <span className="font-bold">+{tag.pointValue}</span>
                  </span>
                ))}
              </div>

              {/* Caption preview */}
              <div className="text-sm text-gray-700 leading-relaxed">
                {caption || 'Your caption will appear here...'}
              </div>

              {/* Points summary */}
              <div className="text-xs text-gray-500 font-medium">
                Total Points: {tags.reduce((sum, tag) => sum + tag.pointValue, 0)} 🎯
              </div>
            </div>
          </div>
        </div>

        {/* Caption input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block font-semibold text-gray-900">
              Caption
            </label>
            <span className={`text-xs font-medium ${
              charCount > charLimit - 20 ? 'text-red-600' : 'text-gray-500'
            }`}>
              {charCount}/{charLimit}
            </span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, charLimit))}
            placeholder="Describe your food experience..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC909] resize-none"
          />
          <p className="mt-2 text-xs text-gray-500">
            Tips: Be descriptive, mention flavors, and share what made it special!
          </p>
        </div>

        {/* Guidelines */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm">Card Guidelines</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Keep captions under 200 characters</li>
            <li>✓ Include specific dish names when possible</li>
            <li>✓ Mention restaurant or location if relevant</li>
            <li>✓ Share your honest impression</li>
          </ul>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[375px] mx-auto border-t bg-background/95 p-4 space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isProcessing}
          className="w-full bg-gradient-to-r from-[#FFC909] to-[#E6B508] text-white disabled:opacity-50"
        >
          Continue
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
