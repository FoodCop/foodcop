import { SaveToPlate } from '@/components/SaveToPlate';

export default function TestSaveToPlate() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Save to Plate Test</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Button Variant</h2>
          <SaveToPlate
            itemId="test-restaurant-1"
            itemType="restaurant"
            title="Mario's Italian Kitchen"
            imageUrl="https://example.com/restaurant.jpg"
            variant="button"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Icon Variant</h2>
          <SaveToPlate
            itemId="test-recipe-1"
            itemType="recipe"
            title="Chocolate Cake"
            variant="icon"
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">No Title</h2>
          <SaveToPlate
            itemId="test-photo-1"
            itemType="photo"
            variant="button"
          />
        </div>
      </div>
    </div>
  );
}