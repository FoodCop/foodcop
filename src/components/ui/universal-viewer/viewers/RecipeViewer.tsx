import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../card';
import { Badge } from '../../badge';
import { Schedule, Group, Favorite, OpenInNew } from '@mui/icons-material';
import { Button } from '../../button';
import type { RecipeViewerProps } from '../types';

export const RecipeViewer: React.FC<RecipeViewerProps> = ({ data }) => {
  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative">
        {data.image ? (
          <img
            src={data.image}
            alt={data.title}
            className="w-full h-64 object-cover rounded-lg"
            onError={(e) => {
              // Fallback for broken images
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🍽️</div>
              <p>No image available</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold text-white bg-black/50 p-3 rounded backdrop-blur-sm">
            {data.title}
          </h1>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Schedule className="w-4 h-4 text-orange-500" />
          <span>{data.readyInMinutes} min</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Group className="w-4 h-4 text-blue-500" />
          <span>{data.servings} servings</span>
        </div>
        {data.healthScore && (
          <div className="flex items-center gap-2 text-sm">
            <Favorite className="w-4 h-4 text-green-500" />
            <span>{data.healthScore}/100</span>
          </div>
        )}
        {data.sourceUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
              <OpenInNew className="w-4 h-4 mr-1" />
              Source
            </a>
          </Button>
        )}
      </div>

      {/* Dietary Info */}
      {data.diets.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Dietary Information</h3>
          <div className="flex flex-wrap gap-2">
            {data.diets.map((diet, index) => (
              <Badge key={index} variant="secondary" className="capitalize">
                {diet.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{data.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Ingredients */}
      {data.ingredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.ingredients.map((ingredient, index) => (
                <li key={index} className="flex justify-between items-center py-1">
                  <span className="font-medium">{ingredient.name}</span>
                  <span className="text-gray-500">
                    {ingredient.amount} {ingredient.unit}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {data.instructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {data.instructions.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Nutrition Info */}
      {data.nutrition && (
        <Card>
          <CardHeader>
            <CardTitle>Nutrition (per serving)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.nutrition.calories && (
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-500">
                    {data.nutrition.calories}
                  </div>
                  <div className="text-sm text-gray-500">Calories</div>
                </div>
              )}
              {data.nutrition.protein && (
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">
                    {data.nutrition.protein}
                  </div>
                  <div className="text-sm text-gray-500">Protein</div>
                </div>
              )}
              {data.nutrition.carbs && (
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {data.nutrition.carbs}
                  </div>
                  <div className="text-sm text-gray-500">Carbs</div>
                </div>
              )}
              {data.nutrition.fat && (
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-500">
                    {data.nutrition.fat}
                  </div>
                  <div className="text-sm text-gray-500">Fat</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state for missing data */}
      {!data.summary && data.ingredients.length === 0 && data.instructions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">🍳</div>
            <p className="text-gray-500 mb-2">Limited recipe information available</p>
            <p className="text-sm text-gray-400">
              This recipe was saved with basic details only.
            </p>
            {data.sourceUrl && (
              <Button variant="outline" className="mt-4" asChild>
                <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
                  View Full Recipe
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecipeViewer;