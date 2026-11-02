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
GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
JWT_SECRET_KEY=replace_with_a_long_random_backend_secret
```

`GOOGLE_CLIENT_ID` must be the same Google Web application client ID used by the
frontend. `JWT_SECRET_KEY` is required after Google verifies the user, because
the backend signs the application session token.

For Google Identity Services, add both local origins below and your deployed
frontend origin to **Authorized JavaScript origins** in Google Cloud Console:

```text
http://localhost:5173
http://127.0.0.1:5173
https://kidchatbot-frontend.onrender.com
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
VITE_GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
```

The frontend variable is required at build time; without
`VITE_GOOGLE_CLIENT_ID`, the Google button is intentionally not rendered.
When deploying to Render, set `VITE_API_URL=https://kidchatbot-backend.onrender.com`
and `VITE_GOOGLE_CLIENT_ID` on the frontend service, and `GOOGLE_CLIENT_ID`,
`JWT_SECRET_KEY`, and `CORS_ORIGINS` on the backend service. Use the same client
ID in both services.

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
