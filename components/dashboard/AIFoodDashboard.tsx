'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  TrendingUp, 
  MapPin, 
  Heart, 
  Clock, 
  Utensils,
  Sparkles,
  ChefHat,
  Star,
  Users
} from 'lucide-react';

interface AIInsight {
  title: string;
  content: string;
  type: 'recommendation' | 'trend' | 'health' | 'social';
  timestamp: Date;
}

interface DashboardStats {
  savedRestaurants: number;
  favoriteRecipes: number;
  friendConnections: number;
  aiInteractions: number;
}

export function AIFoodDashboard() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    savedRestaurants: 0,
    favoriteRecipes: 0,
    friendConnections: 0,
    aiInteractions: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Load user stats
      const statsResponse = await fetch('/api/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats);
      }

      // Load AI insights
      const insightsResponse = await fetch('/api/dashboard/ai-insights');
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.insights || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-12">
          <Bot className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Sign In for Personalized Dashboard</h3>
          <p className="text-gray-600">
            Get AI-powered food insights, track your culinary journey, and connect with fellow food lovers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saved Places</p>
                <p className="text-2xl font-bold">{stats.savedRestaurants}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Favorite Recipes</p>
                <p className="text-2xl font-bold">{stats.favoriteRecipes}</p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Food Friends</p>
                <p className="text-2xl font-bold">{stats.friendConnections}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Chats</p>
                <p className="text-2xl font-bold">{stats.aiInteractions}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              AI Food Insights
            </CardTitle>
            <Button 
              onClick={generateInsights} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Bot className="h-4 w-4 animate-pulse mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get New Insights
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Personalized recommendations and trends based on your food preferences.
          </p>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
              <p className="text-gray-600 mb-4">
                Generate AI-powered insights about your food preferences and trends.
              </p>
              <Button onClick={generateInsights} disabled={isLoading}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Your First Insights
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      {insight.type === 'recommendation' && <Utensils className="h-4 w-4 text-blue-500" />}
                      {insight.type === 'trend' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {insight.type === 'health' && <Heart className="h-4 w-4 text-red-500" />}
                      {insight.type === 'social' && <Users className="h-4 w-4 text-purple-500" />}
                      {insight.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {insight.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {insight.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{insight.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/ai'}>
          <CardContent className="p-6 text-center">
            <Bot className="h-12 w-12 mx-auto mb-3 text-blue-500" />
            <h3 className="font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-600">Get personalized food recommendations</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/scout'}>
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <h3 className="font-semibold mb-2">Scout Restaurants</h3>
            <p className="text-sm text-gray-600">Discover new places to eat</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/chat'}>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-purple-500" />
            <h3 className="font-semibold mb-2">Food Chat</h3>
            <p className="text-sm text-gray-600">Connect with food enthusiasts</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}