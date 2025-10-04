'use client';

import React from 'react';
import { Marker } from 'react-map-gl/maplibre';
import { brandColors } from '@/lib/scout/mapLibreConfig';

export interface UserLocationMarkerProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  showAccuracyCircle?: boolean;
  onClick?: () => void;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  latitude,
  longitude,
  accuracy,
  address,
  showAccuracyCircle = false,
  onClick
}) => {
  // Create accuracy circle radius in pixels (approximation)
  const accuracyRadius = accuracy ? Math.min(accuracy / 10, 50) : 0;

  return (
    <>
      {/* Accuracy Circle (behind marker) */}
      {showAccuracyCircle && accuracy && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: `${accuracyRadius * 2}px`,
            height: `${accuracyRadius * 2}px`,
            backgroundColor: 'rgba(50, 153, 55, 0.2)',
            border: '2px solid rgba(50, 153, 55, 0.5)',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />
      )}

      {/* User Location Marker */}
      <Marker
        longitude={longitude}
        latitude={latitude}
        anchor="center"
        onClick={onClick}
      >
        <div
          className="user-location-marker"
          style={{
            position: 'relative',
            cursor: onClick ? 'pointer' : 'default'
          }}
        >
          {/* Outer ring (pulsing animation) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '24px',
              height: '24px',
              backgroundColor: 'rgba(50, 153, 55, 0.3)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'userLocationPulse 2s infinite',
              zIndex: 1
            }}
          />
          
          {/* Middle ring */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '16px',
              height: '16px',
              backgroundColor: brandColors.primary,
              border: '2px solid white',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              zIndex: 2
            }}
          />
          
          {/* Inner dot */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '6px',
              height: '6px',
              backgroundColor: 'white',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3
            }}
          />
          
          {/* Location accuracy indicator */}
          {accuracy && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                padding: '2px 6px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                fontSize: '10px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                zIndex: 4,
                pointerEvents: 'none'
              }}
            >
              ±{Math.round(accuracy)}m
            </div>
          )}
        </div>
      </Marker>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes userLocationPulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          70% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0;
          }
        }
        
        .user-location-marker:hover .accuracy-tooltip {
          opacity: 1;
        }
      `}</style>
    </>
  );
};

export default UserLocationMarker;