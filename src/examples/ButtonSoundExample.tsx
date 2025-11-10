import React from 'react';
import { Button } from '../components/ui/button';
import { useClickSound, useSuccessSound, useHoverSound } from '../hooks/useButtonSound';

/**
 * Example component showing how to use button sounds
 */
export const ButtonSoundExample: React.FC = () => {
  const playClick = useClickSound();
  const playSuccess = useSuccessSound();
  const playHover = useHoverSound();

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Button Sound Examples</h2>
      
      {/* Simple click sound */}
      <Button onClick={() => playClick()}>
        Click Sound
      </Button>

      {/* Success sound on action */}
      <Button 
        onClick={() => {
          playSuccess();
          // Your action here
        }}
      >
        Success Sound
      </Button>

      {/* Hover sound */}
      <Button 
        onMouseEnter={() => playHover()}
        onClick={() => playClick()}
      >
        Hover + Click Sound
      </Button>
    </div>
  );
};
