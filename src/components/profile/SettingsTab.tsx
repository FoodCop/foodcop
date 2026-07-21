'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_CODE } from '@/lib/data/countryCodes';
import { FLAVORS, CUISINES, DIETARY } from '@/lib/onboarding/data';
import LocationPickerModal from './LocationPickerModal';
import TastePreferenceEditModal from './TastePreferenceEditModal';
import {
  UserSettingsService,
  DEFAULT_USER_SETTINGS,
  type UserSettings,
  type MatchSensitivity,
  type ProfileVisibility,
} from '@/lib/services/userSettingsService';

type TasteField = 'flavors' | 'cuisines' | 'dietary';

const TASTE_FIELD_CONFIG: Record<TasteField, { title: string; emoji: string; options: readonly string[] }> = {
  flavors: { title: 'Flavor Profile', emoji: '🌶️', options: FLAVORS },
  cuisines: { title: 'Cuisine Preferences', emoji: '🌍', options: CUISINES },
  dietary: { title: 'Dietary Preferences', emoji: '🥗', options: DIETARY },
};

const summarize = (values: string[], emptyText: string) => {
  if (values.length === 0) return emptyText;
  if (values.length <= 3) return values.join(' · ');
  return `${values.slice(0, 3).join(', ')} +${values.length - 3} more`;
};

// Splits a stored "+1 4165550123"-style phone string back into a country
// selection + local number for editing - longest dial code first so "+1"
// (US/CA) doesn't shadow-match "+1246" (Barbados) etc.
function parsePhone(phone: string | null): { countryCode: string; number: string } {
  if (!phone) return { countryCode: DEFAULT_COUNTRY_CODE, number: '' };
  const sorted = [...COUNTRY_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  const match = sorted.find((c) => phone.startsWith(c.dialCode));
  if (!match) return { countryCode: DEFAULT_COUNTRY_CODE, number: phone };
  return { countryCode: match.code, number: phone.slice(match.dialCode.length).trim() };
}

export default function SettingsTab() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const [tasteProfile, setTasteProfile] = useState<Record<TasteField, string[]>>({
    flavors: [],
    cuisines: [],
    dietary: [],
  });
  const [editingField, setEditingField] = useState<TasteField | null>(null);
  const [hasDnaScores, setHasDnaScores] = useState(false);

  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const radiusSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from('users').select('phone, location, lat, lng').eq('id', user.id).maybeSingle();
      if (data) {
        const parsed = parsePhone(data.phone);
        setCountryCode(parsed.countryCode);
        setPhoneNumber(parsed.number);
        setLocationAddress(data.location ?? null);
        setLocationLat(data.lat ?? null);
        setLocationLng(data.lng ?? null);
      }

      const { data: taste } = await supabase
        .from('taste_profiles')
        .select('flavors, cuisines, dietary, dna_scores')
        .eq('user_id', user.id)
        .maybeSingle();
      if (taste) {
        setHasDnaScores(!!taste.dna_scores);
        setTasteProfile({
          flavors: taste.flavors ?? [],
          cuisines: taste.cuisines ?? [],
          dietary: taste.dietary ?? [],
        });
      }

      const settingsResult = await UserSettingsService.get();
      if (settingsResult.success && settingsResult.data) {
        setSettings(settingsResult.data);
      }
    })();
  }, []);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    UserSettingsService.update({ [key]: value }).then((result) => {
      if (!result.success) showToast(result.error || 'Could not save setting');
    });
  };

  const updateRadiusSetting = (value: number) => {
    setSettings((prev) => ({ ...prev, discoveryRadiusKm: value }));
    if (radiusSaveTimer.current) clearTimeout(radiusSaveTimer.current);
    radiusSaveTimer.current = setTimeout(() => {
      UserSettingsService.update({ discoveryRadiusKm: value }).then((result) => {
        if (!result.success) showToast(result.error || 'Could not save setting');
      });
    }, 500);
  };

  const handleSaveTasteField = async (field: TasteField, values: string[]) => {
    if (!userId) return;
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await supabase
      .from('taste_profiles')
      .upsert({ user_id: userId, [field]: values, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      showToast(error.message);
      return;
    }
    setTasteProfile((prev) => ({ ...prev, [field]: values }));
    showToast(`${TASTE_FIELD_CONFIG[field].title} saved`);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSavePhone = async () => {
    if (!userId) return;
    setIsSavingPhone(true);
    setPhoneError(null);
    try {
      const dialCode = COUNTRY_DIAL_CODES.find((c) => c.code === countryCode)?.dialCode ?? '';
      const trimmed = phoneNumber.trim();
      const phone = trimmed ? `${dialCode} ${trimmed}` : null;
      const supabase = createClient();
      if (!supabase) return;
      const { error } = await supabase.from('users').update({ phone }).eq('id', userId);
      if (error) {
        setPhoneError(error.message);
        return;
      }
      showToast('Phone number saved');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleLocationConfirm = async (result: { lat: number; lng: number; address: string }) => {
    setShowLocationPicker(false);
    if (!userId) return;
    setIsSavingLocation(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { error } = await supabase
        .from('users')
        .update({ location: result.address, lat: result.lat, lng: result.lng })
        .eq('id', userId);
      if (error) {
        showToast(error.message);
        return;
      }
      setLocationAddress(result.address);
      setLocationLat(result.lat);
      setLocationLng(result.lng);
      showToast('Location saved');
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase?.auth.signOut();
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDeleteError(data.error || 'Something went wrong. Please try again.');
        setIsDeleting(false);
        return;
      }
      const supabase = createClient();
      await supabase?.auth.signOut();
      router.push('/login');
    } catch {
      setDeleteError('Network error. Please try again.');
      setIsDeleting(false);
    }
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h6 className="text-muted fw-bold text-uppercase mt-4 mb-2 ms-2" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
      {children}
    </h6>
  );

  return (
    <div className="pb-5 position-relative">
      {toastMessage && (
        <div className="toast show position-fixed bottom-0 start-50 translate-middle-x mb-5 bg-dark text-white rounded-pill px-3 py-2 shadow" style={{ zIndex: 1050 }}>
          {toastMessage}
        </div>
      )}

      {/* ── TASTE PREFERENCES ── */}
      <SectionTitle>Taste Preferences</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <button
          type="button"
          className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom"
          onClick={() => setEditingField('flavors')}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 text-danger rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🌶️</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Flavor Profile</div>
              <small className="text-muted">{summarize(tasteProfile.flavors, 'No flavors picked yet')}</small>
            </div>
          </div>
          <span className="text-muted fw-bold fs-5">›</span>
        </button>
        <button
          type="button"
          className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom"
          onClick={() => setEditingField('cuisines')}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-10 text-warning rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🌍</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Cuisine Preferences</div>
              <small className="text-muted">{summarize(tasteProfile.cuisines, 'No cuisines picked yet')}</small>
            </div>
          </div>
          <span className="text-muted fw-bold fs-5">›</span>
        </button>
        <button
          type="button"
          className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom"
          onClick={() => setEditingField('dietary')}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 text-success rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🥗</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Dietary Preferences</div>
              <small className="text-muted">{summarize(tasteProfile.dietary, 'No restrictions currently set')}</small>
            </div>
          </div>
          <span className="text-muted fw-bold fs-5">›</span>
        </button>
        <button
          type="button"
          className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom"
          onClick={() => router.push('/dna-quiz')}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🧬</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Food DNA Quiz</div>
              <small className="text-muted">{hasDnaScores ? 'Retake the 25-question quiz' : 'Take the 25-question quiz'}</small>
            </div>
          </div>
          <span className="text-muted fw-bold fs-5">›</span>
        </button>
        <div className="list-group-item d-flex flex-column p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="bg-info bg-opacity-10 text-info rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>📍</div>
            <div className="flex-grow-1">
              <div className="fw-bold text-dark d-flex justify-content-between">
                Discovery Radius <span className="text-primary">{settings.discoveryRadiusKm} km</span>
              </div>
              <small className="text-muted">How far you'd travel for food</small>
            </div>
          </div>
          <input
            type="range"
            className="form-range"
            min="5"
            max="50"
            step="5"
            value={settings.discoveryRadiusKm}
            onChange={(e) => updateRadiusSetting(Number(e.target.value))}
          />
          <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.65rem' }}>
            <span>5km</span><span>25km</span><span>50km+</span>
          </div>
        </div>
      </div>

      {/* ── CONTACT & LOCATION (real, persisted) ── */}
      <SectionTitle>Contact & Location</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <div className="list-group-item p-3 border-0 border-bottom">
          <div className="fw-bold text-dark mb-2">Phone number</div>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm w-auto"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={!userId}
            >
              {COUNTRY_DIAL_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.dialCode}
                </option>
              ))}
            </select>
            <input
              type="tel"
              className="form-control form-control-sm"
              placeholder="416 555 0123"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={!userId}
            />
            <button
              type="button"
              className="btn btn-sm btn-primary fw-bold flex-shrink-0"
              onClick={handleSavePhone}
              disabled={!userId || isSavingPhone}
            >
              {isSavingPhone ? '…' : 'Save'}
            </button>
          </div>
          {phoneError && <div className="text-danger small mt-2">{phoneError}</div>}
        </div>
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 text-success rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🗺️</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Location</div>
              <small className="text-muted">{locationAddress || 'Not set'}</small>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary flex-shrink-0"
            onClick={() => setShowLocationPicker(true)}
            disabled={!userId || isSavingLocation}
          >
            {isSavingLocation ? '…' : locationAddress ? 'Update' : 'Set on map'}
          </button>
        </div>
      </div>

      {/* ── DISCOVERY & MATCHING ── */}
      <SectionTitle>Discovery & Matching</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-purple bg-opacity-10 rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: '#F0EAF8' }}>🎯</div>
            <div>
              <div className="fw-bold text-dark">Match Sensitivity</div>
              <small className="text-muted">How closely we filter recommendations</small>
            </div>
          </div>
          <select
            className="form-select form-select-sm w-auto border-0 bg-light fw-bold text-primary"
            value={settings.matchSensitivity}
            onChange={(e) => updateSetting('matchSensitivity', e.target.value as MatchSensitivity)}
          >
            <option>Broad</option>
            <option>Balanced</option>
            <option>Exact</option>
          </select>
        </div>
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-10 text-warning rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>💎</div>
            <div>
              <div className="fw-bold text-dark">Show Hidden Gems</div>
              <small className="text-muted">Include lesser-known spots</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={settings.showHiddenGems}
              onChange={(e) => updateSetting('showHiddenGems', e.target.checked)}
            />
          </div>
        </div>
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 text-danger rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🚀</div>
            <div>
              <div className="fw-bold text-dark">Prioritise Trending Spots</div>
              <small className="text-muted">Weight recently popular places higher</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={settings.prioritizeTrending}
              onChange={(e) => updateSetting('prioritizeTrending', e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* ── PRIVACY ── */}
      <SectionTitle>Privacy & Social</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-secondary bg-opacity-10 text-secondary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>👁️</div>
            <div>
              <div className="fw-bold text-dark">Profile Visibility</div>
            </div>
          </div>
          <select
            className="form-select form-select-sm w-auto border-0 bg-light fw-bold text-primary"
            value={settings.profileVisibility}
            onChange={(e) => updateSetting('profileVisibility', e.target.value as ProfileVisibility)}
          >
            <option>Public</option>
            <option>Followers</option>
            <option>Private</option>
          </select>
        </div>
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🧬</div>
            <div>
              <div className="fw-bold text-dark">Show Food DNA™</div>
              <small className="text-muted d-block">Others can see your scores</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={settings.showFoodDna}
              onChange={(e) => updateSetting('showFoodDna', e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* ── CONNECTED ACCOUNTS ── */}
      <SectionTitle>Connected Accounts</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom" onClick={() => showToast('Connect Instagram to import your food photos')}>
          <div className="d-flex align-items-center gap-3">
            <div className="rounded p-2 text-center d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)' }}>IG</div>
            <div className="text-start">
              <div className="fw-bold text-dark">Instagram</div>
              <small className="text-muted">Tap to connect</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary fw-bold" style={{ fontSize: '0.75rem' }}>Connect</span>
            <span className="text-muted fw-bold fs-5">›</span>
          </div>
        </button>
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom" onClick={() => showToast('Connect TikTok to import videos')}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-dark text-white rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🎵</div>
            <div className="text-start">
              <div className="fw-bold text-dark">TikTok</div>
              <small className="text-muted">Tap to connect</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary fw-bold" style={{ fontSize: '0.75rem' }}>Connect</span>
            <span className="text-muted fw-bold fs-5">›</span>
          </div>
        </button>
        <button className="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0 border-bottom" onClick={() => showToast('Connect YouTube to import cooking content')}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger text-white rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>▶</div>
            <div className="text-start">
              <div className="fw-bold text-dark">YouTube</div>
              <small className="text-muted">Tap to connect</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-secondary fw-bold" style={{ fontSize: '0.75rem' }}>Connect</span>
            <span className="text-muted fw-bold fs-5">›</span>
          </div>
        </button>
      </div>

      {/* ── AI & PERSONALISATION ── */}
      <SectionTitle>AI & Personalisation</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0">
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🤖</div>
            <div>
              <div className="fw-bold text-dark">AI Card Generation</div>
              <small className="text-muted d-block">Auto-generate titles and captions</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={settings.aiCardGeneration}
              onChange={(e) => updateSetting('aiCardGeneration', e.target.checked)}
            />
          </div>
        </div>
        <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-info bg-opacity-10 text-info rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🧠</div>
            <div>
              <div className="fw-bold text-dark">Use Activity for ML</div>
              <small className="text-muted d-block">Include likes, saves in match model</small>
            </div>
          </div>
          <div className="form-check form-switch fs-4 m-0">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              checked={settings.useActivityForMl}
              onChange={(e) => updateSetting('useActivityForMl', e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* ── ACCOUNT ── */}
      <SectionTitle>Account</SectionTitle>
      <div className="list-group shadow-sm rounded-4 border-0 mb-3">
        <button
          className="list-group-item list-group-item-action d-flex align-items-center p-3 border-0 border-bottom text-dark fw-bold"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <div className="me-3 fs-5">🚪</div> {isSigningOut ? 'Signing out…' : 'Sign Out'}
        </button>
        <button
          className="list-group-item list-group-item-action d-flex align-items-center p-3 border-0 text-danger fw-bold"
          onClick={() => {
            setDeleteError(null);
            setDeleteConfirmText('');
            setShowDeleteConfirm(true);
          }}
        >
          <div className="me-3 fs-5">🗑️</div> Delete Account
        </button>
      </div>

      <div className="text-center text-muted mt-4" style={{ fontSize: '0.75rem' }}>
        FUZO v3.0.0 (Next.js Port) · Made with ❤️
      </div>

      {showDeleteConfirm && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-body p-4">
                <div className="fs-3 mb-2">🗑️</div>
                <h5 className="fw-bold mb-2">Delete your account?</h5>
                <p className="text-muted mb-3">
                  This permanently deletes your profile, food cards, saved items, chats, and points. This can&rsquo;t be undone.
                </p>
                <label className="form-label small fw-bold text-muted" htmlFor="delete-confirm-input">
                  Type <span className="text-danger">DELETE</span> to confirm
                </label>
                <input
                  id="delete-confirm-input"
                  type="text"
                  className="form-control"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={isDeleting}
                  autoComplete="off"
                />
                {deleteError && <div className="alert alert-danger small mt-3 mb-0">{deleteError}</div>}
              </div>
              <div className="modal-footer bg-light border-top-0 p-3 d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary flex-fill"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger flex-fill fw-bold"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                >
                  {isDeleting ? 'Deleting…' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLocationPicker && (
        <LocationPickerModal
          initialLat={locationLat}
          initialLng={locationLng}
          onConfirm={handleLocationConfirm}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {editingField && (
        <TastePreferenceEditModal
          title={TASTE_FIELD_CONFIG[editingField].title}
          emoji={TASTE_FIELD_CONFIG[editingField].emoji}
          options={TASTE_FIELD_CONFIG[editingField].options}
          initialSelected={tasteProfile[editingField]}
          onSave={(values) => handleSaveTasteField(editingField, values)}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  );
}
