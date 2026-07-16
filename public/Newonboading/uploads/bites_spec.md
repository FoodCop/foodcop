# Bites HTML/CSS Specification

**To the Developer/Claude:**
Please generate the HTML and CSS for the "Bites" feature. Bites are short-form, vertical, immersive food videos (similar to TikToks or Instagram Reels). Do **NOT** write the backend data fetching JavaScript. We will hook it up using the specific IDs and classes requested below.

## 1. Required DOM Elements & IDs

- **Feed Container**:
  - `<div id="bites-feed-container"></div>`
  - *Purpose*: This wrapper must support vertical snap-scrolling (CSS `scroll-snap-type: y mandatory`).
  
- **Bite Item Template (Design this for us)**:
  - Each video in the feed must use this structure:
    ```html
    <div class="bite-item" data-bite-id="PLACEHOLDER">
      <video class="bite-video" loop playsinline></video>
      <div class="bite-overlay">
        <!-- Overlay UI goes here -->
      </div>
    </div>
    ```
  - *Purpose*: The `.bite-item` needs `scroll-snap-align: start`.

- **Interaction Buttons (Inside the Overlay)**:
  - `<button class="bite-like-btn" data-bite-id="PLACEHOLDER">Like</button>`
  - `<button class="bite-save-btn" data-bite-id="PLACEHOLDER">Save</button>`
  - `<button class="bite-share-btn" data-bite-id="PLACEHOLDER">Share</button>`
  - `<div class="bite-metadata">...</div>` (Title, Author, description)

## 2. Design Aesthetic
- Edge-to-edge vertical video experience but incorporate "Claymorphism" for the interactive UI elements (soft 3D buttons, pastel tones for the interface).
- The UI overlay (buttons, text) should float above the video with soft inner/outer shadows so it's readable and playful.
- Engaging micro-animations (e.g., heart popping when double-tapping the video or clicking the like button).

## 4. Supabase Schema Reference
The videos are loaded from and saved to the `public.bites` table, which contains `id`, `author_id`, `video_url`, `title`, and `likes_count`.

## 3. JavaScript Note
You **must** write the Intersection Observer (or similar logic) to handle playing the video that is currently in view and pausing the ones out of view. We will handle fetching the list of video URLs and rendering the `.bite-item` DOM elements.
