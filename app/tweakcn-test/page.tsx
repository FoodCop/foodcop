"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_THEME_CONFIG } from "@/lib/figma-token-map";

export default function TweakCNTestPage() {
  const testThemeInfo = () => {
    console.log('TweakCN Theme Configuration:', PROJECT_THEME_CONFIG);
    console.log('Current CSS Variables:');
    const computedStyles = getComputedStyle(document.documentElement);
    console.log('--primary:', computedStyles.getPropertyValue('--primary'));
    console.log('--secondary:', computedStyles.getPropertyValue('--secondary'));
    console.log('--accent:', computedStyles.getPropertyValue('--accent'));
  };

  return (
    <div className="min-h-screen p-8 space-y-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Phase 1: TweakCN Integration Test (Corrected)
        </h1>
        <p className="text-muted-foreground mb-8">
          Testing TweakCN theme integration - using TweakCN colors as-is, mapping old FUZO hardcoded values to TweakCN semantic tokens.
        </p>
        
        {/* TweakCN Token Test Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Primary Colors Test */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Primary Theme Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary text-primary-foreground p-4 rounded">
                <p className="font-semibold">Primary Color</p>
                <p className="text-sm opacity-90">TweakCN Primary (was FUZO yellow #ff9500)</p>
                <p className="text-xs opacity-70">oklch(0.8076 0.1653 73.4872)</p>
              </div>
              <Button onClick={testThemeInfo} className="w-full">
                Check Theme Variables (Console)
              </Button>
            </CardContent>
          </Card>

          {/* Secondary Colors Test */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Secondary Theme Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-secondary text-secondary-foreground p-4 rounded">
                <p className="font-semibold">Secondary Color</p>
                <p className="text-sm opacity-90">TweakCN Secondary (was FUZO navy #0b1f3a)</p>
                <p className="text-xs opacity-70">oklch(0.9670 0.0029 264.5419)</p>
              </div>
              <div className="bg-accent text-accent-foreground p-4 rounded">
                <p className="font-semibold">Accent Color</p>
                <p className="text-sm opacity-90">TweakCN Accent (was FUZO coral #f14c35)</p>
                <p className="text-xs opacity-70">oklch(0.9869 0.0214 95.2774)</p>
              </div>
            </CardContent>
          </Card>

          {/* Typography Test */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Typography Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold text-primary">Heading 1</p>
              <p className="text-xl font-semibold text-secondary">Heading 2</p>
              <p className="text-base text-foreground">Body text - normal</p>
              <p className="text-sm text-muted-foreground">Muted text - small</p>
            </CardContent>
          </Card>

          {/* Component Variations */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Component Variations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="default" className="w-full">Primary Button</Button>
              <Button variant="secondary" className="w-full">Secondary Button</Button>
              <Button variant="outline" className="w-full">Outline Button</Button>
              <Button variant="ghost" className="w-full">Ghost Button</Button>
            </CardContent>
          </Card>
        </div>

        {/* Token Mapping Display */}
        <Card className="mt-8 border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Token Mapping Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded font-mono text-sm space-y-2">
              <p><strong>Approach:</strong> Use TweakCN theme as-is, map old hardcoded colors to semantic tokens</p>
              <div className="mt-4 space-y-1">
                <p><strong>Color Transformations:</strong></p>
                <p className="text-xs">Old #ff9500 (FUZO Yellow) → hsl(var(--primary)) → TweakCN Primary</p>
                <p className="text-xs">Old #f14c35 (FUZO Coral) → hsl(var(--accent)) → TweakCN Accent</p>
                <p className="text-xs">Old #0b1f3a (FUZO Navy) → hsl(var(--secondary)) → TweakCN Secondary</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Info Display */}
        <Card className="mt-8 border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">TweakCN Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded font-mono text-sm">
              <p><strong>Theme URL:</strong> {PROJECT_THEME_CONFIG.tweakCNUrl}</p>
              <p><strong>Theme ID:</strong> {PROJECT_THEME_CONFIG.tweakCNThemeId}</p>
              <p><strong>Project:</strong> {PROJECT_THEME_CONFIG.projectName}</p>
              <p><strong>Manual Overrides:</strong> {PROJECT_THEME_CONFIG.manualOverrides.length} components</p>
            </div>
          </CardContent>
        </Card>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-green-100 border border-green-300 p-4 rounded">
            <h3 className="font-semibold text-green-800">✅ TweakCN Import</h3>
            <p className="text-green-700 text-sm">CSS imported in tokens.css</p>
          </div>
          <div className="bg-green-100 border border-green-300 p-4 rounded">
            <h3 className="font-semibold text-green-800">✅ Hardcoded Colors Removed</h3>
            <p className="text-green-700 text-sm">All FUZO colors removed from CSS</p>
          </div>
          <div className="bg-green-100 border border-green-300 p-4 rounded">
            <h3 className="font-semibold text-green-800">✅ Tailwind Config Updated</h3>
            <p className="text-green-700 text-sm">Using semantic tokens</p>
          </div>
        </div>
      </div>
    </div>
  );
}