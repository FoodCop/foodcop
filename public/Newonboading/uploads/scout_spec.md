# Scout HTML/CSS Specification

**To the Developer/Claude:** 
Please generate the HTML and CSS for the "Scout" feature (a location-based food and restaurant discovery map). Do **NOT** write the backend or API integration JavaScript. We will hook up our `PlacesService.js` to your HTML using the specific IDs and classes requested below.

## 1. Required DOM Elements & IDs

For our JavaScript to bind correctly, your HTML MUST include the following elements with the exact IDs:

- **Map Container**: 
  - `<div id="scout-map-container"></div>`
  - *Purpose*: We will inject the Google Map API here. Ensure it has a defined width/height (e.g., `flex-1` or `h-full`).
  
- **Search Bar**:
  - `<input type="text" id="scout-search-input" placeholder="Search for food or places...">`
  - `<button id="scout-search-btn">Search</button>`
  - `<button id="scout-location-btn">My Location</button>`

- **Results Container**:
  - `<div id="scout-results-list"></div>`
  - *Purpose*: We will inject the list of places dynamically here.
  
- **Result Card Template (Design this for us)**:
  - Please design a beautiful, modern "Place Card" that we can use as a template. 
  - It should have placeholders for an Image, Title, Rating, Cuisine, and Distance.
  - The outermost wrapper of the card must use the class `.scout-place-card` and have a `data-place-id=""` attribute.
  - Example: `<div class="scout-place-card" data-place-id="PLACEHOLDER">...</div>`

## 2. Design Aesthetic
- Use "Claymorphism" (soft 3D UI elements, pastel colors, soft inner and outer shadows). Do NOT use dark mode or glassmorphism.
- The map should take up the majority of the screen, with the search overlaying it floating at the top, and a draggable/scrollable bottom sheet or side panel for the `scout-results-list`.

## 4. Supabase Schema Reference
When building the mock backend saving logic (if any), assume we are saving places to the `public.food_cards` table (which has `place_id`, `title`, `card_type`, etc.) or mapping them to `users` and `user_stats`.

## 3. JavaScript Note
You can include purely visual JavaScript (e.g., opening/closing the bottom sheet, micro-animations on hover), but leave the actual map initialization and API fetching to us.
