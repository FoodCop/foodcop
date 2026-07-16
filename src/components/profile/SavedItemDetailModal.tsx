import React, { useMemo, useState } from 'react';
import type { AppItem } from '../../types/appItem';
import { areSavedItemsEquivalent, inferItemTypeFromId } from '../../lib/services/savedItems';

interface SavedItemDetailModalProps {
  item: AppItem;
  savedItems?: AppItem[];
  onClose: () => void;
  onSave?: (item: AppItem) => void;
  onUnsave?: (item: AppItem) => void;
  onShareRequest?: (item: AppItem) => void;
}

export default function SavedItemDetailModal({
  item,
  savedItems = [],
  onClose,
  onSave,
  onUnsave,
  onShareRequest,
}: SavedItemDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'ingredients' | 'instructions'>('details');

  const metadata = typeof item.metadata === 'object' && item.metadata !== null ? (item.metadata as Record<string, unknown>) : {};
  
  let resolvedType = 'other';
  if (typeof item.itemType === 'string' && item.itemType) {
    resolvedType = item.itemType;
  } else if (typeof item.id === 'string') {
    resolvedType = inferItemTypeFromId(item.id);
  }

  const title = item.name || item.title || String(metadata.title || metadata.name || 'Saved Item');
  const category = item.cat || String(metadata.cat || metadata.category || 'Saved Item');
  const imageSrc = item.img || item.image || item.imageUrl || item.thumbnailUrl || String(metadata.image || metadata.img || metadata.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80');
  const summary = String(metadata.description || metadata.caption || metadata.summary || item.description || item.caption || '');
  const address = item.address || String(metadata.address || metadata.locationName || '');
  
  const generatedRecipe = typeof metadata.generatedRecipe === 'object' && metadata.generatedRecipe !== null ? (metadata.generatedRecipe as Record<string, unknown>) : null;
  const recipeIngredients = Array.isArray(generatedRecipe?.ingredients) ? generatedRecipe?.ingredients as string[] : [];
  const recipeInstructions = typeof generatedRecipe?.instructions === 'string' ? generatedRecipe.instructions : '';

  const isAlreadySaved = useMemo(() => savedItems.some((savedItem) => areSavedItemsEquivalent(savedItem, item)), [item, savedItems]);

  const handleSaveClick = () => {
    if (!onSave || isAlreadySaved) return;
    onSave(item);
  };

  const handleUnsaveClick = () => {
    if (!onUnsave || !isAlreadySaved) return;
    onUnsave(item);
    onClose();
  };

  const handleShareClick = () => {
    if (!onShareRequest) return;
    onShareRequest(item);
    onClose();
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          {/* Header Image */}
          <div className="position-relative" style={{ height: '250px' }}>
            <img src={imageSrc} alt={title} className="w-100 h-100 object-fit-cover" />
            <button
              type="button"
              className="btn-close position-absolute top-0 end-0 m-3 bg-white p-2 rounded-circle shadow-sm"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h3 className="fw-bolder mb-1">{title}</h3>
                <span className="badge bg-warning text-dark text-uppercase">{category}</span>
              </div>
            </div>

            {summary && <p className="text-muted fw-semibold">{summary}</p>}
            {address && (
              <p className="text-muted small mb-4">
                <strong>📍 Address:</strong> {address}
              </p>
            )}

            {/* Content Tabs (For Recipes) */}
            {resolvedType === 'recipe' && (
              <div className="mb-4">
                <ul className="nav nav-pills nav-fill mb-3 bg-light rounded-3 p-1">
                  <li className="nav-item">
                    <button
                      className={`nav-link rounded-3 fw-bold ${activeTab === 'details' ? 'active bg-warning text-dark' : 'text-secondary'}`}
                      onClick={() => setActiveTab('details')}
                    >
                      Details
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link rounded-3 fw-bold ${activeTab === 'ingredients' ? 'active bg-warning text-dark' : 'text-secondary'}`}
                      onClick={() => setActiveTab('ingredients')}
                    >
                      Ingredients
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link rounded-3 fw-bold ${activeTab === 'instructions' ? 'active bg-warning text-dark' : 'text-secondary'}`}
                      onClick={() => setActiveTab('instructions')}
                    >
                      Instructions
                    </button>
                  </li>
                </ul>

                <div className="tab-content">
                  {activeTab === 'details' && (
                    <div className="p-3 bg-light rounded-3">
                       <p className="mb-0 text-muted">More details about this recipe will appear here.</p>
                    </div>
                  )}
                  {activeTab === 'ingredients' && (
                    <ul className="list-group list-group-flush border rounded-3 overflow-hidden">
                      {recipeIngredients.length > 0 ? (
                        recipeIngredients.map((ing, i) => (
                          <li key={i} className="list-group-item bg-light text-dark fw-medium">
                            {ing}
                          </li>
                        ))
                      ) : (
                        <li className="list-group-item text-muted">No ingredients listed.</li>
                      )}
                    </ul>
                  )}
                  {activeTab === 'instructions' && (
                    <div className="p-3 bg-light rounded-3 text-dark fw-medium" style={{ whiteSpace: 'pre-wrap' }}>
                      {recipeInstructions || 'No instructions provided.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer bg-light border-top-0 p-3 d-flex gap-2">
            {isAlreadySaved ? (
              <button type="button" className="btn btn-danger flex-grow-1 fw-bold rounded-pill" onClick={handleUnsaveClick}>
                Remove from Plate
              </button>
            ) : (
              <button type="button" className="btn btn-dark flex-grow-1 fw-bold rounded-pill" onClick={handleSaveClick}>
                Save to Plate
              </button>
            )}
            <button type="button" className="btn btn-warning flex-grow-1 fw-bold text-dark rounded-pill" onClick={handleShareClick}>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
