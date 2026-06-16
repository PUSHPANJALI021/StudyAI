StudyAI — Smart Study Planner

An AI-powered study planner for students. Track subjects and syllabus topics, log study sessions, and get AI-driven forecasts of whether you'll finish your syllabus before exam day plus personalized daily topic recommendations.

Live demo: 

Screenshots





Features


Subject & syllabus management — create subjects with an exam date, daily study-hour target, and a list of topics, each with a difficulty rating (1–5).
Study session logging — log hours studied per topic with a post-study confidence rating (1–5) and notes; hours and confidence automatically roll up into the parent topic.
AI completion forecast — sends recent study history to Google's Gemini model to predict whether you'll finish the syllabus in time, with a confidence score, projected completion date, risk level, and reasoning.
AI daily recommendations — given your available hours today, Gemini (or a built-in heuristic) suggests which topics to focus on, prioritizing high-difficulty, low-confidence topics.
Algorithmic fallback — if no GEMINI_API_KEY is configured (or the API call fails), both AI features fall back to a deterministic algorithm so the app keeps working.
Dashboard — overview of total subjects, topics, completion percentage, hours studied, and charts (via Recharts).
Schedule view — client-side generated schedule plus an AI-generated plan for the day.


Tech Stack

Client (/client)


React 19 + Vite
React Router-free single-page navigation (state-based)
Recharts for charts
Lucide React for icons
Axios for HTTP requests


Server (/server)


Node.js + Express
MongoDB + Mongoose
@google/generative-ai (Gemini 1.5 Flash) for AI predictions/recommendations
CORS, dotenv


Project Structure

StudyAI/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Dashboard.jsx       # Overview stats + charts
│       │   ├── SubjectForm.jsx     # Create/manage subjects & topics
│       │   ├── StudyLogger.jsx     # Log study sessions
│       │   ├── ScheduleView.jsx    # Daily schedule (algorithmic + AI)
│       │   └── PredictionCard.jsx  # AI completion forecast widget
│       ├── App.jsx
│       └── main.jsx
└── server/
    ├── models/
    │   ├── Subject.js       # Subject + embedded Topic schema
    │   ├── StudySession.js  # Logged study sessions
    │   └── User.js          # User schema (not yet wired to auth routes)
    ├── routes/
    │   ├── subjects.js
    │   ├── sessions.js
    │   └── predictions.js
    ├── services/
    │   └── aiService.js     # Gemini calls + algorithmic fallbacks
    └── index.js              # Express app entry point

API Endpoints

MethodEndpointDescriptionGET/api/subjects/:userIdGet all subjects for a userPOST/api/subjectsCreate a subject with topicsPOST/api/subjects/:id/topicAdd a topic to a subjectPUT/api/subjects/:id/topicUpdate a topic (completion, hours, confidence)DELETE/api/subjects/:idDelete a subjectGET/api/sessions/:userIdGet all study sessions for a userPOST/api/sessionsLog a new study session (syncs hours/confidence to the topic)DELETE/api/sessions/:idDelete a session (rolls back hours on the topic)POST/api/predictions/completionAI/algorithmic forecast for a subject's completionPOST/api/predictions/recommendAI/algorithmic topic recommendations for today

Getting Started

Prerequisites


Node.js 18+
A MongoDB connection string (e.g. from MongoDB Atlas)
(Optional, for AI features) A Gemini API key


1. Clone the repo

bashgit clone https://github.com/PUSHPANJALI021/StudyAI.git
cd StudyAI

2. Set up the server

bashcd server
npm install

Create a server/.env file (do not commit this file):

PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key

If GEMINI_API_KEY is omitted, predictions and recommendations still work via the algorithmic fallback in aiService.js.

Run the server:

bashnpm run dev    # nodemon, auto-restart
# or
npm start

The API runs on http://localhost:5000 by default.

3. Set up the client

bashcd ../client
npm install
npm run dev

The client runs on Vite's default dev port (typically http://localhost:5173).
