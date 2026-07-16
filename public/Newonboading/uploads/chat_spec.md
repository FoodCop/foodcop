# Chat HTML/CSS Specification

**To the Developer/Claude:**
Please generate the HTML and CSS for the direct messaging "Chat" feature. Do **NOT** write the backend WebSocket or Supabase integration JavaScript. We will hook up our realtime services to your HTML using the specific IDs and classes requested below.

## 1. Required DOM Elements & IDs

- **Thread List (Sidebar/Inbox)**:
  - `<div id="chat-inbox-list"></div>`
  - *Purpose*: List of active conversations. 
  - Each item should be: `<div class="chat-thread-item" data-thread-id="PLACEHOLDER">...</div>`
  
- **Active Conversation View**:
  - `<div id="chat-active-header"></div>` (Shows the current user you are talking to)
  - `<div id="chat-messages-container"></div>` (The scrollable message area)

- **Input Area**:
  - `<textarea id="chat-input"></textarea>`
  - `<button id="chat-send-btn">Send</button>`

- **Message Bubble Templates**:
  - Sent by current user: `<div class="chat-bubble sent">...</div>`
  - Received from friend: `<div class="chat-bubble received">...</div>`

## 2. Design Aesthetic
- Use "Claymorphism" (soft 3D UI elements, pastel colors, soft inner and outer shadows). Do NOT use dark mode.
- Should feel like a modern, snappy messenger but with soft, playful bubbles.
- Clean typography and distinct colors for sent vs received bubbles.

## 4. Supabase Schema Reference
Assume the messenger interacts with basic real-time tables like `public.chat_threads` and `public.chat_messages` (even if they aren't fully fleshed out in the master schema yet).

## 3. JavaScript Note
You can handle the UI state for switching between the Inbox view and the Active Chat view on mobile devices, and the scrolling logic. We will handle the database syncing.
