# KidChatBot

KidChatBot is a friendly AI learning assistant for children. Kids can ask questions by typing or speaking, receive short and age-appropriate answers, and listen to the responses through browser text-to-speech.

The project contains a FastAPI backend connected to the Groq API and a React/Vite frontend with Bunny branding and browser-persisted chat history.

## Features

- Kid-friendly AI answers with Markdown rendering.
- Text input and browser microphone input.
- Microphone transcripts are sent automatically after a 0.5-second pause.
- Browser text-to-speech for AI responses, with pause and stop controls.
- A chime sound whenever a message is sent to the AI.
- Bunny video animation while responses are spoken.
- Responsive layout for desktop, tablet, and mobile screens.
- Light and dark themes with consistent colors and accessible focus states.
- Chat history with question counts and persisted creation/update dates.
- A 20-question limit per conversation.

## Requirements

- Python 3.10 or newer.
- Node.js 18 or newer.
- A Groq API key.
- A browser with Web Speech API support for microphone input and speech synthesis.

Microphone access normally requires `localhost` or HTTPS. The browser asks for permission the first time the microphone is used.

## Project Structure

```text
AI-CHATBOT/
├── main.py                 # FastAPI backend
├── requirements.txt        # Python dependencies
└── frontend/
    └── tts/
        ├── public/         # Bunny video, chime, and brand assets
        ├── src/
        │   ├── App.jsx
        │   ├── App.css
        │   └── index.css
        └── package.json
```

## Setup

### 1. Configure the Groq API key

Create a `.env` file in the project root:

```env
GROQ_API=your_groq_api_key
```

### 2. Install and start the backend

From the project root:

```bash
source venv/bin/activate
pip install fastapi uvicorn python-dotenv groq
python main.py
```

The backend runs at `http://127.0.0.1:8000`.

### 3. Install and start the frontend

In a second terminal:

```bash
cd frontend/tts
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

By default, the development frontend calls `http://127.0.0.1:8000`. To use another backend URL, create `frontend/tts/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## API

### `GET /`

Returns a simple backend health response.

### `POST /ask`

Request:

```json
{
  "text": "Why is the sky blue?",
  "history": [
    {
      "role": "user",
      "content": "Tell me about the sky"
    },
    {
      "role": "assistant",
      "content": "The sky looks blue because of sunlight..."
    }
  ]
}
```

Successful response:

```json
{
  "answer": "The sky looks blue because sunlight scatters in Earth's atmosphere."
}
```

## Production Build

Create the frontend production bundle with:

```bash
cd frontend/tts
npm run build
```

Preview the production bundle locally with:

```bash
npm run preview
```

## Development Checks

Run the frontend linter with:

```bash
cd frontend/tts
npm run lint
```
