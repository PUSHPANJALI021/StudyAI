# StudyAI — Smart Study Planner

StudyAI is an AI-powered study planning system that helps students track their syllabus, log study sessions, and predict whether they will complete their syllabus before exam day. It also provides intelligent daily topic recommendations using AI (Google Gemini) or a built-in fallback algorithm.

**[Live Demo](#)** :  

---

## Features

### 📖 Subject & Syllabus Management
- Create subjects with exam dates
- Set daily study-hour targets
- Add topics with difficulty levels (1–5)

### ⏱️ Study Session Logging
- Log study time per topic
- Add confidence ratings (1–5)
- Notes support for each session
- Automatic updates to topic progress

### 🤖 AI Completion Forecast
- Uses Google Gemini (1.5 Flash)
- Predicts whether the syllabus will be completed on time
- Provides expected completion date
- Assigns a risk level (Low / Medium / High)
- Generates a confidence score and reasoning summary
- Falls back to a deterministic algorithm if AI is unavailable

### 📅 AI Daily Recommendations
- Suggests what to study today
- Prioritizes high-difficulty topics and low-confidence areas
- Works with AI or fallback logic

### 📊 Dashboard Analytics
- Total subjects and topics
- Completion percentage
- Study hours tracking
- Visual charts using Recharts

### 🗓️ Schedule View
- Auto-generated daily study plan
- AI-enhanced planning (when available)

---

## Tech Stack

### Frontend (/client)
- React 19 + Vite
- Router-free SPA (state-based navigation)
- Recharts (data visualization)
- Lucide React (icons)
- Axios (API requests)

### Backend (/server)
- Node.js + Express
- MongoDB + Mongoose
- Google Generative AI (Gemini 1.5 Flash)
- dotenv, CORS

---

## Project Structure

```
StudyAI/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Dashboard.jsx
│       │   ├── SubjectForm.jsx
│       │   ├── StudyLogger.jsx
│       │   ├── ScheduleView.jsx
│       │   └── PredictionCard.jsx
│       ├── App.jsx
│       └── main.jsx
│
└── server/
    ├── models/
    │   ├── Subject.js
    │   ├── StudySession.js
    │   └── User.js
    ├── routes/
    │   ├── subjects.js
    │   ├── sessions.js
    │   └── predictions.js
    ├── services/
    │   └── aiService.js
    └── index.js
```

---

## API Endpoints

### Subjects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects/:userId` | Get all subjects |
| POST | `/api/subjects` | Create subject |
| POST | `/api/subjects/:id/topic` | Add topic |
| PUT | `/api/subjects/:id/topic` | Update topic |
| DELETE | `/api/subjects/:id` | Delete subject |

### Study Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions/:userId` | Get sessions |
| POST | `/api/sessions` | Log session |
| DELETE | `/api/sessions/:id` | Delete session |

### AI Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predictions/completion` | Completion forecast |
| POST | `/api/predictions/recommend` | Daily recommendations |

---

## Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/PUSHPANJALI021/StudyAI.git
cd StudyAI
```

### 2️⃣ Setup Backend

```bash
cd server
npm install
```

Create a `.env` file in `/server`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
```

Run the server:

```bash
npm run dev
```

Server runs at: `http://localhost:5000`

### 3️⃣ Setup Frontend

```bash
cd ../client
npm install
npm run dev
```

Client runs at: `http://localhost:5173`

---

## Key Design Highlights

- 🔁 AI + fallback hybrid system (always functional)
- 📊 Real-time progress tracking per topic
- 🧠 Smart prioritization logic for studying
- ⚡ Lightweight React SPA (no router complexity)
- 🔐 Backend structured for future auth integration
