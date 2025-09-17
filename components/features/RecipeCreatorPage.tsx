import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  ChefHat,
  Clock,
  Plus,
  Star,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

export interface RecipeIngredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  instruction: string;
  image?: string;
  duration?: number;
}

export interface NewRecipe {
  title: string;
  description: string;
  mainImage: string;
  cookingTime: number;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  cuisine: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface RecipeCreatorPageProps {
  onNavigateBack?: () => void;
  onSaveRecipe?: (recipe: NewRecipe) => void;
}

type CreatorStep =
  | "basic"
  | "ingredients"
  | "instructions"
  | "nutrition"
  | "preview";

export function RecipeCreatorPage({
  onNavigateBack,
  onSaveRecipe,
}: RecipeCreatorPageProps) {
  const [currentStep, setCurrentStep] = useState<CreatorStep>("basic");
  const [recipe, setRecipe] = useState<NewRecipe>({
    title: "",
    description: "",
    mainImage: "",
    cookingTime: 30,
    servings: 4,
    difficulty: "Medium",
    cuisine: "",
    tags: [],
    ingredients: [],
    steps: [],
  });

  const steps = [
    { id: "basic" as CreatorStep, label: "Basic Info", icon: ChefHat },
    { id: "ingredients" as CreatorStep, label: "Ingredients", icon: Plus },
    { id: "instructions" as CreatorStep, label: "Instructions", icon: Star },
    { id: "nutrition" as CreatorStep, label: "Nutrition", icon: Star },
    { id: "preview" as CreatorStep, label: "Preview", icon: Star },
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  const addIngredient = () => {
    const newIngredient: RecipeIngredient = {
      id: Date.now().toString(),
      name: "",
      amount: "",
      unit: "cups",
    };
    setRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient],
    }));
  };

  const updateIngredient = (
    id: string,
    field: keyof RecipeIngredient,
    value: string
  ) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing) =>
        ing.id === id ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const removeIngredient = (id: string) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((ing) => ing.id !== id),
    }));
  };

  const addStep = () => {
    const newStep: RecipeStep = {
      id: Date.now().toString(),
      stepNumber: recipe.steps.length + 1,
      instruction: "",
    };
    setRecipe((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  const updateStep = (
    id: string,
    field: keyof RecipeStep,
    value: string | number
  ) => {
    setRecipe((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === id ? { ...step, [field]: value } : step
      ),
    }));
  };

  const removeStep = (id: string) => {
    setRecipe((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((step) => step.id !== id)
        .map((step, index) => ({ ...step, stepNumber: index + 1 })),
    }));
  };

  const addTag = (tag: string) => {
    if (tag && !recipe.tags.includes(tag)) {
      setRecipe((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const removeTag = (tag: string) => {
    setRecipe((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSave = () => {
    onSaveRecipe?.(recipe);
    onNavigateBack?.();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <BasicInfoStep
            recipe={recipe}
            setRecipe={setRecipe}
            addTag={addTag}
            removeTag={removeTag}
          />
        );
      case "ingredients":
        return (
          <IngredientsStep
            ingredients={recipe.ingredients}
            addIngredient={addIngredient}
            updateIngredient={updateIngredient}
            removeIngredient={removeIngredient}
          />
        );
      case "instructions":
        return (
          <InstructionsStep
            steps={recipe.steps}
            addStep={addStep}
            updateStep={updateStep}
            removeStep={removeStep}
          />
        );
      case "nutrition":
        return <NutritionStep recipe={recipe} setRecipe={setRecipe} />;
      case "preview":
        return <PreviewStep recipe={recipe} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onNavigateBack}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#0B1F3A]" />
          </button>

          <div className="text-center">
            <h1 className="font-semibold text-[#0B1F3A]">Create Recipe</h1>
            <p className="text-sm text-gray-600">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>

          <button
            onClick={currentStep === "preview" ? handleSave : handleNext}
            disabled={currentStep === "basic" && !recipe.title}
            className="px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === "preview" ? "Save Recipe" : "Next"}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#F14C35] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center space-x-6 p-4 bg-[#F8F9FA]">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;
          const IconComponent = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                isActive
                  ? "text-[#F14C35]"
                  : isCompleted
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive
                    ? "bg-[#F14C35]/20"
                    : isCompleted
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          {currentStepIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}
          <button
            onClick={currentStep === "preview" ? handleSave : handleNext}
            disabled={currentStep === "basic" && !recipe.title}
            className="flex-1 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === "preview" ? "Save Recipe" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Step Components
function BasicInfoStep({
  recipe,
  setRecipe,
  addTag,
  removeTag,
}: {
  recipe: NewRecipe;
  setRecipe: React.Dispatch<React.SetStateAction<NewRecipe>>;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
}) {
  const [newTag, setNewTag] = useState("");

  const cuisines = [
    "Italian",
    "Chinese",
    "Japanese",
    "Mexican",
    "Indian",
    "Thai",
    "French",
    "American",
    "Mediterranean",
  ];

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h2 className="text-xl font-semibold text-[#0B1F3A] mb-6">
          Recipe Basics
        </h2>

        {/* Photo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#0B1F3A] mb-3">
            Recipe Photo
          </label>
          <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-[#F14C35] transition-colors cursor-pointer">
            {recipe.mainImage ? (
              <ImageWithFallback
                src={recipe.mainImage}
                alt="Recipe"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Add a photo of your dish</p>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
            Recipe Title
          </label>
          <input
            type="text"
            value={recipe.title}
            onChange={(e) =>
              setRecipe((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Give your recipe a catchy name..."
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
            Description
          </label>
          <textarea
            value={recipe.description}
            onChange={(e) =>
              setRecipe((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Tell people what makes this recipe special..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent resize-none"
          />
        </div>

        {/* Quick Details */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Cook Time
            </label>
            <input
              type="number"
              value={recipe.cookingTime}
              onChange={(e) =>
                setRecipe((prev) => ({
                  ...prev,
                  cookingTime: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="30"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
            />
            <span className="text-xs text-gray-500">minutes</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Servings
            </label>
            <input
              type="number"
              value={recipe.servings}
              onChange={(e) =>
                setRecipe((prev) => ({
                  ...prev,
                  servings: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="4"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
              Difficulty
            </label>
            <select
              value={recipe.difficulty}
              onChange={(e) =>
                setRecipe((prev) => ({
                  ...prev,
                  difficulty: e.target.value as any,
                }))
              }
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Cuisine */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
            Cuisine Type
          </label>
          <select
            value={recipe.cuisine}
            onChange={(e) =>
              setRecipe((prev) => ({ ...prev, cuisine: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
          >
            <option value="">Select cuisine...</option>
            {cuisines.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded-full text-sm font-medium flex items-center space-x-1"
              >
                <span>{tag}</span>
                <button onClick={() => removeTag(tag)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  addTag(newTag);
                  setNewTag("");
                }
              }}
            />
            <button
              onClick={() => {
                addTag(newTag);
                setNewTag("");
              }}
              className="px-4 py-3 bg-[#F14C35] text-white rounded-xl hover:bg-[#E63E26] transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IngredientsStep({
  ingredients,
  addIngredient,
  updateIngredient,
  removeIngredient,
}: {
  ingredients: RecipeIngredient[];
  addIngredient: () => void;
  updateIngredient: (
    id: string,
    field: keyof RecipeIngredient,
    value: string
  ) => void;
  removeIngredient: (id: string) => void;
}) {
  const units = [
    "cups",
    "tbsp",
    "tsp",
    "oz",
    "lbs",
    "grams",
    "kg",
    "ml",
    "liters",
    "pieces",
    "cloves",
    "pinch",
  ];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#0B1F3A]">Ingredients</h2>
        <button
          onClick={addIngredient}
          className="px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ingredient</span>
        </button>
      </div>

      {ingredients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No ingredients added yet</p>
          <button
            onClick={addIngredient}
            className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors"
          >
            Add Your First Ingredient
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {ingredients.map((ingredient, index) => (
            <div key={ingredient.id} className="bg-[#F8F9FA] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-[#0B1F3A]">
                  Ingredient {index + 1}
                </span>
                <button
                  onClick={() => removeIngredient(ingredient.id)}
                  className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-12 gap-3">
                <input
                  type="text"
                  value={ingredient.amount}
                  onChange={(e) =>
                    updateIngredient(ingredient.id, "amount", e.target.value)
                  }
                  placeholder="1"
                  className="col-span-3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                />

                <select
                  value={ingredient.unit}
                  onChange={(e) =>
                    updateIngredient(ingredient.id, "unit", e.target.value)
                  }
                  className="col-span-3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={ingredient.name}
                  onChange={(e) =>
                    updateIngredient(ingredient.id, "name", e.target.value)
                  }
                  placeholder="e.g., all-purpose flour"
                  className="col-span-6 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InstructionsStep({
  steps,
  addStep,
  updateStep,
  removeStep,
}: {
  steps: RecipeStep[];
  addStep: () => void;
  updateStep: (
    id: string,
    field: keyof RecipeStep,
    value: string | number
  ) => void;
  removeStep: (id: string) => void;
}) {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#0B1F3A]">Instructions</h2>
        <button
          onClick={addStep}
          className="px-4 py-2 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Step</span>
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No instructions added yet</p>
          <button
            onClick={addStep}
            className="px-6 py-3 bg-[#F14C35] text-white rounded-xl font-medium hover:bg-[#E63E26] transition-colors"
          >
            Add First Step
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="bg-[#F8F9FA] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-[#0B1F3A]">
                  Step {step.stepNumber}
                </span>
                <button
                  onClick={() => removeStep(step.id)}
                  className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <textarea
                value={step.instruction}
                onChange={(e) =>
                  updateStep(step.id, "instruction", e.target.value)
                }
                placeholder="Describe this step in detail..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F14C35] focus:border-transparent resize-none mb-3"
              />

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (optional)
                  </label>
                  <input
                    type="number"
                    value={step.duration || ""}
                    onChange={(e) =>
                      updateStep(
                        step.id,
                        "duration",
                        parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="5"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
                  />
                  <span className="text-xs text-gray-500">minutes</span>
                </div>

                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                  <Camera className="w-4 h-4" />
                  <span>Add Photo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NutritionStep({
  recipe,
  setRecipe,
}: {
  recipe: NewRecipe;
  setRecipe: React.Dispatch<React.SetStateAction<NewRecipe>>;
}) {
  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-xl font-semibold text-[#0B1F3A]">
        Nutrition Information
      </h2>
      <p className="text-gray-600">Add optional nutrition info per serving</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
            Calories
          </label>
          <input
            type="number"
            value={recipe.nutritionInfo?.calories || ""}
            onChange={(e) =>
              setRecipe((prev) => ({
                ...prev,
                nutritionInfo: {
                  ...prev.nutritionInfo,
                  calories: parseInt(e.target.value) || 0,
                  protein: prev.nutritionInfo?.protein || 0,
                  carbs: prev.nutritionInfo?.carbs || 0,
                  fat: prev.nutritionInfo?.fat || 0,
                },
              }))
            }
            placeholder="350"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
            Protein (g)
          </label>
          <input
            type="number"
            value={recipe.nutritionInfo?.protein || ""}
            onChange={(e) =>
              setRecipe((prev) => ({
                ...prev,
                nutritionInfo: {
                  ...prev.nutritionInfo,
                  calories: prev.nutritionInfo?.calories || 0,
                  protein: parseInt(e.target.value) || 0,
                  carbs: prev.nutritionInfo?.carbs || 0,
                  fat: prev.nutritionInfo?.fat || 0,
                },
              }))
            }
            placeholder="25"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
            Carbs (g)
          </label>
          <input
            type="number"
            value={recipe.nutritionInfo?.carbs || ""}
            onChange={(e) =>
              setRecipe((prev) => ({
                ...prev,
                nutritionInfo: {
                  ...prev.nutritionInfo,
                  calories: prev.nutritionInfo?.calories || 0,
                  protein: prev.nutritionInfo?.protein || 0,
                  carbs: parseInt(e.target.value) || 0,
                  fat: prev.nutritionInfo?.fat || 0,
                },
              }))
            }
            placeholder="45"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0B1F3A] mb-2">
            Fat (g)
          </label>
          <input
            type="number"
            value={recipe.nutritionInfo?.fat || ""}
            onChange={(e) =>
              setRecipe((prev) => ({
                ...prev,
                nutritionInfo: {
                  ...prev.nutritionInfo,
                  calories: prev.nutritionInfo?.calories || 0,
                  protein: prev.nutritionInfo?.protein || 0,
                  carbs: prev.nutritionInfo?.carbs || 0,
                  fat: parseInt(e.target.value) || 0,
                },
              }))
            }
            placeholder="12"
            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F14C35] focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function PreviewStep({ recipe }: { recipe: NewRecipe }) {
  return (
    <div className="space-y-6 pb-24">
      <h2 className="text-xl font-semibold text-[#0B1F3A]">Recipe Preview</h2>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-[#0B1F3A] mb-2">
            {recipe.title}
          </h3>
          <p className="text-gray-600 mb-4">{recipe.description}</p>

          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{recipe.cookingTime} min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{recipe.servings} servings</span>
            </div>
            <span className="px-2 py-1 bg-[#F14C35]/10 text-[#F14C35] rounded-full text-xs">
              {recipe.difficulty}
            </span>
          </div>
        </div>

        {/* Ingredients */}
        <div className="px-6 py-4 border-t border-gray-100">
          <h4 className="font-semibold text-[#0B1F3A] mb-3">Ingredients</h4>
          <div className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <span className="font-medium">
                  {ingredient.amount} {ingredient.unit}
                </span>
                <span>{ingredient.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 border-t border-gray-100">
          <h4 className="font-semibold text-[#0B1F3A] mb-3">Instructions</h4>
          <div className="space-y-3">
            {recipe.steps.map((step) => (
              <div key={step.id} className="flex space-x-3">
                <span className="w-6 h-6 bg-[#F14C35] text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {step.stepNumber}
                </span>
                <p className="text-sm text-gray-700">{step.instruction}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
