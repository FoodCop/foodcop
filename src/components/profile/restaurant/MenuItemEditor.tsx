'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { RestaurantService, type MenuItem, type MenuItemDraft } from '@/lib/services/restaurantService';
import { MenuItemCard } from './RestaurantBits';

const EMPTY_DRAFT: MenuItemDraft = {
  name: '',
  description: '',
  price: 0,
  category: '',
  is_veg: true,
  is_recommended: false,
  is_popular: false,
  is_available: true,
  image_url: null,
};

// Add / edit one menu item. Left: the form. Right: a live preview using the
// exact card customers see on the Menu tab, updating on every keystroke.
export default function MenuItemEditor({
  restaurantId,
  item,
  categories,
  currency,
  onCancel,
  onSaved,
}: {
  restaurantId: string;
  item?: MenuItem | null;
  categories: string[];
  currency: string;
  onCancel: () => void;
  onSaved: (item: MenuItem) => void;
}) {
  const [draft, setDraft] = useState<MenuItemDraft>(() =>
    item
      ? {
          id: item.id,
          name: item.name,
          description: item.description ?? '',
          price: item.price,
          category: item.category,
          is_veg: item.is_veg,
          is_recommended: item.is_recommended,
          is_popular: item.is_popular,
          is_available: item.is_available,
          image_url: item.image_url,
        }
      : EMPTY_DRAFT,
  );
  const [priceText, setPriceText] = useState(item ? String(item.price) : '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof MenuItemDraft>(key: K, value: MenuItemDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const price = Number(priceText);
  const priceValid = priceText.trim() !== '' && Number.isFinite(price) && price >= 0;
  const canSave = draft.name.trim().length > 0 && draft.category.trim().length > 0 && priceValid && !uploading && !saving;

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const res = await RestaurantService.uploadImage(file);
    setUploading(false);
    if (res.success && res.data) set('image_url', res.data);
    else setError(res.error ?? 'Photo upload failed.');
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const res = await RestaurantService.saveMenuItem(restaurantId, { ...draft, price });
    setSaving(false);
    if (!res.success || !res.data) {
      setError(res.error ?? 'Could not save this item.');
      return;
    }
    onSaved(res.data);
  };

  return (
    <div className="fz-menu-editor card border shadow-sm mb-4">
      <div className="card-header bg-transparent d-flex justify-content-between align-items-center py-2 px-3">
        <span className="fw-bold">{item ? 'Edit menu item' : 'Add menu item'}</span>
        <button type="button" className="btn-close" aria-label="Close" onClick={onCancel} disabled={saving} />
      </div>
      <div className="card-body p-3">
        <div className="row g-4">
          {/* ── Form ─────────────────────────────────────── */}
          <div className="col-12 col-lg-7">
            {/* Photo */}
            <div className="mb-3">
              <div className="fw-bold text-dark mb-2">Food photo</div>
              <div className="d-flex align-items-center gap-3">
                <div className="position-relative rounded-3 overflow-hidden border bg-light" style={{ width: 88, height: 88 }}>
                  {draft.image_url ? (
                    <>
                      <img src={draft.image_url} alt="" className="w-100 h-100 object-fit-cover" />
                      <button
                        type="button"
                        className="btn btn-sm btn-dark position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center rounded-circle m-1"
                        style={{ width: 20, height: 20 }}
                        onClick={() => set('image_url', null)}
                        aria-label="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted">
                      <Camera size={22} />
                    </div>
                  )}
                </div>
                <button type="button" className="btn btn-sm btn-outline-dark rounded-pill" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="scout-spin me-1" /> Uploading…
                    </>
                  ) : draft.image_url ? (
                    'Change photo'
                  ) : (
                    'Upload photo'
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={(e) => {
                    pickPhoto(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12">
                <label className="fw-bold text-dark mb-1 d-block" htmlFor="mi-name">Item name *</label>
                <input id="mi-name" className="form-control form-control-sm" maxLength={120} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Butter Chicken" />
              </div>
              <div className="col-6">
                <label className="fw-bold text-dark mb-1 d-block" htmlFor="mi-price">Price ({currency}) *</label>
                <input
                  id="mi-price"
                  className={`form-control form-control-sm${priceText && !priceValid ? ' is-invalid' : ''}`}
                  inputMode="decimal"
                  value={priceText}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d.]/g, '');
                    setPriceText(v);
                    if (Number.isFinite(Number(v))) set('price', Number(v));
                  }}
                  placeholder="0.00"
                />
              </div>
              <div className="col-6">
                <label className="fw-bold text-dark mb-1 d-block" htmlFor="mi-cat">Category *</label>
                <input id="mi-cat" className="form-control form-control-sm" list="mi-cat-list" maxLength={60} value={draft.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Starters" />
                <datalist id="mi-cat-list">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="col-12">
                <label className="fw-bold text-dark mb-1 d-block" htmlFor="mi-desc">Description</label>
                <textarea id="mi-desc" className="form-control form-control-sm" rows={3} maxLength={500} value={draft.description ?? ''} onChange={(e) => set('description', e.target.value)} placeholder="Short description customers will see" />
              </div>

              {/* Veg / non-veg */}
              <div className="col-12">
                <div className="fw-bold text-dark mb-1">Type</div>
                <div className="d-flex gap-2">
                  <button type="button" className={`btn btn-sm rounded-pill ${draft.is_veg ? 'btn-success' : 'btn-outline-secondary'}`} onClick={() => set('is_veg', true)}>
                    Veg
                  </button>
                  <button type="button" className={`btn btn-sm rounded-pill ${!draft.is_veg ? 'btn-danger' : 'btn-outline-secondary'}`} onClick={() => set('is_veg', false)}>
                    Non-veg
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="col-12 d-flex flex-wrap gap-4">
                {(
                  [
                    ['is_available', 'Available'],
                    ['is_recommended', 'Recommended'],
                    ['is_popular', 'Popular'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="form-check form-switch m-0">
                    <input id={`mi-${key}`} className="form-check-input" type="checkbox" checked={draft[key]} onChange={(e) => set(key, e.target.checked)} />
                    <label className="form-check-label small fw-semibold" htmlFor={`mi-${key}`}>
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="text-danger small mt-3">{error}</div>}

            <div className="d-flex gap-2 mt-4">
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary rounded-pill px-4 fw-bold" onClick={save} disabled={!canSave}>
                {saving ? 'Saving…' : item ? 'Save changes' : 'Add to menu'}
              </button>
            </div>
          </div>

          {/* ── Live preview ─────────────────────────────── */}
          <div className="col-12 col-lg-5">
            <div className="fw-bold text-dark mb-2">Live preview</div>
            <p className="small text-muted mb-2">This is exactly how customers will see it on your menu.</p>
            <div style={{ maxWidth: 340 }}>
              <MenuItemCard item={draft} currency={currency} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
