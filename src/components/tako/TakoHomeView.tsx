'use client';

import { useEffect, useState } from 'react';
import { Loader2, MapPin, Play, Search } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import AppDock from '@/components/nav/AppDock';
import TakoAssistant from '@/components/tako/TakoAssistant';
import { ScoutAddPinModal } from '@/components/scout/ScoutAddPinModal';
import { VideoPlayerModal } from '@/components/ui/VideoPlayerModal';
import { UserSettingsService, DEFAULT_USER_SETTINGS, type UserSettings } from '@/lib/services/userSettingsService';
import { aggregateForUser, getOnboardingPrefs, pickTopCuisine, getSuggestedVideos, type SuggestedVideo } from '@/lib/services/recommendationService';
import { Rail, SkeletonCards } from '@/components/dashboard/Rail';
import DashPlaceCard from '@/components/dashboard/DashPlaceCard';
import { NearbyCities } from '@/components/dashboard/NearbyCities';
import { useNearbyPlaces } from '@/components/dashboard/useNearbyPlaces';
import { LocationChip } from '@/components/dashboard/LocationChip';
import FinishProfileCard from '@/components/onboarding/FinishProfileCard';

// The Tako page (/tako): the dock's centre button and the navbar logo open it
// (client, 2026-11-04). It is the original Tako screen (mascot, ask bar, Eat
// Out / Cook / Explore and the chat; TakoAssistant variant="page") with what
// used to be Home's "For you" underneath: Explore cities / countries,
// Recommended Restaurants and Watch & Cook.
// Everything here is FUZO's own data; Google is only called by "Show more
// nearby" (docs/GOOGLE_COST_PLAN.md). Styles: _tako-home.scss.

export default function TakoHomeView() {
  const { user } = useAuth();

  const [tasteLoaded, setTasteLoaded] = useState(false);
  const [topCuisine, setTopCuisine] = useState<string | undefined>(undefined);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [dnaLuxury, setDnaLuxury] = useState<number | undefined>(undefined);
  const [videos, setVideos] = useState<SuggestedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [activeVideo, setActiveVideo] = useState<SuggestedVideo | null>(null);

  // Restaurant-pin prompt for business profiles - null = not yet known.
  const [isBusinessProfile, setIsBusinessProfile] = useState<boolean | null>(null);
  const [hasPinnedRestaurant, setHasPinnedRestaurant] = useState<boolean | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Taste aggregate + videos - keyed off the user's own data, no location needed.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const settingsResult = await UserSettingsService.get();
      const userSettings = settingsResult.success && settingsResult.data ? settingsResult.data : DEFAULT_USER_SETTINGS;
      if (cancelled) return;
      setSettings(userSettings);

      const supabase = createClient();
      if (supabase) {
        const { data: taste } = await supabase.from('taste_profiles').select('dna_scores').eq('user_id', user.id).maybeSingle();
        if (!cancelled && taste?.dna_scores) setDnaLuxury(taste.dna_scores.luxury);
      }

      const [aggregateResult, prefs] = await Promise.all([aggregateForUser(user.id, userSettings.useActivityForMl), getOnboardingPrefs(user.id)]);
      if (cancelled) return;
      setTasteLoaded(true);
      const cuisine = pickTopCuisine(aggregateResult, prefs.cuisines);
      setTopCuisine(cuisine);

      const videoResults = await getSuggestedVideos(cuisine);
      if (!cancelled) {
        setVideos(videoResults);
        setLoadingVideos(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Business profiles get nudged to pin their own place (grows FUZO's local dataset).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const supabase = createClient();
    if (!supabase) return;

    (async () => {
      const { data: profileRow } = await supabase.from('users').select('profile_type').eq('id', user.id).maybeSingle();
      if (cancelled) return;
      const isBusiness = profileRow?.profile_type === 'business';
      setIsBusinessProfile(isBusiness);
      if (!isBusiness) {
        setHasPinnedRestaurant(true);
        return;
      }
      const { data: pinnedCard } = await supabase
        .from('food_cards')
        .select('id')
        .eq('user_id', user.id)
        .in('card_type', ['RESTAURANT_VISIT', 'CAFE_VISIT', 'STREET_FOOD'])
        .limit(1)
        .maybeSingle();
      if (!cancelled) setHasPinnedRestaurant(!!pinnedCard);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Restaurants (FUZO first; Google only on "Show more nearby") near the user's GPS location or saved home area.
  const { loc, recommended, retryGps, setPickedLocation, chooseHomeArea, googleOn, googleLoading, googleError, showGoogle } = useNearbyPlaces({
    enabled: tasteLoaded,
    topCuisine,
    radiusKm: settings.discoveryRadiusKm,
    hiddenGems: settings.showHiddenGems,
    luxury: dnaLuxury,
  });

  // Google search costs money, so it only runs when someone asks for it.
  const moreNearby = (
    <button type="button" className="fz-dash-rail__more" onClick={showGoogle} disabled={googleLoading}>
      {googleLoading ? <Loader2 size={14} className="scout-spin" aria-hidden="true" /> : <Search size={14} aria-hidden="true" />} Show more nearby
    </button>
  );

  const restaurants = () => {
    if (loc.status === 'unavailable') return <div className="fz-dash-notice">Set your location to see restaurants near you.</div>;
    if (recommended === null) return <SkeletonCards />;
    if (recommended.length === 0) {
      return (
        <div className="fz-dash-notice">
          <span>{googleOn ? 'No restaurants found nearby yet - try a bigger discovery radius in Settings.' : 'No FUZO restaurants near you yet.'}</span>
          {!googleOn && <div className="fz-dash-notice__actions">{moreNearby}</div>}
        </div>
      );
    }
    return recommended.map((p) => <DashPlaceCard key={p.key} place={p} lens="match" />);
  };

  const extras = user ? (
    <div className="fz-tako-more">
      {loc.status === 'unavailable' && <LocationChip loc={loc} onUseCurrent={retryGps} onUseHome={chooseHomeArea} onPick={setPickedLocation} />}

      <NearbyCities
        loc={loc}
        locationSlot={
          loc.status === 'ready' ? (
            <LocationChip loc={loc} onUseCurrent={retryGps} onUseHome={chooseHomeArea} onPick={setPickedLocation} variant="inline" />
          ) : undefined
        }
      />

      <Rail
        title="Recommended Restaurants"
        sub={topCuisine ? `Picked for your love of ${topCuisine}` : 'Picked for you'}
        link={{ href: '/scout', label: 'Scout' }}
        previews={(recommended ?? []).map((p) => p.image)}
        extraAction={!googleOn && recommended && recommended.length > 0 && loc.status === 'ready' ? moreNearby : undefined}
      >
        {restaurants()}
      </Rail>
      {googleError && (
        <p className="fz-dash-rail__error" role="status">
          {googleError}
        </p>
      )}

      {(loadingVideos || videos.length > 0) && (
        <Rail title="Watch & Cook" sub={topCuisine ? `${topCuisine} on YouTube` : 'Trending recipes'} wide previews={videos.map((v) => v.thumbnail)}>
          {loadingVideos ? (
            <SkeletonCards wide />
          ) : (
            videos.map((video) => (
              <button key={video.videoId} type="button" className="fz-dash-card fz-dash-card--wide" onClick={() => setActiveVideo(video)} aria-label={`Play: ${video.title}`}>
                {video.thumbnail && <img className="fz-dash-card__img" src={video.thumbnail} alt="" loading="lazy" />}
                <span className="fz-dash-card__shade" />
                <span className="fz-dash-card__play">
                  <Play size={18} fill="currentColor" />
                </span>
                <span className="fz-dash-card__body">
                  <span className="fz-dash-card__title">{video.title}</span>
                  <span className="fz-dash-card__sub">{video.channelTitle}</span>
                </span>
              </button>
            ))
          )}
        </Rail>
      )}

      {/* Skipped onboarding questions (client, 2026-10-18). Renders nothing once all done. */}
      <FinishProfileCard where="home" />

      {isBusinessProfile && hasPinnedRestaurant === false && (
        <div className="fz-dash-nudge">
          <div>
            <strong>Your restaurant isn&apos;t pinned yet.</strong>
            <span>Pin your place so FUZO users can find it on Scout.</span>
          </div>
          <button type="button" onClick={() => setIsPinModalOpen(true)}>
            <MapPin size={14} /> Pin it
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="fz-tako-page">
      <TakoAssistant variant="page" extras={extras} />
      <AppDock />

      {isPinModalOpen && (
        <ScoutAddPinModal cardType="RESTAURANT_VISIT" onClose={() => setIsPinModalOpen(false)} onSuccess={() => setHasPinnedRestaurant(true)} />
      )}
      {activeVideo && (
        <VideoPlayerModal title={activeVideo.title} mediaUrl={`https://www.youtube.com/watch?v=${activeVideo.videoId}`} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  );
}
