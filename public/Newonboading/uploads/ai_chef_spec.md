# AI Chef HTML/CSS Specification

**To the Developer/Claude:**
Please generate the HTML and CSS for the "AI Chef" feature (a conversational AI assistant that can analyze food photos and generate recipes). Do **NOT** write the backend API integration JavaScript. We will hook up our `GeminiService.js` to your HTML using the specific IDs and classes requested below.

## 1. Required DOM Elements & IDs

For our JavaScript to bind correctly, your HTML MUST include the following elements with the exact IDs:

- **Chat History Container**:
  - `<div id="chef-chat-history"></div>`
  - *Purpose*: Where the conversation bubbles will be appended. Should be a scrollable area.

- **Input Area**:
  - `<textarea id="chef-message-input" placeholder="Ask the Chef..."></textarea>`
  - `<button id="chef-send-btn">Send</button>`
  
- **Image Upload (Multimodal AI)**:
  - `<input type="file" id="chef-image-upload" accept="image/*" class="hidden">`
  - `<button id="chef-upload-trigger">Upload Photo</button>` (This button will trigger the hidden input)
  - `<div id="chef-image-preview"></div>` (To show the selected thumbnail before sending)

- **Message Bubble Templates (Design this for us)**:
  - Please design two types of chat bubbles:
    - User Message: `<div class="chef-msg user-msg">...</div>`
    - AI Message: `<div class="chef-msg ai-msg">...</div>`
  
- **Recipe Card Template**:
  - The AI often returns structured recipe data. Design a beautiful "Recipe Card" inside an AI message.
  - Required classes: `.recipe-card`, `.recipe-title`, `.recipe-ingredients`, `.recipe-instructions`.

## 2. Design Aesthetic
- Use "Claymorphism" (soft 3D UI elements, pastel colors, soft inner and outer shadows). Do NOT use dark mode or clinical terminal designs. 
- The chat should feel like a high-end food concierge with soft bubbly UI components and elegant typography.
- Micro-animations for the AI "typing" state (`#chef-typing-indicator`).

## 4. Supabase Schema Reference
Assume that generated recipes will be saved to the `public.food_cards` table with `card_type = 'RECIPE'`, which stores `flavor_profile`, `ingredients`, and `title`.

## 3. JavaScript Note
You may write JS for auto-resizing the textarea, scrolling the chat to the bottom, and handling the image preview logic (reading the file as a DataURL to show the thumbnail). Leave the actual AI fetching to us.
