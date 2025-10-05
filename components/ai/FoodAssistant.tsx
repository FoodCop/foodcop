'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Send, 
  MapPin, 
  Utensils, 
  Lightbulb, 
  Camera,
  Loader2,
  Sparkles
} from 'lucide-react';

interface AIResponse {
  type: 'recommendation' | 'analysis' | 'general';
  content: string;
  timestamp: Date;
}

interface LocationData {
  latitude?: number;
  longitude?: number;
  city?: string;
}

export function FoodAssistant() {
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [userLocation, setUserLocation] = useState<LocationData>({});
  const [preferences, setPreferences] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const { user } = useAuth();

  const sendMessage = async () => {
    if (!message.trim() || !user) return;

    setIsLoading(true);
    const userMessage = message;
    setMessage('');

    try {
      const response = await fetch('/api/ai/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: {
            location: userLocation,
            preferences,
            dietaryRestrictions
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResponses(prev => [...prev, {
          type: 'general',
          content: data.response,
          timestamp: new Date()
        }]);
      } else {
        setResponses(prev => [...prev, {
          type: 'general',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setResponses(prev => [...prev, {
        type: 'general',
        content: 'Sorry, I&apos;m having trouble connecting. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendations = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: preferences || 'general food recommendations',
          location: userLocation.city,
          dietaryRestrictions
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResponses(prev => [...prev, {
          type: 'recommendation',
          content: data.recommendations,
          timestamp: new Date()
        }]);
        setActiveTab('chat');
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocoding to get city name
            const response = await fetch(`/api/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
            const data = await response.json();
            
            setUserLocation({
              latitude,
              longitude,
              city: data.city || 'your area'
            });
          } catch (error) {
            setUserLocation({ latitude, longitude });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="text-center py-12">
          <Bot className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">Sign In to Use AI Assistant</h3>
          <p className="text-gray-600">
            Get personalized food recommendations and culinary advice tailored just for you.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Food Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                AI Food Assistant
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Ask me anything about food, recipes, restaurants, or cooking techniques!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat Messages */}
              <div className="min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
                {responses.length === 0 && (
                  <div className="text-center text-gray-500 mt-12">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Hi! I&apos;m your AI food assistant. Ask me anything about food!</p>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      <Badge variant="outline" className="cursor-pointer" onClick={() => setMessage('What are some good restaurants near me?')}>
                        Find restaurants
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer" onClick={() => setMessage('Give me a healthy recipe for dinner')}>
                        Get recipes
                      </Badge>
                      <Badge variant="outline" className="cursor-pointer" onClick={() => setMessage('What wine pairs with salmon?')}>
                        Food pairing
                      </Badge>
                    </div>
                  </div>
                )}
                
                {responses.map((response, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm">{response.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {response.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {response.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-sm text-gray-500">Thinking...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me about food, recipes, restaurants..."
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isLoading}
                />
                <Button onClick={sendMessage} disabled={isLoading || !message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Food Preferences</label>
                  <Input
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="e.g., Italian, spicy food, vegetarian..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <div className="flex gap-2">
                    <Input
                      value={userLocation.city || ''}
                      onChange={(e) => setUserLocation(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter your city"
                    />
                    <Button variant="outline" onClick={getUserLocation} size="sm">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button onClick={getRecommendations} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Utensils className="h-4 w-4 mr-2" />
                )}
                Get Recommendations
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-500" />
                Food Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Describe a dish and get insights about ingredients, nutrition, and preparation.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>Food analysis feature coming soon!</p>
                <p className="text-sm">Upload images or describe dishes for AI analysis.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}