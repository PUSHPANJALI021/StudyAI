const mongoose = require('mongoose');

const StudySessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  subjectId: { type: String, required: true },
  topicName: { type: String, required: true },
  hoursStudied: { type: Number, required: true },
  confidenceRating: { type: Number, default: 3 }, // 1 to 5 confidence rating after studying
  notes: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudySession', StudySessionSchema);
