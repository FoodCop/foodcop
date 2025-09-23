import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface FilterOptions {
  sortBy:
    | "relevance"
    | "likes"
    | "rating"
    | "commented"
    | "calories"
    | "preparation_time"
    | "release_date";
  sortOrder: "asc" | "desc";
  categories: string[];
  diet: string[];
  cuisine: string[];
  mainIngredients: string[];
  occasion: string[];
  appliances: string[];
  type: string[];
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  resultCount: number;
}

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance", icon: "🎯" },
  { id: "likes", label: "Likes", icon: "❤️" },
  { id: "rating", label: "Rating", icon: "⭐" },
  { id: "commented", label: "Commented", icon: "💬" },
  { id: "calories", label: "Calories", icon: "🔥" },
  { id: "preparation_time", label: "Preparation time", icon: "⏰" },
  { id: "release_date", label: "Release date", icon: "📅" },
];

const CATEGORIES = [
  { id: "starter", label: "Starter", icon: "🥗" },
  { id: "main", label: "Main", icon: "🍽️" },
  { id: "dessert", label: "Dessert", icon: "🍰" },
  { id: "snack", label: "Snack", icon: "🥖" },
  { id: "breakfast", label: "Breakfast", icon: "☕" },
  { id: "drink", label: "Drink", icon: "🥤" },
];

const DIET_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten Free",
  "Ketogenic",
  "Paleo",
  "Whole30",
  "Dairy Free",
  "Low Carb",
  "Low Fat",
  "Low Sodium",
];

const CUISINE_OPTIONS = [
  "American",
  "Italian",
  "Chinese",
  "Mexican",
  "Indian",
  "French",
  "Japanese",
  "Thai",
  "Greek",
  "Spanish",
  "Korean",
  "Mediterranean",
  "Asian",
  "European",
];

const MAIN_INGREDIENTS = [
  "Chicken",
  "Beef",
  "Pork",
  "Fish",
  "Shrimp",
  "Salmon",
  "Tuna",
  "Turkey",
  "Lamb",
  "Eggs",
  "Tofu",
  "Mushrooms",
  "Pasta",
  "Rice",
  "Potatoes",
];

const OCCASION_OPTIONS = [
  "Weeknight",
  "Weekend",
  "Party",
  "Holiday",
  "Date Night",
  "Family Dinner",
  "Quick Lunch",
  "Meal Prep",
];

const APPLIANCE_OPTIONS = [
  "Oven",
  "Stovetop",
  "Grill",
  "Slow Cooker",
  "Instant Pot",
  "Air Fryer",
  "Microwave",
  "Blender",
];

const TYPE_OPTIONS = [
  "Quick & Easy",
  "Healthy",
  "Comfort Food",
  "One Pot",
  "Make Ahead",
  "Kid Friendly",
  "Budget Friendly",
];

export function FilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  resultCount,
}: FilterModalProps) {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    sortBy: false,
    category: true,
    diet: false,
    cuisine: false,
    mainIngredients: false,
    occasion: false,
    appliances: false,
    type: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateSortBy = (sortBy: FilterOptions["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const updateSortOrder = () => {
    setFilters((prev) => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
    }));
  };

  const toggleArrayFilter = (key: keyof FilterOptions, value: string) => {
    setFilters((prev) => {
      const currentArray = prev[key] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  const resetFilters = () => {
    setFilters({
      sortBy: "relevance",
      sortOrder: "desc",
      categories: [],
      diet: [],
      cuisine: [],
      mainIngredients: [],
      occasion: [],
      appliances: [],
      type: [],
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full h-[90vh] rounded-t-3xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <button onClick={onClose} className="text-orange-500 font-medium">
            Cancel
          </button>
          <h2 className="text-lg font-bold text-gray-900">Filter</h2>
          <button
            onClick={handleApplyFilters}
            className="text-orange-500 font-medium"
          >
            Show results
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Sort By */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection("sortBy")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-gray-900">Sort by</span>
              {expandedSections.sortBy ? (
                <ChevronUp className="w-5 h-5 text-orange-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-orange-500" />
              )}
            </button>

            {expandedSections.sortBy && (
              <div className="px-4 pb-4">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      updateSortBy(option.id as FilterOptions["sortBy"])
                    }
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{option.icon}</span>
                      <span
                        className={
                          filters.sortBy === option.id
                            ? "text-orange-500 font-medium"
                            : "text-gray-900"
                        }
                      >
                        {option.label}
                      </span>
                    </div>
                    {filters.sortBy === option.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSortOrder();
                        }}
                        className="text-orange-500"
                      >
                        {filters.sortOrder === "desc" ? "↓" : "↑"}
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection("category")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-gray-900">Category</span>
              {expandedSections.category ? (
                <ChevronUp className="w-5 h-5 text-orange-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-orange-500" />
              )}
            </button>

            {expandedSections.category && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.id}
                      onClick={() =>
                        toggleArrayFilter("categories", category.id)
                      }
                      className={`p-3 rounded-xl border-2 transition-all ${
                        filters.categories.includes(category.id)
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{category.icon}</div>
                        <div className="text-sm font-medium text-gray-900">
                          {category.label}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Diet */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection("diet")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-gray-900">Diet</span>
              <ChevronDown className="w-5 h-5 text-orange-500" />
            </button>
          </div>

          {/* Cuisine */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection("cuisine")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-gray-900">Cuisine</span>
              <ChevronDown className="w-5 h-5 text-orange-500" />
            </button>

            {expandedSections.cuisine && (
              <div className="px-4 pb-4">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => toggleArrayFilter("cuisine", cuisine)}
                    className="w-full flex items-center justify-between py-3 text-left"
                  >
                    <span className="text-gray-900">{cuisine}</span>
                    <div
                      className={`w-5 h-5 rounded border-2 ${
                        filters.cuisine.includes(cuisine)
                          ? "bg-orange-500 border-orange-500"
                          : "border-gray-300"
                      }`}
                    >
                      {filters.cuisine.includes(cuisine) && (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Ingredients */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection("mainIngredients")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-gray-900">
                Main ingredients
              </span>
              <ChevronDown className="w-5 h-5 text-orange-500" />
            </button>
          </div>

          {/* Occasion */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection("occasion")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-gray-900">Occasion</span>
              <ChevronDown className="w-5 h-5 text-orange-500" />
            </button>
          </div>

          {/* Appliances */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection("appliances")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-gray-900">Appliances</span>
              <ChevronDown className="w-5 h-5 text-orange-500" />
            </button>
          </div>

          {/* Type */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => toggleSection("type")}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-gray-900">Type</span>
              <ChevronDown className="w-5 h-5 text-orange-500" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={resetFilters}
              className="px-4 py-2 border-2 border-green-500 text-green-500 rounded-lg font-medium"
            >
              Reset filter
            </button>
            <span className="text-gray-600 font-medium">
              {resultCount}+ results
            </span>
          </div>

          <div className="flex items-center justify-center text-xs text-gray-500">
            <span className="mr-2">🍽️</span>
            <span>FinalFuzo</span>
            <span className="ml-2">curated by</span>
            <span className="ml-1 font-bold">QuantumClimb</span>
          </div>
        </div>
      </div>
    </div>
  );
}
