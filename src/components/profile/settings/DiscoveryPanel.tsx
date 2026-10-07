'use client';

import type { UserSettings, MatchSensitivity } from '@/lib/services/userSettingsService';

interface DiscoveryPanelProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  updateRadiusSetting: (value: number) => void;
}

export default function DiscoveryPanel({ settings, updateSetting, updateRadiusSetting }: DiscoveryPanelProps) {
  return (
    <div className="list-group shadow-sm rounded-4 border-0">
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

      <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded p-2 text-center d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: '#F0EAF8' }}>🎯</div>
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

      <div className="list-group-item d-flex align-items-center justify-content-between p-3 border-0">
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
    </div>
  );
}
