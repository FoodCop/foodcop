'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchCuratedRecipes, type CuratedRecipe } from '@/lib/recipes/curatedRecipes';

// Ported from Romio's src/pages/Home.tsx: the Tinder-style drag/swipe card
// stack (same drag physics, stacked-card transforms, swipe-off keyframe
// animations), re-pointed at real recipes from curatedRecipes.json instead of
// dating profiles. Liking/saving is local state for now - persisting to
// Supabase (saved_items/food_card_likes) is a follow-up once that's wired.
export default function SwipeFeed() {
  const [cards, setCards] = useState<CuratedRecipe[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragInfo = useRef({ isDragging: false, startX: 0, moveX: 0 });

  useEffect(() => {
    fetchCuratedRecipes().then((all) => {
      const shuffled = [...all].sort(() => Math.random() - 0.5).slice(0, 30);
      setCards(shuffled);
      setLoading(false);
    });
  }, []);

  // reset transforms of visible cards after index changes
  useEffect(() => {
    const t = setTimeout(() => {
      const node = containerRef.current;
      if (!node) return;
      const nodeCards = Array.from(node.querySelectorAll<HTMLDivElement>('.tinder-card'));
      nodeCards.forEach((cardEl, idx) => {
        const stackIdx = idx - currentIndex;
        if (stackIdx < 0) {
          cardEl.style.display = 'none';
        } else if (stackIdx === 0) {
          cardEl.style.display = 'flex';
          cardEl.style.zIndex = `${cards.length}`;
          cardEl.style.transform = 'translateY(0) scale(1) rotate(0deg)';
          cardEl.style.opacity = '1';
        } else if (stackIdx > 0 && stackIdx < 6) {
          cardEl.style.display = 'flex';
          cardEl.style.zIndex = `${cards.length - stackIdx}`;
          cardEl.style.transform = `translateY(${stackIdx * 10}px) scale(${1 - stackIdx * 0.03}) rotate(0deg)`;
          cardEl.style.opacity = '1';
        } else {
          cardEl.style.display = 'none';
        }
        const likeEl = cardEl.querySelector<HTMLElement>('.like');
        const dislikeEl = cardEl.querySelector<HTMLElement>('.dislike');
        if (likeEl) likeEl.style.opacity = '0';
        if (dislikeEl) dislikeEl.style.opacity = '0';
      });
    }, 30);

    return () => clearTimeout(t);
  }, [currentIndex, cards]);

  function handleSwipe(direction: 'left' | 'right') {
    if (isAnimating) return;
    if (currentIndex >= cards.length) return;

    setIsAnimating(true);
    const node = containerRef.current;
    if (!node) return;
    const cardEls = Array.from(node.querySelectorAll<HTMLDivElement>('.tinder-card'));
    const currentCard = cardEls[currentIndex];
    if (!currentCard) return;

    const likeEl = currentCard.querySelector<HTMLElement>('.like');
    const dislikeEl = currentCard.querySelector<HTMLElement>('.dislike');

    if (direction === 'right') {
      if (likeEl) likeEl.style.opacity = '1';
      currentCard.style.animation = 'swipeRight 0.5s forwards';
    } else {
      if (dislikeEl) dislikeEl.style.opacity = '1';
      currentCard.style.animation = 'swipeLeft 0.5s forwards';
    }

    setTimeout(() => {
      currentCard.style.display = 'none';
      setCurrentIndex((prev) => prev + 1);
      if (likeEl) likeEl.style.opacity = '0';
      if (dislikeEl) dislikeEl.style.opacity = '0';
      setIsAnimating(false);
    }, 500);
  }

  function onDragStart(clientX: number, idx: number, card: HTMLDivElement) {
    if (idx !== currentIndex) return;
    dragInfo.current = { isDragging: true, startX: clientX, moveX: 0 };
    card.style.transition = 'none';
  }

  function onDragMove(clientX: number) {
    if (!dragInfo.current.isDragging || isAnimating || currentIndex >= cards.length) return;
    const cardElems = containerRef.current?.querySelectorAll<HTMLDivElement>('.tinder-card');
    if (!cardElems) return;
    const currentCard = cardElems[currentIndex];
    if (!currentCard) return;

    dragInfo.current.moveX = clientX - dragInfo.current.startX;
    const rotate = dragInfo.current.moveX * 0.1;
    currentCard.style.transform = `translateX(${dragInfo.current.moveX}px) rotate(${rotate}deg) translateY(0) scale(1)`;

    const likeEl = currentCard.querySelector<HTMLElement>('.like');
    const dislikeEl = currentCard.querySelector<HTMLElement>('.dislike');
    if (dragInfo.current.moveX > 50) {
      if (likeEl) likeEl.style.opacity = `${Math.min(1, dragInfo.current.moveX / 100)}`;
      if (dislikeEl) dislikeEl.style.opacity = '0';
    } else if (dragInfo.current.moveX < -50) {
      if (dislikeEl) dislikeEl.style.opacity = `${Math.min(1, Math.abs(dragInfo.current.moveX) / 100)}`;
      if (likeEl) likeEl.style.opacity = '0';
    }
  }

  function onDragEnd() {
    if (!dragInfo.current.isDragging) return;
    dragInfo.current.isDragging = false;
    const cardElems = containerRef.current?.querySelectorAll<HTMLDivElement>('.tinder-card');
    if (!cardElems) return;
    const currentCard = cardElems[currentIndex];
    if (!currentCard) return;

    currentCard.style.transition = 'transform 0.3s ease';
    if (dragInfo.current.moveX > 100) {
      handleSwipe('right');
    } else if (dragInfo.current.moveX < -100) {
      handleSwipe('left');
    } else {
      currentCard.style.transform = 'translateY(0) rotate(0deg) scale(1)';
      const likeEl = currentCard.querySelector<HTMLElement>('.like');
      const dislikeEl = currentCard.querySelector<HTMLElement>('.dislike');
      if (likeEl) likeEl.style.opacity = '0';
      if (dislikeEl) dislikeEl.style.opacity = '0';
    }
    dragInfo.current.moveX = 0;
  }

  if (loading) {
    return (
      <div className="container text-center py-5 text-muted">
        Loading recipes…
      </div>
    );
  }

  return (
    <div className="container">
      <div
        className="tinder-container"
        ref={containerRef}
        onMouseMove={(e) => onDragMove(e.clientX)}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
      >
        {cards.map((recipe, idx) => (
          <div
            key={recipe.id}
            className="tinder-card"
            data-index={idx}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%), url(${recipe.image})`,
            }}
            onMouseDown={(e) => onDragStart(e.clientX, idx, e.currentTarget)}
            onTouchStart={(e) => onDragStart(e.touches[0].clientX, idx, e.currentTarget)}
            onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
            onTouchEnd={onDragEnd}
          >
            <div className="dislike">✕</div>
            <div className="like">♥</div>

            <div className="card-info">
              <h3>{recipe.title}</h3>
              <div className="feed-meta">
                <span>⏱ {recipe.readyInMinutes} min</span>
                <span>🍽 {recipe.servings} servings</span>
                {recipe.cuisines[0] && <span>{recipe.cuisines[0]}</span>}
              </div>
            </div>
          </div>
        ))}

        <div className="card-actions">
          <button className="action-btn dislike-btn" onClick={() => handleSwipe('left')} type="button" aria-label="Skip">
            ✕
          </button>
          <button className="action-btn like-btn" onClick={() => handleSwipe('right')} type="button" aria-label="Save">
            ♥
          </button>
        </div>

        <div className="end-message" style={{ display: currentIndex >= cards.length ? 'block' : 'none' }}>
          You&rsquo;re all caught up.
          <br />
          Check back later for more recipes.
        </div>
      </div>
    </div>
  );
}
