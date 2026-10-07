'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_CODE } from '@/lib/data/countryCodes';
import { TASTE_FIELD_CONFIG, type TasteField } from './settings/shared';
import LocationPickerModal from './LocationPickerModal';
import TastePreferenceEditModal from './TastePreferenceEditModal';
import ProfileSettingsPanel from './settings/ProfileSettingsPanel';
import TastePreferencesPanel from './settings/TastePreferencesPanel';
import DiscoveryPanel from './settings/DiscoveryPanel';
import PrivacyPanel from './settings/PrivacyPanel';
import ConnectedAccountsPanel from './settings/ConnectedAccountsPanel';
import NotificationsPanel from './settings/NotificationsPanel';
import AppearancePanel from './settings/AppearancePanel';
import { UserSettingsService, DEFAULT_USER_SETTINGS, type UserSettings } from '@/lib/services/userSettingsService';
import { ActivityEventService } from '@/lib/services/activityEventService';

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

interface SettingsTabProps {
  /** Lets Edit Profile's saves update ProfileHero's name/handle immediately. */
  onProfileUpdate?: (patch: { name?: string; handle?: string }) => void;
}

// Letters, digits, underscore, period; 3-30 chars - no spaces, so it always
// renders cleanly as an "@handle" everywhere the app displays it.
const USERNAME_PATTERN = /^[a-z0-9_.]{3,30}$/;

type SettingsView = 'menu' | 'profile' | 'taste' | 'discovery' | 'privacy' | 'connected' | 'notifications' | 'appearance';

// Redesigned as a drill-down menu (per the new Profile mockup) instead of one
// long inline-editing page - every field below is the exact same real,
// persisted state the old single-page SettingsTab had, just grouped behind
// a menu row + a panel instead of always being on screen at once.
export default function SettingsTab({ onProfileUpdate }: SettingsTabProps = {}) {
  const router = useRouter();
  const [view, setView] = useState<SettingsView>('menu');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [savedDisplayName, setSavedDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameCheck, setUsernameCheck] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const usernameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usernameCheckSeq = useRef(0);
  const [bio, setBio] = useState('');
  const [savedBio, setSavedBio] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [bioError, setBioError] = useState<string | null>(null);
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
  const radiusBeforeDrag = useRef(DEFAULT_USER_SETTINGS.discoveryRadiusKm);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      // Public columns from users; the owner-only ones (phone, address,
      // coordinates) come from my_private_profile - other people can't read them.
      const [{ data: pub }, { data: priv }] = await Promise.all([
        supabase.from('users').select('display_name, username, bio').eq('id', user.id).maybeSingle(),
        supabase.from('my_private_profile').select('phone, location, lat, lng').maybeSingle(),
      ]);
      const data = pub ? { ...pub, phone: priv?.phone ?? null, location: priv?.location ?? null, lat: priv?.lat ?? null, lng: priv?.lng ?? null } : null;
      if (data) {
        setDisplayName(data.display_name ?? '');
        setSavedDisplayName(data.display_name ?? '');
        setUsername(data.username ?? '');
        setSavedUsername(data.username ?? '');
        setBio(data.bio ?? '');
        setSavedBio(data.bio ?? '');
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

  // Live availability check, debounced - tells the user whether a username
  // is taken before they hit Save, instead of only finding out from a
  // unique-constraint error after submitting.
  useEffect(() => {
    if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
    const trimmed = username.trim().toLowerCase();

    if (!userId || trimmed === savedUsername.toLowerCase()) {
      setUsernameCheck('idle');
      return;
    }
    if (!USERNAME_PATTERN.test(trimmed)) {
      setUsernameCheck('idle');
      return;
    }

    setUsernameCheck('checking');
    const seq = ++usernameCheckSeq.current;
    usernameCheckTimer.current = setTimeout(async () => {
      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase.from('users').select('id').eq('username', trimmed).neq('id', userId).maybeSingle();
      if (seq !== usernameCheckSeq.current) return; // a newer keystroke already superseded this check
      setUsernameCheck(data ? 'taken' : 'available');
    }, 450);

    return () => {
      if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
    };
  }, [username, userId, savedUsername]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const previous = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === 'useActivityForMl') ActivityEventService.resetConsentCache();
    UserSettingsService.update({ [key]: value }).then((result) => {
      if (!result.success) {
        if (key === 'useActivityForMl') ActivityEventService.resetConsentCache();
        // Roll the switch back so the screen never claims a setting that didn't save.
        setSettings((prev) => ({ ...prev, [key]: previous }));
        showToast(result.error || 'Could not save setting');
      }
    });
  };

  const updateRadiusSetting = (value: number) => {
    // Only the value from before this drag started is worth restoring on failure.
    if (radiusSaveTimer.current === null) radiusBeforeDrag.current = settings.discoveryRadiusKm;
    setSettings((prev) => ({ ...prev, discoveryRadiusKm: value }));
    if (radiusSaveTimer.current) clearTimeout(radiusSaveTimer.current);
    radiusSaveTimer.current = setTimeout(() => {
      radiusSaveTimer.current = null;
      UserSettingsService.update({ discoveryRadiusKm: value }).then((result) => {
        if (!result.success) {
          setSettings((prev) => ({ ...prev, discoveryRadiusKm: radiusBeforeDrag.current }));
          showToast(result.error || 'Could not save setting');
        }
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

  const handleSaveDisplayName = async () => {
    if (!userId) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameError('Name can’t be empty.');
      return;
    }
    setIsSavingName(true);
    setNameError(null);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { error } = await supabase.from('users').update({ display_name: trimmed }).eq('id', userId);
      if (error) {
        setNameError(error.message);
        return;
      }
      setDisplayName(trimmed);
      setSavedDisplayName(trimmed);
      onProfileUpdate?.({ name: trimmed });
      showToast('Name saved');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!userId) return;
    const trimmed = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(trimmed)) {
      setUsernameError('3-30 characters: letters, numbers, underscore, or period.');
      return;
    }
    if (usernameCheck === 'taken') {
      setUsernameError('That username is already taken.');
      return;
    }
    setIsSavingUsername(true);
    setUsernameError(null);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { error } = await supabase.from('users').update({ username: trimmed }).eq('id', userId);
      if (error) {
        setUsernameError(error.code === '23505' ? 'That username is already taken.' : error.message);
        setUsernameCheck(error.code === '23505' ? 'taken' : 'idle');
        return;
      }
      setUsername(trimmed);
      setSavedUsername(trimmed);
      setUsernameCheck('idle');
      onProfileUpdate?.({ handle: trimmed });
      showToast('Username saved');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleSaveBio = async () => {
    if (!userId) return;
    const trimmed = bio.trim();
    setIsSavingBio(true);
    setBioError(null);
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { error } = await supabase.from('users').update({ bio: trimmed || null }).eq('id', userId);
      if (error) {
        setBioError(error.message);
        return;
      }
      setBio(trimmed);
      setSavedBio(trimmed);
      showToast('Bio saved');
    } finally {
      setIsSavingBio(false);
    }
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

  const nameDirty = displayName.trim() !== savedDisplayName;
  const usernameTrimmedLower = username.trim().toLowerCase();
  const usernameDirty = usernameTrimmedLower !== savedUsername.toLowerCase();
  const usernameFormatValid = USERNAME_PATTERN.test(usernameTrimmedLower);
  const bioDirty = bio.trim() !== savedBio;

  const MENU_ROWS: { key: SettingsView; emoji: string; title: string; sub: string }[] = [
    { key: 'profile', emoji: '👤', title: 'Profile', sub: 'Name, username, photo and bio' },
    { key: 'taste', emoji: '🍴', title: 'Taste Preferences', sub: 'Cuisines, dietary preferences' },
    { key: 'discovery', emoji: '📍', title: 'Discovery', sub: 'Discovery radius and match sensitivity' },
    { key: 'privacy', emoji: '🔒', title: 'Privacy', sub: 'Profile visibility and data' },
    { key: 'connected', emoji: '🔗', title: 'Connected Accounts', sub: 'Instagram, TikTok, YouTube' },
  ];
  const PREFERENCE_ROWS: { key: SettingsView; emoji: string; title: string; sub: string }[] = [
    { key: 'notifications', emoji: '🔔', title: 'Notifications', sub: 'Manage your notifications' },
    { key: 'appearance', emoji: '🌙', title: 'Appearance', sub: 'Light, dark or system' },
  ];

  const PANEL_TITLE: Record<Exclude<SettingsView, 'menu'>, string> = {
    profile: 'Profile',
    taste: 'Taste Preferences',
    discovery: 'Discovery',
    privacy: 'Privacy',
    connected: 'Connected Accounts',
    notifications: 'Notifications',
    appearance: 'Appearance',
  };

  return (
    <div className="pb-5 position-relative">
      {toastMessage && (
        <div className="toast show position-fixed bottom-0 start-50 translate-middle-x mb-5 bg-dark text-white rounded-pill px-3 py-2 shadow" style={{ zIndex: 1050 }}>
          {toastMessage}
        </div>
      )}

      {view === 'menu' ? (
        <>
          <div className="fz-settings-header">
            <div className="fz-settings-title">Settings</div>
            <div className="fz-settings-sub">Keep your profile, preferences and experience just right.</div>
          </div>

          <div className="fz-settings-group">
            {MENU_ROWS.map((row) => (
              <button key={row.key} type="button" className="fz-settings-row" onClick={() => setView(row.key)}>
                <div className="fz-settings-row__icon">{row.emoji}</div>
                <div className="fz-settings-row__body">
                  <div className="fz-settings-row__title">{row.title}</div>
                  <div className="fz-settings-row__sub">{row.sub}</div>
                </div>
                <ChevronRight size={18} className="fz-settings-row__chevron" />
              </button>
            ))}
          </div>

          <div className="fz-settings-group">
            <div className="fz-settings-group__label">App Preferences</div>
            {PREFERENCE_ROWS.map((row) => (
              <button key={row.key} type="button" className="fz-settings-row" onClick={() => setView(row.key)}>
                <div className="fz-settings-row__icon">{row.emoji}</div>
                <div className="fz-settings-row__body">
                  <div className="fz-settings-row__title">{row.title}</div>
                  <div className="fz-settings-row__sub">{row.sub}</div>
                </div>
                <ChevronRight size={18} className="fz-settings-row__chevron" />
              </button>
            ))}
          </div>

          <div className="fz-settings-group">
            <div className="fz-settings-group__label">Account</div>
            <button type="button" className="fz-settings-row" onClick={handleSignOut} disabled={isSigningOut}>
              <div className="fz-settings-row__icon"><LogOut size={18} /></div>
              <div className="fz-settings-row__body">
                <div className="fz-settings-row__title">{isSigningOut ? 'Signing out…' : 'Sign Out'}</div>
              </div>
            </button>
            <button
              type="button"
              className="fz-settings-row fz-settings-row--danger"
              onClick={() => {
                setDeleteError(null);
                setDeleteConfirmText('');
                setShowDeleteConfirm(true);
              }}
            >
              <div className="fz-settings-row__icon"><Trash2 size={18} className="text-danger" /></div>
              <div className="fz-settings-row__body">
                <div className="fz-settings-row__title">Delete Account</div>
              </div>
            </button>
          </div>

          <div className="text-center text-muted mt-4" style={{ fontSize: '0.75rem' }}>
            FUZO v3.0.0 (Next.js Port) · Made with ❤️
          </div>
        </>
      ) : (
        <>
          <button type="button" className="fz-settings-back" onClick={() => setView('menu')}>
            ← {PANEL_TITLE[view]}
          </button>

          {view === 'profile' && (
            <ProfileSettingsPanel
              userId={userId}
              displayName={displayName}
              setDisplayName={setDisplayName}
              nameDirty={nameDirty}
              isSavingName={isSavingName}
              nameError={nameError}
              setNameError={setNameError}
              onSaveName={handleSaveDisplayName}
              username={username}
              setUsername={setUsername}
              usernameDirty={usernameDirty}
              usernameFormatValid={usernameFormatValid}
              usernameCheck={usernameCheck}
              isSavingUsername={isSavingUsername}
              usernameError={usernameError}
              setUsernameError={setUsernameError}
              onSaveUsername={handleSaveUsername}
              bio={bio}
              setBio={setBio}
              bioDirty={bioDirty}
              isSavingBio={isSavingBio}
              bioError={bioError}
              onSaveBio={handleSaveBio}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              isSavingPhone={isSavingPhone}
              phoneError={phoneError}
              onSavePhone={handleSavePhone}
              locationAddress={locationAddress}
              isSavingLocation={isSavingLocation}
              onOpenLocationPicker={() => setShowLocationPicker(true)}
            />
          )}

          {view === 'taste' && (
            <TastePreferencesPanel
              tasteProfile={tasteProfile}
              hasDnaScores={hasDnaScores}
              onEditField={setEditingField}
            />
          )}

          {view === 'discovery' && (
            <DiscoveryPanel settings={settings} updateSetting={updateSetting} updateRadiusSetting={updateRadiusSetting} />
          )}

          {view === 'privacy' && <PrivacyPanel settings={settings} updateSetting={updateSetting} />}

          {view === 'connected' && <ConnectedAccountsPanel />}

          {view === 'notifications' && <NotificationsPanel settings={settings} updateSetting={updateSetting} />}

          {view === 'appearance' && <AppearancePanel />}
        </>
      )}

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
