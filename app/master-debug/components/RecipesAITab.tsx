"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Bot, ChefHat, Search } from "lucide-react";
import { DebugService } from "../lib/debug-service";
import type { SystemHealth, RecipeSearchResult } from "../lib/types";

interface RecipesAITabProps {
  systemHealth: SystemHealth | null;
  onRefresh: () => Promise<void>;
}

export function RecipesAITab({ systemHealth, onRefresh }: RecipesAITabProps) {
  const [recipeQuery, setRecipeQuery] = useState("");
  const [recipeResults, setRecipeResults] = useState<RecipeSearchResult[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const searchRecipes = async () => {
    if (!recipeQuery.trim()) return;

    setLoading(true);
    try {
      const results = await DebugService.searchRecipes(recipeQuery);
      setRecipeResults(results);
    } catch (error) {
      console.error("Recipe search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const testAIQuery = async () => {
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    try {
      // This would call the OpenAI API endpoint
      const response = await fetch('/api/debug/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiPrompt })
      });
      
      const data = await response.json();
      setAiResponse(data.response || "No response received");
    } catch (error) {
      console.error("AI query failed:", error);
      setAiResponse("Error: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setAiLoading(false);
    }
  };

  const analyzeIngredients = async () => {
    if (!ingredients.trim()) return;

    setLoading(true);
    try {
      // This would analyze ingredients and suggest recipes
      const response = await fetch('/api/debug/spoonacular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: ingredients.split(',').map(i => i.trim()) })
      });
      
      const data = await response.json();
      setRecipeResults(data.results || []);
    } catch (error) {
      console.error("Ingredient analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === undefined) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading AI and recipe services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI & Recipe Services Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI & Recipe Services
              </CardTitle>
              <CardDescription>
                OpenAI and Spoonacular API integration status
              </CardDescription>
            </div>
            <Button onClick={onRefresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.apis.openai?.connected)}
                <div>
                  <h4 className="font-medium">OpenAI API</h4>
                  <p className="text-sm text-muted-foreground">
                    AI-powered food recommendations
                  </p>
                  {systemHealth.apis.openai?.responseTime && (
                    <p className="text-xs text-muted-foreground">
                      Response time: {systemHealth.apis.openai.responseTime}ms
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={systemHealth.apis.openai?.connected ? "default" : "destructive"}>
                {systemHealth.apis.openai?.connected ? "Active" : "Failed"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(systemHealth.apis.spoonacular?.connected)}
                <div>
                  <h4 className="font-medium">Spoonacular API</h4>
                  <p className="text-sm text-muted-foreground">
                    Recipe search and analysis
                  </p>
                  {systemHealth.apis.spoonacular?.responseTime && (
                    <p className="text-xs text-muted-foreground">
                      Response time: {systemHealth.apis.spoonacular.responseTime}ms
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={systemHealth.apis.spoonacular?.connected ? "default" : "destructive"}>
                {systemHealth.apis.spoonacular?.connected ? "Active" : "Failed"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipe Search Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🍳 Recipe Search Testing
          </CardTitle>
          <CardDescription>
            Test Spoonacular recipe search and ingredient analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Search Recipes</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for recipes (e.g., pasta, chicken curry)"
                    value={recipeQuery}
                    onChange={(e) => setRecipeQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchRecipes()}
                  />
                  <Button onClick={searchRecipes} disabled={loading || !recipeQuery.trim()}>
                    <Search className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Search
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Analyze Ingredients</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter ingredients (comma-separated)"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && analyzeIngredients()}
                  />
                  <Button onClick={analyzeIngredients} disabled={loading || !ingredients.trim()}>
                    <ChefHat className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Analyze
                  </Button>
                </div>
              </div>
            </div>
            
            {recipeResults.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Recipe Results ({recipeResults.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {recipeResults.map((recipe) => (
                    <div key={recipe.id} className="border rounded-lg overflow-hidden">
                      {recipe.image && (
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-3">
                        <h5 className="font-medium text-sm mb-1">{recipe.title}</h5>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>⏱️ {recipe.readyInMinutes} minutes</p>
                          <p>👥 {recipe.servings} servings</p>
                        </div>
                        {recipe.sourceUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => window.open(recipe.sourceUrl, '_blank')}
                          >
                            View Recipe
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Query Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI Query Testing
          </CardTitle>
          <CardDescription>
            Test OpenAI integration with food-related queries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Test AI Query</h4>
              <Textarea
                placeholder="Enter your food-related question (e.g., 'What are healthy breakfast options?')"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={testAIQuery} disabled={aiLoading || !aiPrompt.trim()}>
                  <Bot className={`h-4 w-4 mr-2 ${aiLoading ? 'animate-spin' : ''}`} />
                  Ask AI
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAiPrompt("What are the best ingredients for a healthy breakfast?")}
                >
                  Use Example
                </Button>
              </div>
            </div>
            
            {aiResponse && (
              <div className="space-y-2">
                <h4 className="font-medium">AI Response</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">{aiResponse}</pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 API Debug Information
          </CardTitle>
          <CardDescription>
            Raw API response data and error information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">OpenAI API Status</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-48">
                {JSON.stringify(systemHealth.apis.openai, null, 2)}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Spoonacular API Status</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-48">
                {JSON.stringify(systemHealth.apis.spoonacular, null, 2)}
              </pre>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('/api/debug/openai', '_blank')}
            >
              Test OpenAI Endpoint
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/api/debug/spoonacular', '_blank')}
            >
              Test Spoonacular Endpoint
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}