import { useState } from 'react';
import { Globe, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { MinimalHeader } from '../../common/MinimalHeader';
import type { SnapTag } from '../../../types/snap';

interface PublishStepProps {
  imageUrl: string;
  caption: string;
  tags: SnapTag[];
  onPublish: (target: 'plate' | 'feed') => void;
  onBack: () => void;
  onCancel: () => void;
  isPublishing?: boolean;
}

export function PublishStep({
  imageUrl,
  caption,
  tags,
  onPublish,
  onBack,
  onCancel,
  isPublishing = false
}: PublishStepProps) {
  const [selectedTarget, setSelectedTarget] = useState<'plate' | 'feed' | null>(null);

  const pointsTotal = tags.reduce((sum, tag) => sum + tag.pointValue, 0);

  const handlePublish = () => {
    if (!selectedTarget) return;
    onPublish(selectedTarget);
  };

  return (
    <div className="w-full max-w-[375px] mx-auto bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="py-3 px-5 border-b">
        <h2 className="font-semibold text-gray-900">Publish</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-24">
        {/* Preview card */}
        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <div className="aspect-square bg-gray-100">
            <img
              src={imageUrl}
              alt="Card preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-4 bg-white space-y-3">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                >
                  {tag.label}
                </span>
              ))}
            </div>
            {/* Caption */}
            <p className="text-sm text-gray-700 leading-relaxed">{caption}</p>
            {/* Points */}
            <div className="text-xs text-gray-500 font-medium">
              Earn {pointsTotal} points 🎯
            </div>
          </div>
        </div>

        {/* Publishing options */}
        <div className="space-y-4">
          <h2 className="font-semibold text-gray-900">Where to publish?</h2>

          {/* Plate option */}
          <button
            onClick={() => setSelectedTarget('plate')}
            disabled={isPublishing}
            className={`w-full p-4 rounded-lg border-2 transition ${
              selectedTarget === 'plate'
                ? 'border-[#FFC909] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Lock className={`w-6 h-6 ${
                  selectedTarget === 'plate' ? 'text-[#FFC909]' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">My Plate</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Save to your private profile only. Only visible to you.
                </p>
                <p className="text-xs text-[#FFC909] font-medium mt-2">
                  +{pointsTotal} points (personal collection)
                </p>
              </div>
            </div>
          </button>

          {/* Feed option */}
          <button
            onClick={() => setSelectedTarget('feed')}
            disabled={isPublishing}
            className={`w-full p-4 rounded-lg border-2 transition ${
              selectedTarget === 'feed'
                ? 'border-[#FFC909] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Globe className={`w-6 h-6 ${
                  selectedTarget === 'feed' ? 'text-[#FFC909]' : 'text-gray-400'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Community Feed</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Share with the FuzoFood community. Get likes and comments.
                </p>
                <p className="text-xs text-[#FFC909] font-medium mt-2">
                  +{pointsTotal} points (+ bonus for engagement)
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Info boxes */}
        <div className="space-y-3">
          {selectedTarget === 'plate' && (
            <div className="bg-blue-50 p-4 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                Your Plate is your personal collection. You can always move cards to the Feed later.
              </div>
            </div>
          )}

          {selectedTarget === 'feed' && (
            <div className="bg-green-50 p-4 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">
                Your card will be visible to all FuzoFood users. Be authentic and respectful!
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">Points Breakdown</h4>
            <div className="space-y-1 text-xs text-gray-600">
              {tags.map(tag => (
                <div key={tag.id} className="flex justify-between">
                  <span>{tag.label}</span>
                  <span className="font-medium">+{tag.pointValue}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>+{pointsTotal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[375px] mx-auto border-t bg-background/95 p-4 space-y-3">
        <Button
          onClick={handlePublish}
          disabled={!selectedTarget || isPublishing}
          className="w-full bg-gradient-to-r from-[#FFC909] to-[#E6B508] text-white disabled:opacity-50"
        >
          {isPublishing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Publishing...
            </div>
          ) : (
            'Publish'
          )}
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isPublishing}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPublishing}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
