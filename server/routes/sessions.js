const express = require('express');
const router = express.Router();
const StudySession = require('../models/StudySession');
const Subject = require('../models/Subject');

// GET all study sessions for a user
router.get('/:userId', async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.params.userId }).sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new study session
router.post('/', async (req, res) => {
  try {
    const { userId, subjectId, topicName, hoursStudied, confidenceRating, notes, date, markCompleted } = req.body;
    
    // Create and save the session log
    const session = new StudySession({
      userId,
      subjectId,
      topicName,
      hoursStudied,
      confidenceRating: confidenceRating || 3,
      notes: notes || '',
      date: date || new Date()
    });
    
    await session.save();

    // Synchronize updates to the related Subject/Topic
    const subject = await Subject.findById(subjectId);
    if (subject) {
      const topic = subject.topics.find(t => t.name.toLowerCase() === topicName.toLowerCase());
      if (topic) {
        topic.hoursSpent = (topic.hoursSpent || 0) + Number(hoursStudied);
        topic.confidenceRating = confidenceRating || topic.confidenceRating;
        topic.lastStudied = new Date();
        
        if (markCompleted) {
          topic.completed = true;
        }
        
        await subject.save();
      }
    }

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a study session log (with option to rollback hours)
router.delete('/:id', async (req, res) => {
  try {
    const session = await StudySession.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Rollback changes in subject
    const subject = await Subject.findById(session.subjectId);
    if (subject) {
      const topic = subject.topics.find(t => t.name.toLowerCase() === session.topicName.toLowerCase());
      if (topic) {
        topic.hoursSpent = Math.max(0, (topic.hoursSpent || 0) - session.hoursStudied);
        await subject.save();
      }
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
