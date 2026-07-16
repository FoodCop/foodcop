# Trims HTML/CSS Specification

**To the Developer/Claude:**
Please generate the HTML and CSS for the "Trims" feature. Trims are a user-generated content creation suite where users can upload a video, trim it, and use AI to generate a description. We will hook up our `GeminiService.analyzeTrim` to your HTML using the specific IDs and classes requested below.

## 1. Required DOM Elements & IDs

- **Upload & Editor**:
  - `<input type="file" id="trim-video-upload" accept="video/*" class="hidden">`
  - `<button id="trim-upload-trigger">Upload Video</button>`
  - `<div id="trim-video-preview-container"></div>` (Where the video player will sit for editing)

- **AI Generation Suite**:
  - `<button id="trim-ai-generate-btn">Generate AI Caption</button>`
  - `<textarea id="trim-caption-input" placeholder="Your caption..."></textarea>` (The AI will populate this, or the user can type)
  - `<div id="trim-ai-loading-state" class="hidden">Generating magic...</div>`

- **Publishing**:
  - `<button id="trim-publish-btn">Publish Trim</button>`

## 2. Design Aesthetic
- Use "Claymorphism" (soft 3D UI elements, pastel colors, soft inner and outer shadows). Do NOT use dark mode.
- A friendly, soft timeline/scrubber aesthetic for the video preview.
- The AI Generation button should look "smart" (e.g., soft gradient borders, sparkle icons).

## 4. Supabase Schema Reference
Once published, this data is saved to the `public.bites` table (short-form videos), updating `video_url`, `title`, and `ai_tags`.

## 3. JavaScript Note
You can write the JS for the local file reader (to preview the uploaded video locally in the browser) and UI state toggling (showing/hiding the loading state). Do NOT write the actual API fetch call to Gemini; just leave a stub function `function handleAIGeneration(videoFile) { ... }` that we will overwrite.
