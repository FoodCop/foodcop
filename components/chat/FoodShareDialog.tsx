'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
// UI Components - Select dropdown functionality
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Share2, 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  ChefHat,
  ExternalLink,
  Phone,
  DollarSign
} from 'lucide-react';

interface RestaurantShareData {
  type: 'restaurant';
  name: string;
  address?: string;
  rating?: number;
  priceLevel?: number;
  cuisineType?: string;
  website?: string;
  phone?: string;
  googlePlaceId?: string;
  coords?: { lat: number; lng: number };
  images?: string[];
  message?: string;
}

interface RecipeShareData {
  type: 'recipe';
  title: string;
  description?: string;
  ingredients?: string[];
  instructions?: string[];
  cookingTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisineType?: string;
  images?: string[];
  source?: string;
  message?: string;
}

interface FoodShareDialogProps {
  onShare: (shareData: RestaurantShareData | RecipeShareData, message?: string) => Promise<void>;
  isSharing: boolean;
}

export function FoodShareDialog({ onShare, isSharing }: FoodShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'restaurant' | 'recipe'>('restaurant');
  const [shareMessage, setShareMessage] = useState('');

  // Restaurant form state
  const [restaurantData, setRestaurantData] = useState<Partial<RestaurantShareData>>({
    type: 'restaurant',
    name: '',
    address: '',
    rating: undefined,
    priceLevel: undefined,
    cuisineType: '',
    website: '',
    phone: ''
  });

  // Recipe form state
  const [recipeData, setRecipeData] = useState<Partial<RecipeShareData>>({
    type: 'recipe',
    title: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    cookingTime: undefined,
    servings: undefined,
    difficulty: undefined,
    cuisineType: '',
    source: ''
  });

  const handleRestaurantShare = async () => {
    if (!restaurantData.name) return;
    
    await onShare(restaurantData as RestaurantShareData, shareMessage);
    setOpen(false);
    resetForms();
  };

  const handleRecipeShare = async () => {
    if (!recipeData.title) return;
    
    // Filter out empty ingredients and instructions
    const cleanedRecipe = {
      ...recipeData,
      ingredients: recipeData.ingredients?.filter(i => i.trim()) || [],
      instructions: recipeData.instructions?.filter(i => i.trim()) || []
    };
    
    await onShare(cleanedRecipe as RecipeShareData, shareMessage);
    setOpen(false);
    resetForms();
  };

  const resetForms = () => {
    setShareMessage('');
    setRestaurantData({
      type: 'restaurant',
      name: '',
      address: '',
      rating: undefined,
      priceLevel: undefined,
      cuisineType: '',
      website: '',
      phone: ''
    });
    setRecipeData({
      type: 'recipe',
      title: '',
      description: '',
      ingredients: [''],
      instructions: [''],
      cookingTime: undefined,
      servings: undefined,
      difficulty: undefined,
      cuisineType: '',
      source: ''
    });
  };

  const addIngredient = () => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: [...(prev.ingredients || []), '']
    }));
  };

  const addInstruction = () => {
    setRecipeData(prev => ({
      ...prev,
      instructions: [...(prev.instructions || []), '']
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: prev.ingredients?.map((ing, i) => i === index ? value : ing) || []
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setRecipeData(prev => ({
      ...prev,
      instructions: prev.instructions?.map((inst, i) => i === index ? value : inst) || []
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-1" />
          Share Food
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Food Content</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'restaurant' | 'recipe')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="recipe">Recipe</TabsTrigger>
          </TabsList>

          {/* Restaurant Tab */}
          <TabsContent value="restaurant" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="restaurant-name">Restaurant Name *</Label>
                <Input
                  id="restaurant-name"
                  value={restaurantData.name}
                  onChange={(e) => setRestaurantData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter restaurant name"
                />
              </div>

              <div>
                <Label htmlFor="restaurant-address">Address</Label>
                <Input
                  id="restaurant-address"
                  value={restaurantData.address}
                  onChange={(e) => setRestaurantData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Restaurant address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="restaurant-rating">Rating (1-5)</Label>
                  <Input
                    id="restaurant-rating"
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={restaurantData.rating || ''}
                    onChange={(e) => setRestaurantData(prev => ({ 
                      ...prev, 
                      rating: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="4.5"
                  />
                </div>

                <div>
                  <Label htmlFor="restaurant-price">Price Level (1-4)</Label>
                  <Select
                    value={restaurantData.priceLevel?.toString() || ''}
                    onValueChange={(value: string) => setRestaurantData(prev => ({ 
                      ...prev, 
                      priceLevel: value ? parseInt(value) : undefined 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select price level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">$ (Inexpensive)</SelectItem>
                      <SelectItem value="2">$$ (Moderate)</SelectItem>
                      <SelectItem value="3">$$$ (Expensive)</SelectItem>
                      <SelectItem value="4">$$$$ (Very Expensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="restaurant-cuisine">Cuisine Type</Label>
                <Input
                  id="restaurant-cuisine"
                  value={restaurantData.cuisineType}
                  onChange={(e) => setRestaurantData(prev => ({ ...prev, cuisineType: e.target.value }))}
                  placeholder="Italian, Mexican, Asian, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="restaurant-website">Website</Label>
                  <Input
                    id="restaurant-website"
                    type="url"
                    value={restaurantData.website}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://restaurant.com"
                  />
                </div>

                <div>
                  <Label htmlFor="restaurant-phone">Phone</Label>
                  <Input
                    id="restaurant-phone"
                    value={restaurantData.phone}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="restaurant-message">Message (Optional)</Label>
                <Textarea
                  id="restaurant-message"
                  value={shareMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setShareMessage(e.target.value)}
                  placeholder="Add a personal message about this restaurant..."
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleRestaurantShare} 
                disabled={!restaurantData.name || isSharing}
                className="w-full"
              >
                {isSharing ? 'Sharing...' : 'Share Restaurant'}
              </Button>
            </div>
          </TabsContent>

          {/* Recipe Tab */}
          <TabsContent value="recipe" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipe-title">Recipe Title *</Label>
                <Input
                  id="recipe-title"
                  value={recipeData.title}
                  onChange={(e) => setRecipeData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter recipe title"
                />
              </div>

              <div>
                <Label htmlFor="recipe-description">Description</Label>
                <Textarea
                  id="recipe-description"
                  value={recipeData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRecipeData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the recipe..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="recipe-time">Cooking Time (min)</Label>
                  <Input
                    id="recipe-time"
                    type="number"
                    min="1"
                    value={recipeData.cookingTime || ''}
                    onChange={(e) => setRecipeData(prev => ({ 
                      ...prev, 
                      cookingTime: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="30"
                  />
                </div>

                <div>
                  <Label htmlFor="recipe-servings">Servings</Label>
                  <Input
                    id="recipe-servings"
                    type="number"
                    min="1"
                    value={recipeData.servings || ''}
                    onChange={(e) => setRecipeData(prev => ({ 
                      ...prev, 
                      servings: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="4"
                  />
                </div>

                <div>
                  <Label htmlFor="recipe-difficulty">Difficulty</Label>
                  <Select
                    value={recipeData.difficulty || ''}
                    onValueChange={(value: string) => setRecipeData(prev => ({ 
                      ...prev, 
                      difficulty: value as 'easy' | 'medium' | 'hard'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Ingredients</Label>
                <div className="space-y-2">
                  {recipeData.ingredients?.map((ingredient, index) => (
                    <Input
                      key={index}
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      placeholder={`Ingredient ${index + 1}`}
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                    Add Ingredient
                  </Button>
                </div>
              </div>

              <div>
                <Label>Instructions</Label>
                <div className="space-y-2">
                  {recipeData.instructions?.map((instruction, index) => (
                    <Textarea
                      key={index}
                      value={instruction}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateInstruction(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      rows={2}
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
                    Add Step
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="recipe-message">Message (Optional)</Label>
                <Textarea
                  id="recipe-message"
                  value={shareMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setShareMessage(e.target.value)}
                  placeholder="Add a personal message about this recipe..."
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleRecipeShare} 
                disabled={!recipeData.title || isSharing}
                className="w-full"
              >
                {isSharing ? 'Sharing...' : 'Share Recipe'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Component to display shared content in chat messages
interface SharedContentProps {
  content: RestaurantShareData | RecipeShareData;
  className?: string;
}

export function SharedContentPreview({ content, className = '' }: SharedContentProps) {
  if (content.type === 'restaurant') {
    const restaurant = content as RestaurantShareData;
    return (
      <Card className={`max-w-sm ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="h-4 w-4 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{restaurant.name}</h4>
              {restaurant.address && (
                <p className="text-sm text-gray-600 truncate">{restaurant.address}</p>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                {restaurant.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs">{restaurant.rating}</span>
                  </div>
                )}
                
                {restaurant.priceLevel && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="text-xs">{'$'.repeat(restaurant.priceLevel)}</span>
                  </div>
                )}
                
                {restaurant.cuisineType && (
                  <Badge variant="secondary" className="text-xs">
                    {restaurant.cuisineType}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mt-2">
                {restaurant.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Website
                    </a>
                  </Button>
                )}
                
                {restaurant.phone && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${restaurant.phone}`}>
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (content.type === 'recipe') {
    const recipe = content as RecipeShareData;
    return (
      <Card className={`max-w-sm ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChefHat className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{recipe.title}</h4>
              {recipe.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                {recipe.cookingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span className="text-xs">{recipe.cookingTime}m</span>
                  </div>
                )}
                
                {recipe.servings && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-purple-500" />
                    <span className="text-xs">{recipe.servings} servings</span>
                  </div>
                )}
                
                {recipe.difficulty && (
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      recipe.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                      recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {recipe.difficulty}
                  </Badge>
                )}
              </div>

              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500">
                    {recipe.ingredients.length} ingredients
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}