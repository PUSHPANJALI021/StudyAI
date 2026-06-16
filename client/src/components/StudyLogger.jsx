import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Book, AlertCircle, Calendar, Star, Trash2 } from 'lucide-react';

export default function StudyLogger({ userId }) {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicName, setSelectedTopicName] = useState('');
  const [hoursStudied, setHoursStudied] = useState('');
  const [confidenceRating, setConfidenceRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [markCompleted, setMarkCompleted] = useState(false);
  
  // UI feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_SUBJECTS = 'http://localhost:5000/api/subjects';
  const API_SESSIONS = 'http://localhost:5000/api/sessions';

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, sesRes] = await Promise.all([
        axios.get(`${API_SUBJECTS}/${userId}`),
        axios.get(`${API_SESSIONS}/${userId}`)
      ]);
      setSubjects(subRes.data);
      setSessions(sesRes.data);
      
      // Auto-select first subject if available
      if (subRes.data.length > 0) {
        setSelectedSubjectId(subRes.data[0]._id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching logger data:', err);
      setLoading(false);
    }
  };

  // Get topics for selected subject
  const currentSubject = subjects.find(s => s._id === selectedSubjectId);
  const topics = currentSubject ? currentSubject.topics : [];

  // When selected subject changes, auto-select its first pending topic
  useEffect(() => {
    if (topics.length > 0) {
      const firstPending = topics.find(t => !t.completed) || topics[0];
      setSelectedTopicName(firstPending ? firstPending.name : '');
    } else {
      setSelectedTopicName('');
    }
    setMarkCompleted(false);
  }, [selectedSubjectId, subjects]);

  const handleLogSession = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedSubjectId) {
      setError('Please select a subject');
      return;
    }
    if (!selectedTopicName) {
      setError('Please select a topic');
      return;
    }
    if (!hoursStudied || Number(hoursStudied) <= 0) {
      setError('Please enter a valid study duration');
      return;
    }

    try {
      const payload = {
        userId,
        subjectId: selectedSubjectId,
        topicName: selectedTopicName,
        hoursStudied: Number(hoursStudied),
        confidenceRating: Number(confidenceRating),
        notes: notes.trim(),
        markCompleted
      };

      await axios.post(API_SESSIONS, payload);
      setSuccess('Study session logged successfully!');
      setHoursStudied('');
      setNotes('');
      setMarkCompleted(false);
      
      // Refresh subjects and sessions list to update hoursSpent & stats
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log study session');
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Delete this session log? This will deduct the study hours from your subject progress.')) return;
    try {
      await axios.delete(`${API_SESSIONS}/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const getSubjectName = (subId) => {
    const sub = subjects.find(s => s._id === subId);
    return sub ? sub.name : 'Unknown Subject';
  };

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={interactive ? 22 : 14} 
          fill={i <= rating ? '#f59e0b' : 'none'} 
          color={i <= rating ? '#f59e0b' : 'var(--text-muted)'}
          style={{ cursor: interactive ? 'pointer' : 'default', transition: 'var(--transition-smooth)' }}
          onClick={interactive ? () => setConfidenceRating(i) : undefined}
        />
      );
    }
    return <div style={{ display: 'flex', gap: '0.2rem' }}>{stars}</div>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Daily Study Logger</h1>
        <p className="page-subtitle">Track your study hours, rate your confidence, and update topic completion status.</p>
      </div>

      <div className="dashboard-layout">
        {/* Study Logging Form */}
        <div className="glass-card">
          <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Log Study Session</h2>

          {error && (
            <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              {success}
            </div>
          )}

          {subjects.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Book size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>Please add a subject in the "Subjects" tab before logging study sessions.</p>
            </div>
          ) : (
            <form onSubmit={handleLogSession}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select 
                  className="form-control"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Topic studied</label>
                <select
                  className="form-control"
                  value={selectedTopicName}
                  onChange={(e) => setSelectedTopicName(e.target.value)}
                >
                  {topics.length === 0 ? (
                    <option value="">No topics found - add some in Subjects</option>
                  ) : (
                    topics.map((t, idx) => (
                      <option key={t._id || idx} value={t.name}>
                        {t.name} {t.completed ? '(Completed ✓)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Hours Studied</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="24"
                    className="form-control"
                    placeholder="e.g. 1.5, 2"
                    value={hoursStudied}
                    onChange={(e) => setHoursStudied(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confidence after Study</label>
                  <div style={{ height: '42px', display: 'flex', alignItems: 'center', background: 'rgba(13, 12, 34, 0.6)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0 1.25rem' }}>
                    {renderStars(confidenceRating, true)}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Study Notes (optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Key concepts studied, questions to ask, or areas requiring review..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' }}>
                <input
                  type="checkbox"
                  id="markCompleted"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  checked={markCompleted}
                  onChange={(e) => setMarkCompleted(e.target.checked)}
                />
                <label htmlFor="markCompleted" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                  Mark this topic as <strong>Completed</strong>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Clock size={16} />
                Log Session
              </button>
            </form>
          )}
        </div>

        {/* Recent logs */}
        <div className="section-stack">
          <div className="glass-card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Recent Activity Logs</h2>

            {loading ? (
              <div className="spinner-container">
                <div className="spinner"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Loading logs...</span>
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <p>No study logs recorded. Log your first session above!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {sessions.map((ses) => (
                  <div key={ses._id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                          {getSubjectName(ses.subjectId)}
                        </span>
                        <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{ses.topicName}</h3>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.4rem 0' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Clock size={12} />
                            {ses.hoursStudied} hours
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={12} />
                            {new Date(ses.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem', borderRadius: '8px', border: 'none' }}
                        onClick={() => handleDeleteSession(ses._id)}
                      >
                        <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence:</span>
                      {renderStars(ses.confidenceRating)}
                    </div>

                    {ses.notes && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', marginTop: '0.5rem', borderLeft: '2px solid var(--secondary)' }}>
                        {ses.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
