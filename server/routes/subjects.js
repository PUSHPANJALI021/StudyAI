const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// GET all subjects for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new subject with list of topics
router.post('/', async (req, res) => {
  try {
    const { userId, name, examDate, targetHoursPerDay, topics } = req.body;
    
    // Parse topics if they are sent as strings
    let parsedTopics = [];
    if (Array.isArray(topics)) {
      parsedTopics = topics.map(t => {
        if (typeof t === 'string') {
          return { name: t, completed: false, difficulty: 3, hoursSpent: 0, confidenceRating: 3 };
        }
        return {
          name: t.name,
          completed: !!t.completed,
          difficulty: t.difficulty || 3,
          hoursSpent: t.hoursSpent || 0,
          confidenceRating: t.confidenceRating || 3
        };
      });
    }

    const subject = new Subject({
      userId,
      name,
      examDate,
      targetHoursPerDay: targetHoursPerDay || 2,
      topics: parsedTopics
    });

    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT (update) a specific topic's details
router.put('/:id/topic', async (req, res) => {
  try {
    const { topicId, topicIndex, updates } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    let topic;
    if (topicId) {
      topic = subject.topics.id(topicId);
    } else if (typeof topicIndex !== 'undefined' && subject.topics[topicIndex]) {
      topic = subject.topics[topicIndex];
    }

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    Object.assign(topic, updates);
    
    // Set lastStudied if confidence or completion is updated
    if (updates.completed || typeof updates.confidenceRating !== 'undefined') {
      topic.lastStudied = new Date();
    }

    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a new topic to a subject
router.post('/:id/topic', async (req, res) => {
  try {
    const { name, difficulty } = req.body;
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    subject.topics.push({
      name,
      difficulty: difficulty || 3,
      completed: false,
      hoursSpent: 0,
      confidenceRating: 3
    });

    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a subject
router.delete('/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
