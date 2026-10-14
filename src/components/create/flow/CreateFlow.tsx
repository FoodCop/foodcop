'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Check, Footprints, Loader2, Share2, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { PostService, missingForPublish, type PostInput } from '@/lib/services/postService';
import { MediaUploadService } from '@/lib/services/mediaUploadService';
import type { FoodCardRecord } from '@/lib/types/foodCard';
import ShareSheet, { type SharePayload } from '@/components/share/ShareSheet';
import { postSharePayload } from '@/lib/share/postShare';
import { CameraCapture } from './CameraCapture';
import { KindPicker, KIND_OPTIONS } from './KindPicker';
import { VibeDetails } from './VibeDetails';
import { FoodDetails } from './FoodDetails';
import { RecipeDetails } from './RecipeDetails';
import { RestaurantDetails } from './RestaurantDetails';
import { placeFromDuplicate } from './placeFromDuplicate';
import { DraftsSheet } from './DraftsSheet';
import { fieldsOfCard, kindOfCard, photosOfCard } from './fromCard';
import { emptyPostFields, type CreateKind, type CreateMode, type CreatePhoto, type CreateStep, type PostFields } from './types';

// The Create flow (client, 2026-10-14; plan: docs/CREATE_FLOW_PLAN.md):
// camera -> "What is this?" -> that kind's details -> Post. This component
// holds the photos and answers, so Back never loses anything, and asks
// before throwing away a post in progress. Also opens a saved post again
// (Phase 8): a draft to finish (from the camera's Drafts, or the profile) or
// a published post to edit (editCard).

interface CreateFlowProps {
  onClose: () => void;
  /** Pre-selects a kind on the "What is this?" step (e.g. Profile's "Add a recipe"). */
  initialKind?: CreateKind;
  /** Opens on a tab other than Photo (e.g. Profile's "Add a video"). */
  initialMode?: CreateMode;
  /** A saved post to finish (draft) or edit (published). Opens on its details. */
  editCard?: FoodCardRecord;
  /** Called after a post is saved or deleted, so lists can refresh. */
  onSaved?: () => void;
}

/** The saved post being edited: its id, status, and photos when opened. */
type Editing = { id: string; status: 'DRAFT' | 'PUBLISHED'; originalPhotos: string[] };

const editingOf = (card: FoodCardRecord): Editing => ({
  id: card.id,
  status: card.status,
  originalPhotos: card.photos?.length ? card.photos : card.image_url ? [card.image_url] : [],
});

const STEPS: { id: CreateStep; label: string }[] = [
  { id: 'capture', label: 'Photos' },
  { id: 'kind', label: 'Type' },
  { id: 'details', label: 'Details' },
];

// Kinds whose details screen is built (the rest show what's coming).
const READY_KINDS: CreateKind[] = ['vibe', 'food', 'recipe', 'restaurant'];

// What each kind will ask for - shown on the details step until that kind's
// phase is built.
const COMING_NEXT: Record<CreateKind, string[]> = {
  vibe: [],
  food: [],
  recipe: [],
  restaurant: [],
};

// Where each kind shows up once posted (client spec).
const POSTED_TO: Record<CreateKind, string> = {
  vibe: 'the Feed and your profile',
  food: 'the Feed and your profile',
  recipe: 'the Feed, Bites and your profile',
  restaurant: "the Feed, your profile and the restaurant's gallery",
};

type SaveState = { status: 'idle' } | { status: 'saving'; publishing: boolean } | { status: 'error'; message: string };

export function CreateFlow({ onClose, initialKind, initialMode = 'photo', editCard, onSaved }: CreateFlowProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const trapRef = useFocusTrap(true);
  const editKind = editCard ? kindOfCard(editCard) : null;
  const [step, setStep] = useState<CreateStep>(editKind ? 'details' : 'capture');
  const [mode, setMode] = useState<CreateMode>(initialMode);
  const [photos, setPhotos] = useState<CreatePhoto[]>(() => (editCard && editKind ? photosOfCard(editCard) : []));
  const [kind, setKind] = useState<CreateKind | null>(editKind ?? initialKind ?? null);
  const [fields, setFields] = useState<PostFields>(() => (editCard && editKind ? fieldsOfCard(editCard) : emptyPostFields()));
  const [editing, setEditing] = useState<Editing | null>(() => (editCard && editKind ? editingOf(editCard) : null));
  const [draftsOpen, setDraftsOpen] = useState(false);
  // The user's unfinished posts (camera "Drafts" button); not while editing.
  const [drafts, setDrafts] = useState<FoodCardRecord[]>([]);
  useEffect(() => {
    if (editCard) return;
    let cancelled = false;
    PostService.listMyDrafts().then((res) => {
      if (!cancelled && res.success) setDrafts(res.data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [editCard]);
  const editingPublished = editing?.status === 'PUBLISHED';
  const [save, setSave] = useState<SaveState>({ status: 'idle' });
  const [result, setResult] = useState<{ published: boolean; edited?: boolean; visitAt?: string; addedPlace?: string; card?: FoodCardRecord } | null>(null);
  const [sharing, setSharing] = useState<SharePayload | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [direction, setDirection] = useState(1);

  // Free the preview URLs when photos are removed or the flow closes.
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.url)), []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const saving = save.status === 'saving';

  const requestClose = useCallback(() => {
    if (saving) return;
    if (step !== 'done' && (photos.length > 0 || editing)) setConfirmDiscard(true);
    else onClose();
  }, [saving, step, photos.length, editing, onClose]);

  const goTo = (next: CreateStep) => {
    setDirection(STEPS.findIndex((s) => s.id === next) > STEPS.findIndex((s) => s.id === step) ? 1 : -1);
    setStep(next);
  };

  const goBack = () => {
    if (saving) return;
    setSave({ status: 'idle' });
    // A saved post keeps its kind: Back goes to its photos.
    if (step === 'details') goTo(editing ? 'capture' : 'kind');
    else if (step === 'kind') goTo('capture');
    else requestClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // A map picker on top handles its own Escape.
      if (document.querySelector('.modal.show')) return;
      if (confirmDiscard) setConfirmDiscard(false);
      else if (draftsOpen) setDraftsOpen(false);
      else requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmDiscard, draftsOpen, requestClose]);

  const addPhotos = (added: CreatePhoto[]) => setPhotos((prev) => [...prev, ...added]);
  const removePhoto = (id: string) =>
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone?.file) URL.revokeObjectURL(gone.url);
      return prev.filter((p) => p.id !== id);
    });

  // Finish a draft picked from the camera's Drafts list.
  const openDraft = (card: FoodCardRecord) => {
    const k = kindOfCard(card);
    if (!k) return;
    photos.forEach((p) => p.file && URL.revokeObjectURL(p.url));
    setPhotos(photosOfCard(card));
    setKind(k);
    setFields(fieldsOfCard(card));
    setEditing(editingOf(card));
    setDraftsOpen(false);
    setSave({ status: 'idle' });
    goTo('details');
  };

  const patchFields = (patch: Partial<PostFields>) => {
    setFields((f) => ({ ...f, ...patch }));
    if (save.status === 'error') setSave({ status: 'idle' });
  };

  const toInput = (k: CreateKind): PostInput => ({
    kind: k,
    photos: photos.map((p) => p.file ?? p.url),
    title: fields.title,
    caption: fields.caption,
    tags: fields.tags,
    flavorProfile: fields.flavorProfile,
    businessIdentity: fields.businessIdentity,
    labels: fields.labels,
    isHome: fields.isHome,
    place: fields.place,
    menuItemId: fields.menuItemId,
    ingredients: fields.ingredients,
    steps: fields.steps,
    newPlace: k === 'restaurant' ? fields.newPlace : null,
  });

  const submit = async (publish: boolean) => {
    if (!kind || saving) return;
    const input = toInput(kind);
    if (publish) {
      const missing = missingForPublish(input);
      if (missing) {
        setSave({ status: 'error', message: missing });
        return;
      }
    }
    setSave({ status: 'saving', publishing: publish });
    const res = await PostService.save(input, publish ? 'PUBLISHED' : 'DRAFT', editing?.id);
    if (!res.success) {
      if (res.duplicate) {
        // The new restaurant is already on the map: post to that place instead.
        const existing = await placeFromDuplicate(res.duplicate);
        patchFields({ newPlace: null, place: existing });
        setSave({ status: 'error', message: `${existing.name ?? 'This place'} is already on the map, so we picked it for you. Tap Post to share your photos there.` });
        return;
      }
      setSave({ status: 'error', message: res.error || 'Something went wrong. Please try again.' });
      return;
    }
    setSave({ status: 'idle' });
    setResult({ published: publish, edited: editingPublished, addedPlace: publish && input.newPlace ? input.newPlace.name.trim() : undefined, card: res.data });
    setDirection(1);
    setStep('done');
    onSaved?.();
    // Photos taken out while editing are deleted from storage (best effort).
    if (editing && res.data) {
      const kept = new Set(res.data.photos?.length ? res.data.photos : res.data.image_url ? [res.data.image_url] : []);
      MediaUploadService.removePostPhotos(editing.originalPhotos.filter((u) => !kept.has(u)));
      setEditing({ ...editing, status: res.data.status, originalPhotos: [...kept] });
    }
    // Posting from the place counts a visit there (checked by the database:
    // within 150 m, once a day). Runs after the done screen shows.
    const card = res.data;
    const atPlace = publish && !editingPublished && card && kind !== 'recipe' && !card.is_home && (card.place_id || card.restaurant_id || card.community_place_id);
    if (atPlace) {
      const placeName = card.place_name || input.place?.name || 'this place';
      PostService.recordVisit(card.id).then((counted) => {
        if (counted) setResult((r) => (r ? { ...r, visitAt: placeName } : r));
      });
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const kindLabel = KIND_OPTIONS.find((k) => k.id === kind)?.label ?? '';
  const detailsReady = !!kind && READY_KINDS.includes(kind);
  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 40 * direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 * direction },
      };

  return createPortal(
    <div ref={trapRef} className={`cf${step === 'capture' ? ' cf--camera' : ''}`} role="dialog" aria-modal="true" aria-label="Create a post">
      {step !== 'capture' && step !== 'done' && (
        <header className="cf__head">
          <button type="button" className="cf__icon" onClick={goBack} aria-label="Back" disabled={saving}>
            <ArrowLeft size={20} />
          </button>
          <div className="cf__titles">
            <h1 className="cf__title">{step === 'kind' ? 'What is this?' : editingPublished ? `Edit ${kindLabel.toLowerCase()}` : `${kindLabel} details`}</h1>
            <ol className="cf__progress" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
              {STEPS.map((s, i) => (
                <li key={s.id} className={i <= stepIndex ? 'is-done' : ''} aria-current={i === stepIndex ? 'step' : undefined}>
                  <span className="visually-hidden">{s.label}</span>
                </li>
              ))}
            </ol>
          </div>
          <button type="button" className="cf__icon" onClick={requestClose} aria-label="Close" disabled={saving}>
            <X size={20} />
          </button>
        </header>
      )}

      <div className="cf__body">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} className="cf__step" {...slide} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>
            {step === 'capture' && (
              <CameraCapture
                mode={mode}
                onModeChange={setMode}
                photos={photos}
                onAddPhotos={addPhotos}
                onRemovePhoto={removePhoto}
                onNext={() => goTo(editing ? 'details' : 'kind')}
                onClose={requestClose}
                draftCount={editing ? 0 : drafts.length}
                onOpenDrafts={() => setDraftsOpen(true)}
              />
            )}

            {step === 'kind' && (
              <KindPicker
                photos={photos}
                selected={kind}
                onPick={(k) => {
                  setKind(k);
                  goTo('details');
                }}
              />
            )}

            {step === 'details' && kind && (
              <div className="cf-details">
                <ul className="cf-kind__photos" aria-label="Your photos">
                  {photos.map((p, i) => (
                    <li key={p.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={`Photo ${i + 1}`} />
                    </li>
                  ))}
                </ul>

                {kind === 'vibe' && <VibeDetails fields={fields} onChange={patchFields} />}
                {kind === 'food' && <FoodDetails photos={photos} fields={fields} onChange={patchFields} />}
                {kind === 'recipe' && <RecipeDetails fields={fields} onChange={patchFields} />}
                {kind === 'restaurant' && <RestaurantDetails photos={photos} fields={fields} onChange={patchFields} />}

                {!detailsReady && (
                  <div className="cf-soon__card">
                    <span className="cf-soon__badge">Coming next</span>
                    <h2 className="cf-soon__title">{kindLabel} posts</h2>
                    <p className="cf-soon__sub">This step is being built. It will ask for:</p>
                    <ul className="cf-soon__list">
                      {COMING_NEXT[kind].map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {step === 'done' && kind && result && (
              <div className="cf-done">
                <motion.span
                  className="cf-done__icon"
                  initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  aria-hidden="true"
                >
                  <Check size={40} strokeWidth={3} />
                </motion.span>
                {photos[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="cf-done__photo" src={photos[0].url} alt="" />
                )}
                <h2 className="cf-done__title">{result.edited ? 'Changes saved' : result.published ? 'Posted!' : 'Draft saved'}</h2>
                <p className="cf-done__sub">
                  {result.edited
                    ? 'Your post is updated everywhere it shows.'
                    : result.published
                    ? result.addedPlace
                      ? `${result.addedPlace} is on the map as Community Added, and your photos are on the Feed and your profile.`
                      : `Your ${kindLabel.toLowerCase()} is on ${POSTED_TO[kind]}.`
                    : 'You can finish it later from your profile.'}
                </p>
                <div role="status" className="cf-done__status">
                  <AnimatePresence>
                    {result.visitAt && (
                      <motion.span
                        className="cf-done__visit"
                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <Footprints size={15} aria-hidden="true" /> Visit counted at {result.visitAt}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="cf-done__actions">
                  {result.published && result.card && (
                    <button type="button" className="cf-bar__post" onClick={() => setSharing(postSharePayload(result.card!))}>
                      <Share2 size={18} aria-hidden="true" /> Share
                    </button>
                  )}
                  {result.published && (
                    <button
                      type="button"
                      className="cf-bar__draft"
                      onClick={() => {
                        onClose();
                        router.push('/profile?activity=posts');
                      }}
                    >
                      See it on my profile
                    </button>
                  )}
                  <button type="button" className="cf-bar__draft" onClick={onClose}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Post / Save draft */}
      {step === 'details' && detailsReady && (
        <div className="cf-bar">
          <AnimatePresence>
            {save.status === 'error' && (
              <motion.p
                className="cf-bar__error"
                role="alert"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {save.message}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="cf-bar__row">
            {!editingPublished && (
              <button type="button" className="cf-bar__draft" onClick={() => submit(false)} disabled={saving}>
                {saving && !save.publishing ? <Loader2 size={18} className="scout-spin" /> : null} Save draft
              </button>
            )}
            <button type="button" className="cf-bar__post" onClick={() => submit(true)} disabled={saving}>
              {saving && save.publishing ? (
                <>
                  <Loader2 size={18} className="scout-spin" /> {editingPublished ? 'Saving…' : 'Posting…'}
                </>
              ) : editingPublished ? (
                'Save changes'
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      )}

      <ShareSheet payload={sharing} onClose={() => setSharing(null)} />

      <DraftsSheet
        open={draftsOpen}
        drafts={drafts}
        onClose={() => setDraftsOpen(false)}
        onOpenDraft={openDraft}
        onDeleted={(id) => {
          setDrafts((list) => list.filter((d) => d.id !== id));
          onSaved?.();
        }}
      />

      <AnimatePresence>
        {confirmDiscard && (
          <motion.div
            className="cf-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDiscard(false)}
          >
            <motion.div
              className="cf-confirm__sheet"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="cf-confirm-title"
              aria-describedby="cf-confirm-text"
              initial={reduceMotion ? false : { y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="cf-confirm-title" className="cf-confirm__title">{editing ? 'Discard changes?' : 'Discard post?'}</h2>
              <p id="cf-confirm-text" className="cf-confirm__text">
                {editing
                  ? `Changes you made won't be saved. Your ${editing.status === 'DRAFT' ? 'draft' : 'post'} stays as it was.`
                  : `Your ${photos.length === 1 ? 'photo' : `${photos.length} photos`} and anything you've filled in will be lost.`}
              </p>
              <div className="cf-confirm__actions">
                <button type="button" className="cf-confirm__btn cf-confirm__btn--danger" onClick={onClose}>
                  Discard
                </button>
                <button type="button" className="cf-confirm__btn" onClick={() => setConfirmDiscard(false)} autoFocus>
                  Keep editing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

export default CreateFlow;
