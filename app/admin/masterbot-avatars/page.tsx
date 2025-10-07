'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

interface MasterbotConfig {
  name: string;
  filename: string;
  description: string;
}

const MASTERBOT_CONFIGS: Record<string, MasterbotConfig> = {
  'spice_scholar_anika': {
    name: 'Anika Kapoor',
    filename: 'anika_spice_scholar.png',
    description: 'Spice scholar with cultural elements'
  },
  'sommelier_seb': {
    name: 'Sebastian LeClair', 
    filename: 'sebastian_sommelier.png',
    description: 'Wine sommelier with elegant background'
  },
  'coffee_pilgrim_omar': {
    name: 'Omar Darzi',
    filename: 'omar_coffee_pilgrim.png', 
    description: 'Coffee expert with warm atmosphere'
  },
  'zen_minimalist_jun': {
    name: 'Jun Tanaka',
    filename: 'jun_zen_minimalist.png',
    description: 'Minimalist with sushi and serene setting'
  },
  'nomad_aurelia': {
    name: 'Aurelia Voss',
    filename: 'aurelia_nomad.png',
    description: 'Street food traveler with urban background'
  },
  'adventure_rafa': {
    name: 'Rafael Mendez',
    filename: 'rafael_adventure.png',
    description: 'Adventure seeker with outdoor food'
  },
  'plant_pioneer_lila': {
    name: 'Lila Cheng',
    filename: 'lila_plant_pioneer.png',
    description: 'Plant-based advocate with sustainable food'
  }
};

export default function MasterbotAvatarUpload() {
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState<any[]>([]);

  const handleFileSelect = (username: string, file: File) => {
    setSelectedFiles(prev => ({ ...prev, [username]: file }));
  };

  const uploadAvatars = async () => {
    if (Object.keys(selectedFiles).length === 0) {
      alert('Please select at least one image');
      return;
    }

    setUploading(true);
    setResults([]);

    try {
      const formData = new FormData();
      
      // Add all selected files to form data
      Object.entries(selectedFiles).forEach(([username, file]) => {
        formData.append(username, file);
      });

      const response = await fetch('/api/admin/upload-masterbot-avatars', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        loadCurrentStatus(); // Refresh status
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const loadCurrentStatus = async () => {
    try {
      const response = await fetch('/api/admin/upload-masterbot-avatars');
      const data = await response.json();
      
      if (data.success) {
        setCurrentStatus(data.masterbots);
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  // Load status on component mount
  useState(() => {
    loadCurrentStatus();
  });

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Masterbot Avatar Upload</CardTitle>
          <p className="text-sm text-gray-600">
            Upload custom avatars for each masterbot. Images should be square and high quality.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Current Status */}
          <div>
            <h3 className="font-semibold mb-3">Current Avatar Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStatus.map((bot) => (
                <div key={bot.username} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{bot.displayName}</div>
                    <div className="text-sm text-gray-600">@{bot.username}</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    bot.hasAvatar ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {bot.hasAvatar ? 'Has Avatar' : 'No Avatar'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <h3 className="font-semibold mb-3">Upload New Avatars</h3>
            <div className="space-y-4">
              {Object.entries(MASTERBOT_CONFIGS).map(([username, config]) => (
                <div key={username} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{config.name}</div>
                      <div className="text-sm text-gray-600">@{username}</div>
                      <div className="text-xs text-gray-500">{config.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(username, file);
                        }}
                        className="text-sm"
                      />
                      {selectedFiles[username] && (
                        <span className="text-xs text-green-600">✓ Selected</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <Button 
              onClick={uploadAvatars} 
              disabled={uploading || Object.keys(selectedFiles).length === 0}
              className="px-8"
            >
              {uploading ? 'Uploading...' : `Upload ${Object.keys(selectedFiles).length} Avatar(s)`}
            </Button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Upload Results</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className={`p-3 rounded border-l-4 ${
                    result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                  }`}>
                    <div className="font-medium">
                      {MASTERBOT_CONFIGS[result.username]?.name || result.username}
                    </div>
                    {result.success ? (
                      <div className="text-sm text-green-700">
                        ✓ Successfully uploaded: {result.fileName}
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        ✗ Failed: {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}