const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  difficulty: { type: Number, default: 3 }, // 1 (easy) to 5 (very hard)
  hoursSpent: { type: Number, default: 0 },
  confidenceRating: { type: Number, default: 3 }, // 1 (low) to 5 (high)
  lastStudied: { type: Date }
});

const SubjectSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true }, // e.g. "Machine Learning"
  topics: [TopicSchema],
  examDate: { type: Date, required: true },
  targetHoursPerDay: { type: Number, default: 2 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', SubjectSchema);
