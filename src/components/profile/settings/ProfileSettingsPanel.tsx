'use client';

import { COUNTRY_DIAL_CODES } from '@/lib/data/countryCodes';
import SocialLinksEditor from './SocialLinksEditor';

interface ProfileSettingsPanelProps {
  userId: string | null;
  displayName: string;
  setDisplayName: (v: string) => void;
  nameDirty: boolean;
  isSavingName: boolean;
  nameError: string | null;
  setNameError: (v: string | null) => void;
  onSaveName: () => void;

  username: string;
  setUsername: (v: string) => void;
  usernameDirty: boolean;
  usernameFormatValid: boolean;
  usernameCheck: 'idle' | 'checking' | 'available' | 'taken';
  isSavingUsername: boolean;
  usernameError: string | null;
  setUsernameError: (v: string | null) => void;
  onSaveUsername: () => void;

  bio: string;
  setBio: (v: string) => void;
  bioDirty: boolean;
  isSavingBio: boolean;
  bioError: string | null;
  onSaveBio: () => void;

  countryCode: string;
  setCountryCode: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  isSavingPhone: boolean;
  phoneError: string | null;
  onSavePhone: () => void;

  locationAddress: string | null;
  isSavingLocation: boolean;
  onOpenLocationPicker: () => void;
}

// Note on avatar/banner: those are already editable directly on the profile
// hero (camera buttons over the photo/banner itself) - kept there rather
// than duplicated here, since that's a live preview of the exact thing
// being changed.
export default function ProfileSettingsPanel({
  userId,
  displayName,
  setDisplayName,
  nameDirty,
  isSavingName,
  nameError,
  setNameError,
  onSaveName,
  username,
  setUsername,
  usernameDirty,
  usernameFormatValid,
  usernameCheck,
  isSavingUsername,
  usernameError,
  setUsernameError,
  onSaveUsername,
  bio,
  setBio,
  bioDirty,
  isSavingBio,
  bioError,
  onSaveBio,
  countryCode,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
  isSavingPhone,
  phoneError,
  onSavePhone,
  locationAddress,
  isSavingLocation,
  onOpenLocationPicker,
}: ProfileSettingsPanelProps) {
  return (
    <div>
      <div className="list-group shadow-sm rounded-4 border-0 mb-3">
        <div className="list-group-item p-3 border-0 border-bottom">
          <div className="fw-bold text-dark mb-2">Name</div>
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setNameError(null); }}
              disabled={!userId}
              maxLength={60}
            />
            <button
              type="button"
              className={`btn btn-sm fw-bold flex-shrink-0 ${nameDirty ? 'fz-btn-gold' : 'btn-outline-secondary'}`}
              onClick={onSaveName}
              disabled={!userId || isSavingName || !nameDirty}
            >
              {isSavingName ? 'Saving…' : nameDirty ? 'Save' : 'Saved ✓'}
            </button>
          </div>
          {nameError && <div className="text-danger small mt-2">{nameError}</div>}
        </div>

        <div className="list-group-item p-3 border-0 border-bottom">
          <div className="fw-bold text-dark mb-2">Username</div>
          <div className="d-flex gap-2 align-items-center">
            <span className="text-muted">@</span>
            <input
              type="text"
              className="form-control form-control-sm"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setUsernameError(null); }}
              disabled={!userId}
              maxLength={30}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button
              type="button"
              className={`btn btn-sm fw-bold flex-shrink-0 ${usernameDirty ? 'fz-btn-gold' : 'btn-outline-secondary'}`}
              onClick={onSaveUsername}
              disabled={!userId || isSavingUsername || !usernameDirty || !usernameFormatValid || usernameCheck === 'taken' || usernameCheck === 'checking'}
            >
              {isSavingUsername ? 'Saving…' : usernameDirty ? 'Save' : 'Saved ✓'}
            </button>
          </div>
          {usernameError ? (
            <div className="text-danger small mt-2">{usernameError}</div>
          ) : usernameDirty && !usernameFormatValid ? (
            <div className="text-danger small mt-2">3-30 characters: letters, numbers, underscore, or period.</div>
          ) : usernameDirty && usernameCheck === 'checking' ? (
            <div className="text-muted small mt-2">Checking availability…</div>
          ) : usernameDirty && usernameCheck === 'available' ? (
            <div className="text-success small mt-2">✓ Username available</div>
          ) : usernameDirty && usernameCheck === 'taken' ? (
            <div className="text-danger small mt-2">✗ That username is already taken</div>
          ) : null}
        </div>

        <div className="list-group-item p-3 border-0">
          <div className="fw-bold text-dark mb-2">Bio</div>
          <textarea
            className="form-control form-control-sm"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={!userId}
            maxLength={200}
            placeholder="Tell people what you love to eat…"
          />
          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted">{bio.length}/200</small>
            <button
              type="button"
              className={`btn btn-sm fw-bold ${bioDirty ? 'fz-btn-gold' : 'btn-outline-secondary'}`}
              onClick={onSaveBio}
              disabled={!userId || isSavingBio || !bioDirty}
            >
              {isSavingBio ? 'Saving…' : bioDirty ? 'Save' : 'Saved ✓'}
            </button>
          </div>
          {bioError && <div className="text-danger small mt-2">{bioError}</div>}
        </div>
      </div>

      <SocialLinksEditor userId={userId} />

      <div className="fz-settings-group__label">Contact & Location</div>
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
            <button type="button" className="btn btn-sm fz-btn-gold flex-shrink-0" onClick={onSavePhone} disabled={!userId || isSavingPhone}>
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
          <button type="button" className="btn btn-sm btn-outline-secondary flex-shrink-0" onClick={onOpenLocationPicker} disabled={!userId || isSavingLocation}>
            {isSavingLocation ? '…' : locationAddress ? 'Update' : 'Set on map'}
          </button>
        </div>
      </div>
    </div>
  );
}
