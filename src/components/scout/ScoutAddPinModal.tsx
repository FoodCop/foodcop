'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X, MapPin, ChevronRight, ChevronLeft, Star,
  Upload, Clock, Check, Loader2, Search, Trash2, Plus
} from 'lucide-react';
import { getGoogleMaps } from '@/types/scout';
import { createClient } from '@/lib/supabase/client';
import { foodCardService } from '@/lib/services/foodCardService';
import { FlavorSliders } from '@/components/create/shared/FlavorSliders';
import { TagChips } from '@/components/create/shared/TagChips';
import { DEFAULT_FLAVOR, emptyCardTags, TYPE_META, type CardTags, type FlavorVector, type FoodCardType } from '@/lib/types/foodCard';

const CUISINES = [
  'Italian', 'Japanese', 'Mexican', 'Indian', 'Chinese', 'French', 'Thai',
  'Mediterranean', 'American', 'Korean', 'Middle Eastern', 'Greek', 'Spanish',
  'Vietnamese', 'Brazilian', 'Peruvian', 'Ethiopian', 'Turkish', 'Fusion', 'Other'
];

// This is the Restaurant family (RESTAURANT_VISIT/CAFE_VISIT/STREET_FOOD) of
// the master Create Card flow - the wizard already worked end-to-end, so it's
// generalized in place (cardType prop + a Flavor/Tags step) rather than
// duplicated into a parallel component. ScoutView's long-press-to-pin entry
// point keeps using this unchanged (defaults to RESTAURANT_VISIT).
const STEPS = ['Search', 'Pin', 'Identity', 'Photos', 'Flavor', 'Details', 'Done'];

interface ScoutAddPinModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialCoordinates?: { lat: number; lng: number };
  cardType?: FoodCardType;
}

const readImageFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const ScoutAddPinModal = ({ onClose, onSuccess, initialCoordinates, cardType = 'RESTAURANT_VISIT' }: ScoutAddPinModalProps) => {
  const meta = TYPE_META[cardType];
  const [currentStep, setCurrentStep] = useState(initialCoordinates ? 2 : 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [coordinates, setCoordinates] = useState(initialCoordinates || { lat: 40.7128, lng: -74.0060 });
  const [address, setAddress] = useState('');
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [identity, setIdentity] = useState({ name: '', cuisine: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const [tags, setTags] = useState<CardTags>(emptyCardTags());
  const [flavorProfile, setFlavorProfile] = useState<FlavorVector>(DEFAULT_FLAVOR);
  const [details, setDetails] = useState({
    rating: 5,
    review: '',
    hours: {
      monday: '09:00 - 22:00',
      tuesday: '09:00 - 22:00',
      wednesday: '09:00 - 22:00',
      thursday: '09:00 - 22:00',
      friday: '09:00 - 23:00',
      saturday: '10:00 - 23:00',
      sunday: '10:00 - 21:00',
    }
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Step 0: Autocomplete
  useEffect(() => {
    if (currentStep === 0 && autocompleteInputRef.current) {
      const google = getGoogleMaps();
      if (!google || !google.places) return;

      const autocomplete = new google.places.Autocomplete(autocompleteInputRef.current, {
        fields: ['formatted_address', 'geometry', 'name', 'place_id'],
        types: ['establishment', 'geocode']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setCoordinates({ lat, lng });
          setAddress(place.formatted_address || place.name || '');
          setPlaceId(place.place_id || null);
          if (place.name) {
            setIdentity(prev => ({ ...prev, name: place.name }));
          }
          setCurrentStep(1);
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [currentStep]);

  const handleManualSearch = async () => {
    if (!address) return;
    setIsLoading(true);
    const google = getGoogleMaps();
    if (!google) return;

    const geocoder = new google.Geocoder();
    try {
      const response = await geocoder.geocode({ address });
      if (response.results?.[0]) {
        const { lat, lng } = response.results[0].geometry.location;
        setCoordinates({ lat: lat(), lng: lng() });
        setAddress(response.results[0].formatted_address);
        setCurrentStep(1);
      } else {
        setError('Could not find this location.');
      }
    } catch (err) {
      setError('Geocoding service failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Map pinning
  useEffect(() => {
    if (currentStep === 1 && mapRef.current && !mapInstanceRef.current) {
      const google = getGoogleMaps();
      if (!google) return;

      const map = new google.Map(mapRef.current, {
        center: coordinates,
        zoom: 15,
        disableDefaultUI: true,
        styles: [
          { featureType: 'landscape' as any, elementType: 'all', stylers: [{ color: '#1c1c1c' }] },
          { featureType: 'water' as any, elementType: 'all', stylers: [{ color: '#000000' }] },
          { featureType: 'road' as any, elementType: 'all', stylers: [{ color: '#2c2c2c' }] },
          { featureType: 'poi' as any, elementType: 'all', stylers: [{ visibility: 'off' }] },
        ]
      });

      const marker = new google.Marker({
        position: coordinates,
        map,
        draggable: true,
        animation: google.Animation.DROP,
        icon: {
          path: google.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 10,
          fillColor: '#f2a93b',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        }
      });

      const geocoder = new google.Geocoder();
      const updateAddress = async (pos: { lat: number; lng: number }) => {
        try {
          const res = await geocoder.geocode({ location: pos });
          if (res.results?.[0]) setAddress(res.results[0].formatted_address);
        } catch (e) { }
      };

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        const newPos = { lat: pos.lat(), lng: pos.lng() };
        setCoordinates(newPos);
        updateAddress(newPos);
      });

      map.addListener('click', (e: any) => {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        marker.setPosition(newPos);
        setCoordinates(newPos);
        updateAddress(newPos);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }
  }, [currentStep]);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.panTo(coordinates);
      markerRef.current.setPosition(coordinates);
    }
  }, [coordinates]);

  // Submit — routes through foodCardService so this Restaurant-family card
  // lands in food_cards (with flavor_profile + tags, like every other card
  // type) while still dual-writing to fuzo_locations for the Scout map.
  const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase not configured');
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (!userId) throw new Error('You must be logged in to pin a location');

      const finalTags: CardTags = identity.cuisine && !tags.cuisine.includes(identity.cuisine)
        ? { ...tags, cuisine: [...tags.cuisine, identity.cuisine] }
        : tags;

      const result = await foodCardService.createFoodCard(
        {
          cardType,
          title: identity.name,
          caption: details.review,
          tags: finalTags,
          flavorProfile,
          placeId,
          lat: coordinates.lat,
          lng: coordinates.lng,
          address,
          imageUrl: photos[0],
        },
        'PUBLISHED',
      );

      if (result.success) {
        setCurrentStep(6);
      } else {
        throw new Error(result.error || 'Failed to save discovery');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="scout-wizard">
      {/* Header */}
      <header className="scout-wizard__header">
        <button onClick={onClose} className="scout-wizard__close">
          <X size={24} />
        </button>
        {/* Stepper */}
        <div className="scout-wizard__stepper">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className="scout-wizard__step">
                <div className={`scout-wizard__step-dot${i < currentStep ? ' is-done' : i === currentStep ? ' is-current' : ''}`}>
                  {i < currentStep ? <Check size={14} /> : i + 1}
                </div>
                <span className={`scout-wizard__step-label${i === currentStep ? ' is-current' : ''}`}>{step}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`scout-wizard__step-connector${i < currentStep ? ' is-done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="scout-wizard__body">
        {error && (
          <div className="scout-wizard__error">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={18} /></button>
          </div>
        )}

        {/* STEP 0: SEARCH */}
        {currentStep === 0 && (
          <div className="scout-wizard__panel">
            <div className="scout-wizard__panel-header">
              <span className="scout-wizard__badge">{meta.emoji} {meta.label}</span>
              <h2 className="scout-wizard__heading">Find the Spot</h2>
              <p className="scout-wizard__hint">Search for a restaurant or address</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="scout-wizard__search-field">
                <Search size={20} />
                <input
                  ref={autocompleteInputRef}
                  autoFocus
                  placeholder="e.g. Nobu New York or 123 Main St"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="scout-wizard__search-input"
                />
              </div>
              <p className="scout-wizard__hint" style={{ textAlign: 'center' }}>
                Start typing to see suggestions.
              </p>
            </div>
            <button
              onClick={handleManualSearch}
              disabled={!address || isLoading}
              className={`scout-wizard__cta${address ? ' is-ready' : ''}`}
            >
              {isLoading ? <Loader2 className="scout-spin" /> : <>Next: Pinpoint <ChevronRight size={18} /></>}
            </button>
          </div>
        )}

        {/* STEP 1: PINPOINT */}
        {currentStep === 1 && (
          <div className="scout-wizard__map">
            <div ref={mapRef} className="scout-wizard__map-canvas" />
            <div className="scout-wizard__map-overlay">
              <div className="scout-wizard__map-overlay-inner">
                <p className="scout-wizard__address">{address}</p>
                <div className="scout-wizard__nav-row">
                  <button onClick={() => setCurrentStep(0)} className="scout-wizard__back">Back</button>
                  <button onClick={() => setCurrentStep(2)} className="scout-wizard__next">Next: Identity</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: IDENTITY */}
        {currentStep === 2 && (
          <div className="scout-wizard__panel">
            <div className="scout-wizard__panel-header">
              <h2 className="scout-wizard__heading">The Spot</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="scout-wizard__field-label">Restaurant Name</label>
                <input
                  autoFocus
                  placeholder="e.g. Mama Mia's"
                  value={identity.name}
                  onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                  className="scout-wizard__text-input"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="scout-wizard__field-label">Cuisine</label>
                <div className="scout-wizard__cuisine-grid">
                  {CUISINES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setIdentity({ ...identity, cuisine: c })}
                      className={`scout-wizard__cuisine-chip${identity.cuisine === c ? ' is-selected' : ''}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="scout-wizard__nav-row">
              <button onClick={() => setCurrentStep(1)} className="scout-wizard__back">Back</button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!identity.name || !identity.cuisine}
                className="scout-wizard__next"
              >
                Next: Photos
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTOS */}
        {currentStep === 3 && (
          <div className="scout-wizard__panel" style={{ minHeight: '100%' }}>
            <div className="scout-wizard__panel-header">
              <h2 className="scout-wizard__heading">Media</h2>
            </div>
            <div className="scout-wizard__photos-grid">
              {photos.map((p, idx) => (
                <div key={idx} className="scout-wizard__photo">
                  <img src={p} alt="" />
                  <button
                    onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    className="scout-wizard__photo-remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <label className="scout-wizard__photo-add">
                  <div className="scout-wizard__photo-add-icon">
                    <Plus size={24} />
                  </div>
                  <span className="scout-wizard__photo-add-label">Add Photo</span>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const img = await readImageFileAsDataUrl(file);
                        setPhotos(prev => [...prev, img]);
                      } catch (err) { }
                    }
                  }} />
                </label>
              )}
            </div>
            <div className="scout-wizard__nav-row" style={{ paddingTop: 16 }}>
              <button onClick={() => setCurrentStep(2)} className="scout-wizard__back">Back</button>
              <button onClick={() => setCurrentStep(4)} className="scout-wizard__next">Next: Flavor</button>
            </div>
          </div>
        )}

        {/* STEP 4: FLAVOR & TAGS */}
        {currentStep === 4 && (
          <div className="scout-wizard__panel">
            <div className="scout-wizard__panel-header">
              <span className="scout-wizard__badge">{meta.emoji} {meta.label}</span>
              <h2 className="scout-wizard__heading">Taste Profile</h2>
              <p className="scout-wizard__hint">Powers Discover&apos;s flavor matching for this spot</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <TagChips value={tags} onChange={setTags} categories={['meal_type', 'diet']} showPriceLevel />
              <FlavorSliders value={flavorProfile} onChange={setFlavorProfile} />
            </div>
            <div className="scout-wizard__nav-row">
              <button onClick={() => setCurrentStep(3)} className="scout-wizard__back">Back</button>
              <button onClick={() => setCurrentStep(5)} className="scout-wizard__next">Next: Details</button>
            </div>
          </div>
        )}

        {/* STEP 5: DETAILS */}
        {currentStep === 5 && (
          <div className="scout-wizard__details-wrap">
            <div className="scout-wizard__panel-header" style={{ gap: 0 }}>
              <h2 className="scout-wizard__heading">Insights</h2>
            </div>
            <div style={{ display: 'grid', gap: 48 }}>
              {/* Rating */}
              <div className="scout-wizard__rating-block">
                <div className="scout-wizard__rating-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setDetails({ ...details, rating: s })}>
                      <Star size={32} fill={s <= details.rating ? "#f2a93b" : "none"} style={{ color: s <= details.rating ? '#f2a93b' : '#292524' }} />
                    </button>
                  ))}
                </div>
                <p className="scout-wizard__hint">Master Rating</p>
              </div>
              {/* Review */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="scout-wizard__field-label">Personal Review</label>
                <textarea
                  placeholder="Tell the community about your discovery..."
                  value={details.review}
                  onChange={(e) => setDetails({ ...details, review: e.target.value })}
                  className="scout-wizard__textarea"
                />
              </div>
              {/* Hours */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
                  <Clock size={16} style={{ color: '#f2a93b' }} />
                  <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#78716c' }}>Opening Hours</span>
                </div>
                <div className="scout-wizard__hours-card">
                  {Object.entries(details.hours).map(([day, time]) => (
                    <div key={day} className="scout-wizard__hours-row">
                      <span className="scout-wizard__hours-day">{day.slice(0, 3)}</span>
                      <input
                        value={time}
                        onChange={(e) => setDetails({ ...details, hours: { ...details.hours, [day]: e.target.value } })}
                        className="scout-wizard__hours-input"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="scout-wizard__submit-row">
              <button onClick={() => setCurrentStep(4)} className="scout-wizard__back">Back</button>
              <button
                onClick={handleFinalSubmit}
                disabled={isLoading}
                className="scout-wizard__submit"
              >
                {isLoading ? <Loader2 size={20} className="scout-spin" /> : <>Lock Discovery <Check size={20} /></>}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: SUCCESS */}
        {currentStep === 6 && (
          <div className="scout-wizard__success">
            <div className="scout-wizard__success-icon">
              <Check size={80} strokeWidth={4} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 className="scout-wizard__success-heading">Pin Locked</h2>
              <p className="scout-wizard__success-sub">Discovery successfully syndicated to FUZO community</p>
            </div>
            <button
              onClick={() => { onSuccess(); onClose(); }}
              className="scout-wizard__success-btn"
            >
              Back to Scout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
