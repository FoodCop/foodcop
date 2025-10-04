# AI Page Specification

## Overview
The AI page provides an intelligent food assistant that can answer questions, provide recommendations, and help users discover new dining experiences through conversational AI.

## Core Functions

### 1. Conversational Interface
- **Chat Interface**: Clean, chat-like conversation UI
- **Message History**: Persistent conversation history
- **Typing Indicators**: Show AI is thinking/responding
- **Message Types**: Text, images, quick actions
- **Conversation Reset**: Start new conversations

### 2. Food Intelligence
- **Restaurant Recommendations**: Suggest restaurants based on preferences
- **Recipe Suggestions**: Recommend recipes based on ingredients or mood
- **Cuisine Guidance**: Help choose cuisines and dishes
- **Dietary Assistance**: Accommodate dietary restrictions and preferences
- **Nutritional Information**: Provide basic nutritional insights

### 3. Contextual Help
- **Location-based**: Recommendations based on user location
- **Preference Learning**: Learn from user interactions and feedback
- **Personalized Responses**: Tailor responses to user history
- **Multi-turn Conversations**: Maintain context across messages
- **Quick Actions**: Suggested responses and actions

### 4. Content Integration
- **Restaurant Integration**: Link to restaurant details and directions
- **Recipe Integration**: Link to full recipes and cooking instructions
- **Video Integration**: Suggest relevant food videos
- **Plate Integration**: Save recommendations to user's plate

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React hooks + Context API
- **Icons**: Lucide React

### Backend
- **API Routes**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Service**: OpenAI GPT-4
- **Vector Database**: Pinecone (optional)

### External Services
- **OpenAI API**: GPT-4 for conversational AI
- **Google Places API**: Restaurant data
- **Spoonacular API**: Recipe data
- **Pinecone**: Vector search for context

## Environment Variables

```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# External APIs
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
NEXT_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_key

# Optional
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_pinecone_env
```

## Database Schema

### Tables
- `ai_conversations` - User conversation history
- `ai_messages` - Individual messages in conversations
- `user_preferences` - Learned user preferences
- `ai_recommendations` - AI-generated recommendations

### Key Fields
```sql
ai_conversations:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- title (text)
- created_at (timestamp)
- updated_at (timestamp)

ai_messages:
- id (uuid, primary key)
- conversation_id (uuid, foreign key)
- role (enum: user, assistant)
- content (text)
- metadata (jsonb)
- created_at (timestamp)

user_preferences:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- preference_type (text)
- preference_value (text)
- confidence_score (decimal)
- created_at (timestamp)
```

## API Endpoints

### GET /api/ai/conversations
- **Purpose**: Get user's conversation history
- **Response**: Array of conversations with message counts

### POST /api/ai/conversations
- **Purpose**: Create new conversation
- **Body**: `{ title }`
- **Response**: Created conversation object

### GET /api/ai/conversations/:id/messages
- **Purpose**: Get conversation messages
- **Query Params**:
  - `page` (number): Page number
  - `limit` (number): Messages per page
- **Response**: Array of messages

### POST /api/ai/conversations/:id/messages
- **Purpose**: Send message to AI
- **Body**: `{ content, context }`
- **Response**: AI response message

### POST /api/ai/stream
- **Purpose**: Stream AI response
- **Body**: `{ message, conversation_id }`
- **Response**: Streaming AI response

### GET /api/ai/recommendations
- **Purpose**: Get AI recommendations
- **Query Params**:
  - `type` (string): Recommendation type
  - `context` (string): Context for recommendations
- **Response**: Array of recommendations

## UI Components

### Required Components
- `ChatInterface` - Main chat UI
- `MessageBubble` - Individual message display
- `MessageInput` - Message composition
- `ConversationSidebar` - Conversation history
- `QuickActions` - Suggested actions
- `RecommendationCard` - AI recommendation display
- `TypingIndicator` - AI thinking indicator

### Layout Structure
```
AIPage
├── ConversationSidebar
├── ChatInterface
│   ├── MessageList
│   │   └── MessageBubble (repeated)
│   ├── TypingIndicator
│   └── MessageInput
└── QuickActions (overlay)
```

## Performance Requirements

- **Response Time**: < 3 seconds for AI responses
- **Streaming**: < 100ms for first token
- **Message History**: < 1 second for 50 messages
- **Context Loading**: < 500ms for conversation context
- **Mobile Performance**: Smooth typing and scrolling

## Success Metrics

- **Engagement**: Messages sent, conversation length
- **Satisfaction**: User feedback, conversation completion
- **Recommendations**: Recommendations accepted, saved
- **Learning**: Preference accuracy, personalization

## Constraints

- **No Voice**: Text-only interface
- **No Images**: Text and links only
- **Limited Context**: 10 message history context
- **No Real-time**: No live conversation features
- **Mobile First**: Touch-optimized interface

## AI Capabilities

### Food Recommendations
- **Restaurant Suggestions**: Based on location, cuisine, price
- **Recipe Recommendations**: Based on ingredients, dietary needs
- **Cuisine Guidance**: Help choose cuisines and dishes
- **Dietary Assistance**: Accommodate restrictions and preferences

### Conversational Features
- **Natural Language**: Understands natural food-related questions
- **Context Awareness**: Remembers conversation context
- **Personalization**: Learns from user interactions
- **Multi-turn**: Handles complex, multi-step conversations

### Integration Features
- **Restaurant Links**: Direct links to restaurant details
- **Recipe Links**: Direct links to full recipes
- **Save to Plate**: Save recommendations to user's plate
- **Location Awareness**: Recommendations based on location

## Conversation Types

### General Food Questions
- "What's good to eat around here?"
- "I'm craving Italian food"
- "What should I cook for dinner?"
- "Is this restaurant any good?"

### Specific Recommendations
- "Find me a romantic restaurant for two"
- "I need a quick lunch spot"
- "What's a good recipe for chicken?"
- "Where can I get authentic sushi?"

### Dietary Assistance
- "I'm vegetarian, what can I eat?"
- "I'm allergic to nuts, any suggestions?"
- "I'm on a keto diet, help me choose"
- "I need gluten-free options"

## Future Enhancements (Not in MVP)

- Voice input/output
- Image recognition
- Real-time location integration
- Advanced personalization
- Multi-language support
- Voice assistants integration
- AR food recommendations
- Predictive recommendations
