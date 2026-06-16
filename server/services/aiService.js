const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to check if API key is set
const isApiKeyConfigured = () => {
  return process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
};

// Fallback logic if AI key is missing or fails
function getAlgorithmicCompletion(subject, sessions) {
  const completedCount = subject.topics.filter(t => t.completed).length;
  const totalTopics = subject.topics.length;
  const remainingTopics = totalTopics - completedCount;
  const daysLeft = Math.ceil((new Date(subject.examDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  const totalHours = sessions.reduce((sum, s) => sum + s.hoursStudied, 0);
  const avgHoursPerDay = sessions.length > 0 ? (totalHours / Math.min(sessions.length, 7)) : 0;
  
  // Basic heuristic: assume each remaining topic takes 3 hours of study
  const estimatedHoursNeeded = remainingTopics * 3;
  const hoursLeft = daysLeft * (subject.targetHoursPerDay || 2);
  const willFinish = hoursLeft >= estimatedHoursNeeded;
  
  const daysNeeded = avgHoursPerDay > 0 ? Math.ceil(estimatedHoursNeeded / avgHoursPerDay) : remainingTopics * 2;
  const projectedCompletionDate = new Date();
  projectedCompletionDate.setDate(projectedCompletionDate.getDate() + daysNeeded);
  
  const daysBuffer = daysLeft - daysNeeded;
  let riskLevel = 'medium';
  if (daysBuffer > 5) riskLevel = 'low';
  else if (daysBuffer < 0) riskLevel = 'high';

  return {
    willFinish,
    confidence: Math.min(Math.max(Math.round((hoursLeft / (estimatedHoursNeeded || 1)) * 50), 30), 95),
    projectedCompletionDate: projectedCompletionDate.toISOString().split('T')[0],
    daysBuffer,
    riskLevel,
    reasoning: `[Algorithmic Fallback] Based on your current rate of study, you need about ${estimatedHoursNeeded} hours and have ${daysLeft} days remaining.`
  };
}

function getAlgorithmicRecommendations(subjects, sessions, availableHours) {
  // Get all uncompleted topics sorted by difficulty (highest first) and confidence (lowest first)
  const pending = subjects.flatMap(sub => 
    sub.topics
      .filter(t => !t.completed)
      .map(t => ({
        name: t.name,
        subject: sub.name,
        confidence: t.confidenceRating || 3,
        difficulty: t.difficulty || 3
      }))
  );

  // Sort: High difficulty first, low confidence first
  pending.sort((a, b) => (b.difficulty - a.difficulty) + (a.confidence - b.confidence));

  const recommendedTopics = [];
  let remainingHours = availableHours || 4;
  
  for (const topic of pending) {
    if (remainingHours <= 0) break;
    const hours = Math.min(Math.round(topic.difficulty * 0.75 * 10) / 10, remainingHours);
    if (hours < 0.5) continue;
    
    recommendedTopics.push({
      topic: topic.name,
      subject: topic.subject,
      suggestedHours: hours,
      reason: `Topic has high difficulty (${topic.difficulty}/5) and low confidence (${topic.confidence}/5). Recommended for focused review.`,
      priority: topic.difficulty >= 4 ? 'high' : (topic.difficulty >= 2 ? 'medium' : 'low')
    });
    remainingHours -= hours;
  }

  return {
    recommendedTopics,
    motivationalNote: "[Algorithmic Fallback] Keep pushing! Focus on your high-difficulty areas and you'll make steady progress."
  };
}

async function predictCompletion(subject, sessions) {
  const completedCount = subject.topics.filter(t => t.completed).length;
  const totalTopics = subject.topics.length;
  const remainingTopics = totalTopics - completedCount;
  const daysLeft = Math.ceil((new Date(subject.examDate) - new Date()) / (1000 * 60 * 60 * 24));
  const weakTopics = subject.topics.filter(t => t.confidenceRating <= 2);

  const totalHours = sessions.reduce((sum, s) => sum + s.hoursStudied, 0);
  const avgHoursPerDay = sessions.length > 0 ? (totalHours / Math.min(sessions.length, 7)).toFixed(1) : 0;

  if (!isApiKeyConfigured()) {
    console.log("Gemini API Key not set. Using algorithmic fallback for completion prediction.");
    return getAlgorithmicCompletion(subject, sessions);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are an academic advisor AI. Analyze this student's study data and predict if they'll finish before their exam.

Student data:
- Subject: ${subject.name}
- Exam date: ${subject.examDate}
- Total topics: ${totalTopics}
- Completed topics: ${completedCount}
- Remaining topics: ${remainingTopics}
- Average hours studied per day: ${avgHoursPerDay}
- Days remaining until exam: ${daysLeft}
- Topics with low confidence (rated 1-2): ${weakTopics.length}
- Weak topic names: ${weakTopics.map(t => t.name).join(', ') || 'none'}

Return ONLY a JSON object, no extra text:
{
  "willFinish": true or false,
  "confidence": number between 0 and 100,
  "projectedCompletionDate": "YYYY-MM-DD",
  "daysBuffer": number,
  "riskLevel": "low" | "medium" | "high",
  "reasoning": "one sentence explanation"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    // Sometimes response text has markdown code block wrappers
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini API error during prediction completion:", err);
    return getAlgorithmicCompletion(subject, sessions);
  }
}

async function recommendTopics(subjects, sessions, availableHours) {
  const weakTopics = subjects.flatMap(sub =>
    sub.topics
      .filter(t => !t.completed && t.confidenceRating <= 2)
      .map(t => ({ name: t.name, subjectName: sub.name }))
  );

  const recentTopics = sessions.slice(0, 5).map(s => s.topicName);

  const allPending = subjects.flatMap(sub =>
    sub.topics
      .filter(t => !t.completed)
      .map(t => ({ name: t.name, subject: sub.name, confidence: t.confidenceRating, difficulty: t.difficulty }))
  );

  if (!isApiKeyConfigured() || allPending.length === 0) {
    console.log("Gemini API Key not set or no pending topics. Using algorithmic fallback for topic recommendation.");
    return getAlgorithmicRecommendations(subjects, sessions, availableHours);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are a study coach AI for a CSE AI-ML student.

Available study time today: ${availableHours} hours
Pending topics: ${JSON.stringify(allPending)}
Weak topics (confidence <= 2): ${weakTopics.map(t => t.name).join(', ') || 'none'}
Recently studied: ${recentTopics.join(', ') || 'none'}

Recommend a study plan for today. Return ONLY a JSON object, no extra text:
{
  "recommendedTopics": [
    {
      "topic": "topic name",
      "subject": "subject name",
      "suggestedHours": number,
      "reason": "short reason why this was chosen",
      "priority": "high" | "medium" | "low"
    }
  ],
  "motivationalNote": "one encouraging sentence"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("Gemini API error during topic recommendation:", err);
    return getAlgorithmicRecommendations(subjects, sessions, availableHours);
  }
}

module.exports = { predictCompletion, recommendTopics };
