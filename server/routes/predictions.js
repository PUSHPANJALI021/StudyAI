const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const StudySession = require('../models/StudySession');
const { predictCompletion, recommendTopics } = require('../services/aiService');

// POST predict completion date for a specific subject
router.post('/completion', async (req, res) => {
  try {
    const { subjectId, userId } = req.body;
    if (!subjectId || !userId) {
      return res.status(400).json({ error: 'subjectId and userId are required' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    // Fetch last 14 sessions for recent patterns
    const sessions = await StudySession.find({ userId, subjectId })
      .sort({ date: -1 })
      .limit(14);

    const result = await predictCompletion(subject, sessions);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST recommend study topics for today across all subjects
router.post('/recommend', async (req, res) => {
  try {
    const { userId, availableHours } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const hours = availableHours ? Number(availableHours) : 4;
    const subjects = await Subject.find({ userId });
    
    // Fetch last 20 sessions to analyze recent history
    const sessions = await StudySession.find({ userId })
      .sort({ date: -1 })
      .limit(20);

    const result = await recommendTopics(subjects, sessions, hours);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
