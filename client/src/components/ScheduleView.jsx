import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Brain, Clock, Sparkles, RefreshCw, Star, AlertTriangle } from 'lucide-react';

export default function ScheduleView({ userId }) {
  const [subjects, setSubjects] = useState([]);
  const [algoSchedule, setAlgoSchedule] = useState([]);
  const [aiPlan, setAiPlan] = useState(null);
  
  // Inputs
  const [availableHours, setAvailableHours] = useState(4);
  
  // Loading states
  const [loadingAlgo, setLoadingAlgo] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const API_SUBJECTS = 'http://localhost:5000/api/subjects';
  const API_RECOMMEND = 'http://localhost:5000/api/predictions/recommend';

  useEffect(() => {
    fetchSubjectsAndGenerate();
  }, [userId]);

  const fetchSubjectsAndGenerate = async () => {
    try {
      setLoadingAlgo(true);
      const res = await axios.get(`${API_SUBJECTS}/${userId}`);
      setSubjects(res.data);
      generateLocalSchedule(res.data);
      setLoadingAlgo(false);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setLoadingAlgo(false);
    }
  };

  // Algorithmic schedule generator running on client-side
  const generateLocalSchedule = (subjectsList) => {
    // Collect all uncompleted topics across all subjects
    const uncompletedTopics = subjectsList.flatMap(sub => 
      sub.topics
        .filter(t => !t.completed)
        .map(t => ({
          ...t,
          subjectId: sub._id,
          subjectName: sub.name,
          examDate: sub.examDate
        }))
    );

    // Sort: High difficulty first, low confidence first.
    // Score = difficulty + (6 - confidenceRating)
    // Range will be from 2 (difficulty 1, confidence 5) to 10 (difficulty 5, confidence 1)
    const sorted = [...uncompletedTopics].sort((a, b) => {
      const score = t => (t.difficulty || 3) + (6 - (t.confidenceRating || 3));
      return score(b) - score(a);
    });

    setAlgoSchedule(sorted);
  };

  const fetchAiRecommendation = async () => {
    setLoadingAi(true);
    setAiError('');
    try {
      const res = await axios.post(API_RECOMMEND, {
        userId,
        availableHours: Number(availableHours)
      });
      setAiPlan(res.data);
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
      setAiError('Failed to fetch AI suggestions. Using local scheduler instead.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Fetch AI plan automatically on mount once subjects are loaded
  useEffect(() => {
    if (subjects.length > 0 && !aiPlan && !loadingAlgo) {
      fetchAiRecommendation();
    }
  }, [subjects, loadingAlgo]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-primary';
    }
  };

  const getDaysLeft = (examDate) => {
    const diff = new Date(examDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Personalized Study Scheduler</h1>
        <p className="page-subtitle">Utilize the client-side scheduler or query the Gemini AI Study Coach for a smart daily plan.</p>
      </div>

      <div className="dashboard-layout">
        {/* Left Column: AI Study Coach */}
        <div className="section-stack">
          <div className="glass-card prediction-glow-box">
            <div className="card-header-main" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Brain size={22} color="var(--primary)" />
                <h2 className="card-title">AI Study Coach Recommendations</h2>
              </div>
              <Sparkles size={18} color="var(--secondary)" className="animate-pulse" />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', margin: '1.5rem 0 1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ marginBottom: '0.25rem' }}>Available Hours Today</label>
                <input 
                  type="number" 
                  min="1" 
                  max="16" 
                  className="form-control" 
                  value={availableHours} 
                  onChange={(e) => setAvailableHours(e.target.value)}
                />
              </div>
              <button 
                className="btn btn-primary" 
                style={{ alignSelf: 'flex-end', height: '42px', padding: '0 1.25rem' }}
                onClick={fetchAiRecommendation}
                disabled={loadingAi || subjects.length === 0}
              >
                {loadingAi ? <RefreshCw size={16} className="spinner" /> : <RefreshCw size={16} />}
                <span>Refresh AI Plan</span>
              </button>
            </div>

            {aiError && (
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} />
                <span>{aiError}</span>
              </div>
            )}

            {loadingAi ? (
              <div className="spinner-container">
                <div className="spinner"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Consulting Gemini Brain...</span>
              </div>
            ) : aiPlan ? (
              <div>
                {aiPlan.motivationalNote && (
                  <div className="motivational-quote" style={{ marginBottom: '1.5rem' }}>
                    "{aiPlan.motivationalNote}"
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {aiPlan.recommendedTopics?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                      No topics recommended. Ensure you have added courses and topics first!
                    </div>
                  ) : (
                    aiPlan.recommendedTopics?.map((rec, i) => (
                      <div key={i} className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>{rec.subject}</span>
                          <span className={`badge ${getPriorityColor(rec.priority)}`} style={{ fontSize: '0.65rem' }}>
                            {rec.priority} Priority
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', margin: '0.5rem 0 0.25rem' }}>{rec.topic}</h3>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.5rem' }}>
                          <Clock size={12} />
                          <span>Suggesting {rec.suggestedHours} hours</span>
                        </div>

                        {rec.reason && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{rec.reason}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Brain size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>Click the refresh button to generate your daily AI plan.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Priority Queue (Algorithmic) */}
        <div className="glass-card">
          <div className="card-header-main" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={22} color="var(--secondary)" />
              <h2 className="card-title">Study Priority Queue</h2>
            </div>
            <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
              {algoSchedule.length} pending
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '1rem 0 1.5rem' }}>
            Systematic order prioritizing high difficulty syllabus items and low-confidence topics.
          </p>

          {loadingAlgo ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span>Loading subject data...</span>
            </div>
          ) : algoSchedule.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
              <Calendar size={48} style={{ opacity: 0.4, marginBottom: '1rem' }} />
              <p>Hooray! No pending topics. All topics are completed or you haven't added subjects yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {algoSchedule.map((topic, i) => {
                const days = getDaysLeft(topic.examDate);
                const score = (topic.difficulty || 3) + (6 - (topic.confidenceRating || 3));
                
                return (
                  <div key={topic._id || i} className="subject-item-row" style={{ padding: '1rem', flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <span className="badge badge-secondary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', marginBottom: '0.25rem' }}>
                          {topic.subjectName}
                        </span>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>{topic.name}</h4>
                      </div>
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                        Rank Score: {score}/10
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                      <span style={{ color: days <= 7 ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: days <= 7 ? '600' : 'normal' }}>
                        Exam in {days > 0 ? `${days} days` : 'passed'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <span>Diff: {topic.difficulty}/5</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                          Conf: {topic.confidenceRating}/5
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
