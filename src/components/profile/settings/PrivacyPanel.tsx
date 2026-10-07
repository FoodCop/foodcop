'use client';

import type { UserSettings, ProfileVisibility } from '@/lib/services/userSettingsService';

interface PrivacyPanelProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export default function PrivacyPanel({ settings, updateSetting }: PrivacyPanelProps) {
  return (
    <div className="list-group shadow-sm rounded-4 border-0">
      <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-secondary bg-opacity-10 text-secondary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>👁️</div>
          <div>
            <div className="fw-bold text-dark">Profile Visibility</div>
            <small className="text-muted d-block">
              {settings.profileVisibility === 'Public'
                ? 'Anyone can see your posts and highlights'
                : 'Only followers you approve can see your posts and highlights'}
            </small>
          </div>
        </div>
        {/* Two levels, like Instagram. A legacy 'Followers' value is the same thing as Private. */}
        <select
          className="form-select form-select-sm w-auto border-0 bg-light fw-bold text-primary"
          value={settings.profileVisibility === 'Public' ? 'Public' : 'Private'}
          onChange={(e) => updateSetting('profileVisibility', e.target.value as ProfileVisibility)}
        >
          <option value="Public">Public</option>
          <option value="Private">Private</option>
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

      <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-success bg-opacity-10 text-success rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🟢</div>
          <div>
            <div className="fw-bold text-dark">Show when I&rsquo;m active</div>
            <small className="text-muted d-block">Friends see &ldquo;Active now&rdquo; in chat. Off = you won&rsquo;t see theirs either</small>
          </div>
        </div>
        <div className="form-check form-switch fs-4 m-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={settings.showOnlineStatus}
            onChange={(e) => updateSetting('showOnlineStatus', e.target.checked)}
          />
        </div>
      </div>

      <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 text-primary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>✓✓</div>
          <div>
            <div className="fw-bold text-dark">Read receipts</div>
            <small className="text-muted d-block">Let people see when you&rsquo;ve read their message. Off = you won&rsquo;t see theirs either</small>
          </div>
        </div>
        <div className="form-check form-switch fs-4 m-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={settings.sendReadReceipts}
            onChange={(e) => updateSetting('sendReadReceipts', e.target.checked)}
          />
        </div>
      </div>

      <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-info bg-opacity-10 text-info rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>🧠</div>
          <div>
            <div className="fw-bold text-dark">Use Activity for Matching</div>
            <small className="text-muted d-block">Include likes and saves in your match model</small>
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
  );
}
