import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, CheckCircle, Brain, RefreshCw, Calendar, TrendingUp } from 'lucide-react';

export default function PredictionCard({ userId, initialSubjectId, subjects = [] }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || '');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:5000/api/predictions/completion';

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    } else if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0]._id);
    }
  }, [initialSubjectId, subjects]);

  const handlePredict = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(API_URL, {
        userId,
        subjectId: selectedSubjectId
      });
      setPrediction(res.data);
    } catch (err) {
      console.error('Prediction request error:', err);
      setError('AI service failed to respond. Check if your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Automatically trigger prediction on load or subject change if we have subjects
  useEffect(() => {
    if (selectedSubjectId) {
      handlePredict();
    } else {
      setPrediction(null);
    }
  }, [selectedSubjectId]);

  const getRiskClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      case 'low': return 'risk-low';
      default: return 'risk-low';
    }
  };

  const getRiskBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'badge-danger';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-success';
    }
  };

  const currentSubject = subjects.find(s => s._id === selectedSubjectId);

  return (
    <div className="glass-card prediction-glow-box" style={{ height: '100%' }}>
      <div className="card-header-main" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={22} color="var(--primary)" />
          <h2 className="card-title">AI Completion Predictor</h2>
        </div>
      </div>

      <div style={{ margin: '1.25rem 0' }}>
        <label className="form-label">Select Subject to Analyze</label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            className="form-control"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            disabled={loading}
          >
            {subjects.length === 0 ? (
              <option value="">No subjects found</option>
            ) : (
              subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))
            )}
          </select>
          <button 
            className="btn btn-secondary"
            onClick={handlePredict}
            disabled={loading || !selectedSubjectId}
            style={{ padding: '0 1rem' }}
          >
            {loading ? <RefreshCw size={16} className="spinner" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="spinner-container" style={{ padding: '4rem 1rem' }}>
          <div className="spinner"></div>
          <span style={{ color: 'var(--text-secondary)' }}>Analyzing syllabus progress patterns...</span>
        </div>
      ) : prediction ? (
        <div className="prediction-section">
          {/* Main Status Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ color: prediction.willFinish ? 'var(--success)' : 'var(--danger)' }}>
              {prediction.willFinish ? <CheckCircle size={38} /> : <ShieldAlert size={38} />}
            </div>
            <div>
              <div className="risk-level-display" style={{ color: prediction.willFinish ? 'var(--success)' : 'var(--danger)' }}>
                {prediction.willFinish ? 'On Track to Finish' : 'Risk of Delay'}
              </div>
              <span className={`badge ${getRiskBadge(prediction.riskLevel)}`} style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                {prediction.riskLevel} Risk Level
              </span>
            </div>
          </div>

          {/* Key predictions info grid */}
          <div className="grid-cols-2" style={{ gap: '1rem' }}>
            <div className="stat-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)' }}>
              <span className="stat-label">Projected Finish</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Calendar size={16} color="var(--primary)" />
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#fff' }}>
                  {prediction.projectedCompletionDate ? new Date(prediction.projectedCompletionDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="stat-card" style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)' }}>
              <span className="stat-label">Exam Buffer</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <TrendingUp size={16} color="var(--secondary)" />
                <span style={{ fontSize: '1.05rem', fontWeight: '700', color: prediction.daysBuffer >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {prediction.daysBuffer} {prediction.daysBuffer === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Confidence Meter */}
          <div>
            <div className="progress-header" style={{ fontSize: '0.75rem' }}>
              <span>Gemini Model Confidence</span>
              <span style={{ fontWeight: '600' }}>{prediction.confidence}%</span>
            </div>
            <div className="progress-bar-bg" style={{ height: '6px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${prediction.confidence}%`, 
                  background: `linear-gradient(90deg, var(--primary), ${prediction.confidence > 75 ? 'var(--success)' : 'var(--secondary)'})` 
                }}
              ></div>
            </div>
          </div>

          {/* Detailed Reasoning */}
          {prediction.reasoning && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(124, 106, 247, 0.05)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(124, 106, 247, 0.1)' }}>
              <strong>AI Analysis:</strong> {prediction.reasoning}
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <Brain size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>Please select a subject above to trigger the machine learning readiness engine.</p>
        </div>
      )}
    </div>
  );
}
