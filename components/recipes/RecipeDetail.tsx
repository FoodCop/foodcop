import React, { useState } from 'react';
import { ArrowLeft, Clock, Users, Flame, Star, Share2, Bookmark, Play, ChevronDown, ChevronRight, MessageCircle, Camera } from 'lucide-react';
import type { Recipe, Comment } from '@/components/recipes/types';
import Image from 'next/image';
import { RecipeCommunity } from '@/components/recipes/RecipeCommunity';
import RecipeShareDialog from '../chat/modern/sharing/RecipeShareDialog';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onSave: () => void;
  onShare: () => void;
  isSaved?: boolean;
}

export function RecipeDetail({ recipe, onBack, onSave, onShare, isSaved = false }: RecipeDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'instructions' | 'nutrition' | 'community'>('overview');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set());
  const [showShareDialog, setShowShareDialog] = useState(false);

  const handleIngredientCheck = (ingredientId: string) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(ingredientId)) {
      newChecked.delete(ingredientId);
    } else {
      newChecked.add(ingredientId);
    }
    setCheckedIngredients(newChecked);
  };

  const toggleInstructionExpansion = (instructionId: string) => {
    const newExpanded = new Set(expandedInstructions);
    if (newExpanded.has(instructionId)) {
      newExpanded.delete(instructionId);
    } else {
      newExpanded.add(instructionId);
    }
    setExpandedInstructions(newExpanded);
  };

  const handleSave = () => {
    onSave();
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const nutritionData = recipe.nutrition ? [
    { label: 'Protein', value: recipe.nutrition.protein, unit: 'g', color: '#F14C35' },
    { label: 'Carbs', value: recipe.nutrition.carbs, unit: 'g', color: '#FFD74A' },
    { label: 'Fat', value: recipe.nutrition.fat, unit: 'g', color: '#A6471E' },
    { label: 'Fiber', value: recipe.nutrition.fiber, unit: 'g', color: '#0B1F3A' }
  ] : [];

  const comments: Comment[] = []; // TODO: Implement comments system

  // Convert Spoonacular ingredients to our format if needed
  const ingredients = recipe.ingredients || recipe.extendedIngredients?.map((ing, index) => ({
    id: `ingredient-${index}`,
    name: ing.name || ing.original,
    amount: ing.amount?.toString() || '1',
    unit: ing.unit || 'unit'
  })) || [];

  // Convert Spoonacular instructions to our format if needed
  const instructions = recipe.instructionSteps || recipe.analyzedInstructions?.flatMap((instruction, instrIndex) => 
    instruction.steps?.map((step: any, stepIndex: number) => ({
      id: `step-${instrIndex}-${stepIndex}`,
      step: step.number || stepIndex + 1,
      description: step.step || '',
      timer: extractTimerFromStep(step.step || '')
    })) || []
  ) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="relative h-80 md:h-96">
        {recipe.image ? (
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}
        
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 ${
                  isSaved ? 'bg-[#F14C35]' : 'bg-white/20'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'text-white fill-current' : 'text-white'}`} />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
              >
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Recipe Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="text-white">
            <div className="flex items-center space-x-2 mb-2">
              {recipe.difficulty && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  recipe.difficulty === 'Easy' ? 'bg-green-500' :
                  recipe.difficulty === 'Medium' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {recipe.difficulty}
                </span>
              )}
              {recipe.cuisines && recipe.cuisines.length > 0 && (
                <span className="text-sm opacity-80">{recipe.cuisines[0]}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">{recipe.title}</h1>
            <p className="text-sm opacity-80 mb-4">by {recipe.author?.name || 'Spoonacular'}</p>
            
            <div className="flex items-center space-x-6 text-sm">
              {recipe.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{recipe.rating}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{recipe.totalTime || recipe.readyInMinutes}m</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{recipe.servings}</span>
              </div>
              {(recipe.calories || recipe.healthScore) && (
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4" />
                  <span>{recipe.calories || recipe.healthScore}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'ingredients', label: 'Ingredients' },
            { id: 'instructions', label: 'Instructions' },
            ...(nutritionData.length > 0 ? [{ id: 'nutrition', label: 'Nutrition' }] : []),
            { id: 'community', label: `Community (${comments.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#F14C35] text-[#F14C35]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {recipe.summary && (
              <div>
                <h2 className="text-lg font-semibold text-[#0B1F3A] mb-2">Description</h2>
                <div 
                  className="text-gray-700 leading-relaxed prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: recipe.summary }}
                />
              </div>
            )}

            {recipe.tags && recipe.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#0B1F3A] mb-3">Recipe Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#F8F9FA] text-sm font-medium text-gray-700 rounded-full border"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
                <Clock className="w-8 h-8 text-[#F14C35] mx-auto mb-2" />
                <p className="text-sm text-gray-600">Prep Time</p>
                <p className="font-semibold text-[#0B1F3A]">{recipe.preparationTime || Math.round((recipe.readyInMinutes || 30) * 0.3)}m</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
                <Play className="w-8 h-8 text-[#F14C35] mx-auto mb-2" />
                <p className="text-sm text-gray-600">Cook Time</p>
                <p className="font-semibold text-[#0B1F3A]">{recipe.cookingTime || recipe.readyInMinutes}m</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
                <Users className="w-8 h-8 text-[#F14C35] mx-auto mb-2" />
                <p className="text-sm text-gray-600">Servings</p>
                <p className="font-semibold text-[#0B1F3A]">{recipe.servings}</p>
              </div>
              <div className="text-center p-4 bg-[#F8F9FA] rounded-xl">
                <Flame className="w-8 h-8 text-[#F14C35] mx-auto mb-2" />
                <p className="text-sm text-gray-600">Health Score</p>
                <p className="font-semibold text-[#0B1F3A]">{recipe.healthScore || recipe.calories || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#0B1F3A]">Ingredients</h2>
              <span className="text-sm text-gray-600">
                {checkedIngredients.size}/{ingredients.length} checked
              </span>
            </div>
            <div className="space-y-3">
              {ingredients.map((ingredient) => (
                <label
                  key={ingredient.id}
                  className="flex items-center space-x-3 p-3 rounded-xl bg-[#F8F9FA] cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checkedIngredients.has(ingredient.id)}
                    onChange={() => handleIngredientCheck(ingredient.id)}
                    className="w-5 h-5 text-[#F14C35] border-gray-300 rounded focus:ring-[#F14C35] focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className={`flex items-center justify-between ${
                      checkedIngredients.has(ingredient.id) ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      <span className="font-medium">{ingredient.name}</span>
                      <span className="text-sm">{ingredient.amount} {ingredient.unit}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <button className="w-full mt-6 bg-[#0B1F3A] text-white py-3 px-4 rounded-xl font-medium hover:bg-[#0B1F3A]/90 transition-colors">
              Add to Shopping List
            </button>
          </div>
        )}

        {activeTab === 'instructions' && (
          <div>
            <h2 className="text-lg font-semibold text-[#0B1F3A] mb-4">Instructions</h2>
            {instructions.length > 0 ? (
              <div className="space-y-4">
                {instructions.map((instruction) => (
                  <div key={instruction.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleInstructionExpansion(instruction.id)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#F14C35] text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {instruction.step}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-[#0B1F3A]">Step {instruction.step}</p>
                          {instruction.timer && (
                            <p className="text-sm text-gray-600 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{instruction.timer} minutes</span>
                            </p>
                          )}
                        </div>
                      </div>
                      {expandedInstructions.has(instruction.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {expandedInstructions.has(instruction.id) && (
                      <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50">
                        <p className="text-gray-700 leading-relaxed mt-3">{instruction.description}</p>
                        {instruction.timer && (
                          <button className="mt-3 px-4 py-2 bg-[#F14C35] text-white rounded-lg text-sm font-medium hover:bg-[#E63E26] transition-colors">
                            Start {instruction.timer}m Timer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : recipe.instructions ? (
              <div className="bg-[#F8F9FA] rounded-xl p-4">
                <div 
                  className="text-gray-700 leading-relaxed prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: recipe.instructions }}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No detailed instructions available.</p>
                {recipe.sourceUrl && (
                  <a 
                    href={recipe.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#F14C35] hover:underline mt-2 inline-block"
                  >
                    View original recipe
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'nutrition' && nutritionData.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[#0B1F3A] mb-4">Nutrition Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {nutritionData.map((item) => (
                <div key={item.label} className="text-center p-4 bg-[#F8F9FA] rounded-xl">
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="text-white font-bold text-sm">{Math.round(item.value)}</span>
                  </div>
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className="font-semibold text-[#0B1F3A]">{Math.round(item.value)}{item.unit}</p>
                </div>
              ))}
            </div>

            {recipe.nutrition && (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-xl">
                  <span className="text-gray-700">Total Calories</span>
                  <span className="font-semibold text-[#0B1F3A]">{Math.round(recipe.nutrition.calories)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-xl">
                  <span className="text-gray-700">Sugar</span>
                  <span className="font-semibold text-[#0B1F3A]">{Math.round(recipe.nutrition.sugar)}g</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#F8F9FA] rounded-xl">
                  <span className="text-gray-700">Sodium</span>
                  <span className="font-semibold text-[#0B1F3A]">{Math.round(recipe.nutrition.sodium)}mg</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'community' && (
          <RecipeCommunity recipeId={recipe.id.toString()} comments={comments} />
        )}
      </div>
      
      {/* Recipe Share Dialog */}
      {showShareDialog && (
        <RecipeShareDialog
          recipe={{
            id: recipe.id.toString(),
            title: recipe.title,
            description: recipe.summary || '',
            image_url: recipe.image,
            cooking_time: recipe.readyInMinutes || 30,
            difficulty: recipe.difficulty || 'Medium',
            ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [],
            servings: recipe.servings || 4,
            calories: recipe.nutrition?.calories,
            category: recipe.dishTypes?.[0] || 'Main Course'
          }}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          onShare={async (targets, message) => {
            console.log('Sharing recipe to:', targets, 'with message:', message);
            setShowShareDialog(false);
          }}
        />
      )}
    </div>
  );
}

// Helper function to extract timer from step text
function extractTimerFromStep(stepText: string): number | undefined {
  const timeMatch = stepText.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/i);
  if (timeMatch) {
    const value = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    
    if (unit.includes('hour') || unit.includes('hr')) {
      return value * 60;
    }
    return value;
  }
  
  return undefined;
}