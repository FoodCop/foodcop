'use client';

import type { UserSettings } from '@/lib/services/userSettingsService';

interface NotificationsPanelProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

// Real, persisted per-user toggles (user_settings.notify_*). Social already
// controls what the in-app Notifications feed and bell dot show; Messages and
// Recommendations are stored for the push/email pipeline, which does not exist
// yet - the footnote below says so instead of implying they do something today.
export default function NotificationsPanel({ settings, updateSetting }: NotificationsPanelProps) {
  return (
    <div>
    <div className="list-group shadow-sm rounded-4 border-0">
      <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-primary bg-opacity-10 text-primary rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>💬</div>
          <div>
            <div className="fw-bold text-dark">Messages</div>
            <small className="text-muted d-block">New chats and replies</small>
          </div>
        </div>
        <div className="form-check form-switch fs-4 m-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={settings.notifyMessages}
            onChange={(e) => updateSetting('notifyMessages', e.target.checked)}
          />
        </div>
      </div>

      <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-danger bg-opacity-10 text-danger rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>❤️</div>
          <div>
            <div className="fw-bold text-dark">Social</div>
            <small className="text-muted d-block">Follows, likes and comments</small>
          </div>
        </div>
        <div className="form-check form-switch fs-4 m-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={settings.notifySocial}
            onChange={(e) => updateSetting('notifySocial', e.target.checked)}
          />
        </div>
      </div>

      <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-warning bg-opacity-10 text-warning rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>✨</div>
          <div>
            <div className="fw-bold text-dark">Recommendations</div>
            <small className="text-muted d-block">New matches and places nearby</small>
          </div>
        </div>
        <div className="form-check form-switch fs-4 m-0">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            checked={settings.notifyRecommendations}
            onChange={(e) => updateSetting('notifyRecommendations', e.target.checked)}
          />
        </div>
      </div>
    </div>
    <div className="fz-empty mt-3">Social controls your in-app alerts today. Messages and Recommendations will apply once push notifications launch.</div>
    </div>
  );
}
