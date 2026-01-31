import { useState, useMemo } from 'react';
import { Close, EmojiEvents } from '@mui/icons-material';
import { Button } from '../../ui/button';
import { MinimalHeader } from '../../common/MinimalHeader';
import { snapGameification } from '../../../services/snapGameification';
import type { SnapTag } from '../../../types/snap';

interface TaggingStepProps {
  imageUrl: string;
  onTagsSelected: (tags: SnapTag[]) => void;
  onBack: () => void;
  onCancel: () => void;
}

const CUISINE_TAGS = [
  'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'Thai', 
  'French', 'American', 'Mediterranean', 'Korean', 'Vietnamese', 
  'Spanish', 'Greek', 'Middle Eastern', 'Other'
];

const DISH_TAGS = [
  'Pizza', 'Pasta', 'Sushi', 'Tacos', 'Curry', 'Pad Thai', 
  'Croissant', 'Burger', 'Salad', 'Bibimbap', 'Pho', 'Paella', 
  'Moussaka', 'Kebab', 'Other'
];

const AMBIANCE_TAGS = [
  'Cozy', 'Modern', 'Casual', 'Upscale', 'Outdoor', 'Street Food',
  'Fine Dining', 'Rustic', 'Trendy', 'Vintage', 'Minimalist'
];

export function TaggingStep({
  imageUrl,
  onTagsSelected,
  onBack,
  onCancel
}: TaggingStepProps) {
  const [selectedTags, setSelectedTags] = useState<SnapTag[]>([]);
  const [customTag, setCustomTag] = useState('');

  const pointsEarned = useMemo(() => {
    return selectedTags.reduce((total, tag) => total + tag.pointValue, 0);
  }, [selectedTags]);

  const toggleTag = (label: string, category: SnapTag['category']) => {
    setSelectedTags(prev => {
      const exists = prev.find(t => t.label === label && t.category === category);
      if (exists) {
        return prev.filter(t => !(t.label === label && t.category === category));
      } else {
        const newTag = snapGameification.createTag(label, category);
        return [...prev, newTag];
      }
    });
  };

  const addCustomTag = () => {
    if (!customTag.trim()) return;
    
    const tag = snapGameification.createTag(customTag.trim(), 'custom');
    setSelectedTags(prev => [...prev, tag]);
    setCustomTag('');
  };

  const handleSubmit = () => {
    if (selectedTags.length === 0) {
      return; // Could show toast here
    }
    onTagsSelected(selectedTags);
  };

  return (
    <div className="w-full max-w-[375px] mx-auto bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="py-3 px-5 border-b">
        <h2 className="font-semibold text-gray-900">Tag Your Photo</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-24">
        {/* Image preview */}
        <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg">
          <img
            src={imageUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Points display */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Points earned</p>
            <p className="text-2xl font-bold text-[#FFC909]">{pointsEarned}</p>
          </div>
          <EmojiEvents className="w-8 h-8 text-[#FFC909]" />
        </div>

        {/* Cuisine tags */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">🍽️ Cuisine Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {CUISINE_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag, 'cuisine')}
                className={`p-2 rounded-lg font-medium text-sm transition ${
                  selectedTags.some(t => t.label === tag && t.category === 'cuisine')
                    ? 'bg-[#FFC909] text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Dish tags */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">🍲 Dish Name</h3>
          <div className="grid grid-cols-2 gap-2">
            {DISH_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag, 'dish')}
                className={`p-2 rounded-lg font-medium text-sm transition ${
                  selectedTags.some(t => t.label === tag && t.category === 'dish')
                    ? 'bg-[#FFC909] text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Ambiance tags */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">✨ Ambiance</h3>
          <div className="grid grid-cols-2 gap-2">
            {AMBIANCE_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag, 'ambiance')}
                className={`p-2 rounded-lg font-medium text-sm transition ${
                  selectedTags.some(t => t.label === tag && t.category === 'ambiance')
                    ? 'bg-[#FFC909] text-gray-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Custom tag input */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">🏷️ Custom Tag</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') addCustomTag();
              }}
              placeholder="Add custom tag..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC909]"
            />
            <Button
              onClick={addCustomTag}
              disabled={!customTag.trim()}
              className="bg-[#FFC909] text-gray-900"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Selected tags display */}
        {selectedTags.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Selected Tags</h3>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                >
                  <span className="text-sm">{tag.label}</span>
                  <span className="text-xs text-gray-600">+{tag.pointValue}</span>
                  <button
                    onClick={() => setSelectedTags(prev => prev.filter(t => t.id !== tag.id))}
                    className="ml-1 hover:text-red-600"
                  >
                    <Close className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[375px] mx-auto border-t bg-background/95 p-4 space-y-3">
        <Button
          onClick={handleSubmit}
          disabled={selectedTags.length === 0}
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
