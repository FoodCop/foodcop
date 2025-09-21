import { SaveToPlate } from "./SaveToPlate";

export function SaveToPlateDemo() {
  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">
          SaveToPlate Widget Demo
        </h1>
        <p className="text-gray-600">
          Test the SaveToPlate widget with different configurations
        </p>
      </div>

      {/* Icon Variants */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0B1F3A]">Icon Variants</h2>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <SaveToPlate
              itemId="demo-restaurant-1"
              itemType="restaurant"
              title="Demo Restaurant"
              variant="icon"
              size="sm"
            />
            <p className="text-xs text-gray-500 mt-1">Small</p>
          </div>
          <div className="text-center">
            <SaveToPlate
              itemId="demo-restaurant-2"
              itemType="restaurant"
              title="Demo Restaurant"
              variant="icon"
              size="md"
            />
            <p className="text-xs text-gray-500 mt-1">Medium</p>
          </div>
          <div className="text-center">
            <SaveToPlate
              itemId="demo-restaurant-3"
              itemType="restaurant"
              title="Demo Restaurant"
              variant="icon"
              size="lg"
            />
            <p className="text-xs text-gray-500 mt-1">Large</p>
          </div>
        </div>
      </div>

      {/* Button Variants */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0B1F3A]">
          Button Variants
        </h2>
        <div className="flex items-center space-x-4">
          <SaveToPlate
            itemId="demo-recipe-1"
            itemType="recipe"
            title="Demo Recipe"
            variant="button"
            size="sm"
          />
          <SaveToPlate
            itemId="demo-recipe-2"
            itemType="recipe"
            title="Demo Recipe"
            variant="button"
            size="md"
          />
          <SaveToPlate
            itemId="demo-recipe-3"
            itemType="recipe"
            title="Demo Recipe"
            variant="button"
            size="lg"
          />
        </div>
      </div>

      {/* Different Item Types */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0B1F3A]">
          Different Item Types
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-xl">
            <h3 className="font-medium text-[#0B1F3A] mb-2">Restaurant</h3>
            <SaveToPlate
              itemId="restaurant-123"
              itemType="restaurant"
              title="The Golden Spoon"
              imageUrl="/images/restaurant.jpg"
              variant="button"
            />
          </div>
          <div className="p-4 border rounded-xl">
            <h3 className="font-medium text-[#0B1F3A] mb-2">Recipe</h3>
            <SaveToPlate
              itemId="recipe-456"
              itemType="recipe"
              title="Chocolate Chip Cookies"
              imageUrl="/images/recipe.jpg"
              variant="button"
            />
          </div>
          <div className="p-4 border rounded-xl">
            <h3 className="font-medium text-[#0B1F3A] mb-2">Photo</h3>
            <SaveToPlate
              itemId="photo-789"
              itemType="photo"
              title="Sunset Food Photo"
              imageUrl="/images/photo.jpg"
              variant="button"
            />
          </div>
          <div className="p-4 border rounded-xl">
            <h3 className="font-medium text-[#0B1F3A] mb-2">Video</h3>
            <SaveToPlate
              itemId="video-101"
              itemType="video"
              title="Cooking Tutorial"
              imageUrl="/images/video.jpg"
              variant="button"
            />
          </div>
        </div>
      </div>

      {/* Custom Styling */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0B1F3A]">Custom Styling</h2>
        <div className="flex items-center space-x-4">
          <SaveToPlate
            itemId="custom-1"
            itemType="restaurant"
            title="Custom Styled"
            variant="button"
            className="bg-gradient-to-r from-[#F14C35] to-[#E03A28] text-white shadow-lg"
          />
          <SaveToPlate
            itemId="custom-2"
            itemType="recipe"
            title="Custom Styled"
            variant="icon"
            className="bg-green-500 hover:bg-green-600 text-white"
          />
        </div>
      </div>

      {/* Callback Examples */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0B1F3A]">With Callbacks</h2>
        <div className="p-4 border rounded-xl">
          <SaveToPlate
            itemId="callback-demo"
            itemType="restaurant"
            title="Callback Demo"
            variant="button"
            onSaved={() => console.log("Item saved!")}
            onUnsaved={() => console.log("Item unsaved!")}
          />
          <p className="text-sm text-gray-500 mt-2">
            Check console for callback logs
          </p>
        </div>
      </div>
    </div>
  );
}
