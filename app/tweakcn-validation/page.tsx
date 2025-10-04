"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TweakCNValidationPage() {
  const checkCSS = () => {
    const root = document.documentElement;
    const computedStyles = getComputedStyle(root);
    
    console.log('=== TweakCN Token Validation ===');
    
    const tokens = [
      '--background',
      '--foreground', 
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--secondary-foreground',
      '--accent',
      '--accent-foreground',
      '--muted',
      '--muted-foreground',
      '--card',
      '--card-foreground',
      '--border',
      '--ring',
      '--font-sans',
      '--radius'
    ];
    
    tokens.forEach(token => {
      const value = computedStyles.getPropertyValue(token);
      console.log(`${token}: ${value}`);
    });
    
    // Check if TweakCN CSS is loaded
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const tweakCNLink = links.find(link => (link as HTMLLinkElement).href.includes('tweakcn.com'));
    console.log('TweakCN CSS loaded:', tweakCNLink ? 'YES' : 'NO');
    
    if (tweakCNLink) {
      console.log('TweakCN URL:', (tweakCNLink as HTMLLinkElement).href);
    }
  };

  return (
    <div className="min-h-screen p-8 space-y-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          TweakCN Token Validation
        </h1>
        <p className="text-muted-foreground mb-8">
          Comprehensive test to ensure TweakCN integration is working properly.
        </p>
        
        {/* Token Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Primary Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Primary Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-primary text-primary-foreground p-3 rounded text-sm">
                bg-primary + text-primary-foreground
              </div>
              <div className="bg-primary/20 text-primary p-3 rounded text-sm">
                bg-primary/20 + text-primary
              </div>
            </CardContent>
          </Card>

          {/* Secondary Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Secondary Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-secondary text-secondary-foreground p-3 rounded text-sm">
                bg-secondary + text-secondary-foreground
              </div>
              <div className="bg-secondary/20 text-secondary p-3 rounded text-sm">
                bg-secondary/20 + text-secondary
              </div>
            </CardContent>
          </Card>

          {/* Accent Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Accent Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-accent text-accent-foreground p-3 rounded text-sm">
                bg-accent + text-accent-foreground
              </div>
              <div className="bg-accent/20 text-accent p-3 rounded text-sm">
                bg-accent/20 + text-accent
              </div>
            </CardContent>
          </Card>

          {/* Muted Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Muted Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-muted text-muted-foreground p-3 rounded text-sm">
                bg-muted + text-muted-foreground
              </div>
              <div className="text-muted-foreground p-3 text-sm">
                text-muted-foreground only
              </div>
            </CardContent>
          </Card>

          {/* Card Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Card Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="bg-card text-card-foreground border border-border p-3 rounded text-sm">
                bg-card + text-card-foreground + border-border
              </div>
            </CardContent>
          </Card>

          {/* Interactive Tokens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Interactive Tokens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <input 
                className="w-full bg-input border border-input text-foreground p-2 rounded text-sm"
                placeholder="bg-input + border-input"
                readOnly
              />
              <div className="w-full h-2 bg-ring rounded"></div>
              <p className="text-xs text-muted-foreground">Ring color (focus states)</p>
            </CardContent>
          </Card>
        </div>

        {/* Button Variants Test */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Button Variants (ShadCN)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
              <Button variant="destructive">Destructive Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Typography Test */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Typography (TweakCN Fonts)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-sans text-lg mb-2">Sans Serif (var(--font-sans) → Inter)</p>
              <p className="font-serif text-lg mb-2">Serif (var(--font-serif) → Source Serif 4)</p>
              <p className="font-mono text-lg mb-2">Monospace (var(--font-mono) → JetBrains Mono)</p>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Heading 1</h1>
              <h2 className="text-2xl font-semibold mb-2">Heading 2</h2>
              <p className="text-base mb-2">Body text with normal weight</p>
              <p className="text-sm text-muted-foreground">Small muted text</p>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={checkCSS} className="mb-4">
              Check CSS Variables (Console)
            </Button>
            <div className="bg-muted p-4 rounded font-mono text-xs space-y-1">
              <p><strong>Theme Mode:</strong> Light (forced)</p>
              <p><strong>TweakCN URL:</strong> https://tweakcn.com/themes/cmg4w44p4000a04kze8ltdnnv/css</p>
              <p><strong>CSS Loading:</strong> tokens.css → TweakCN import → globals.css</p>
              <p><strong>Token Strategy:</strong> TweakCN as SOT, no overrides</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}