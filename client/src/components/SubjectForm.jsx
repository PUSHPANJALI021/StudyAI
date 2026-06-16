import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Calendar, BookOpen, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function SubjectForm({ userId }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [subjectName, setSubjectName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetHours, setTargetHours] = useState(2);
  const [topicInput, setTopicInput] = useState('');
  const [topicDifficulty, setTopicDifficulty] = useState(3);
  const [topicsList, setTopicsList] = useState([]); // Array of { name, difficulty }
  
  // UI states
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const API_URL = 'http://localhost:5000/api/subjects';

  useEffect(() => {
    fetchSubjects();
  }, [userId]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/${userId}`);
      setSubjects(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setLoading(false);
    }
  };

  const handleAddTopicToForm = () => {
    if (!topicInput.trim()) return;

    // Support comma-separated topics
    if (topicInput.includes(',')) {
      const parts = topicInput.split(',').map(t => t.trim()).filter(Boolean);
      const newTopics = parts.map(name => ({
        name,
        difficulty: Number(topicDifficulty),
        completed: false,
        hoursSpent: 0,
        confidenceRating: 3
      }));
      setTopicsList([...topicsList, ...newTopics]);
    } else {
      setTopicsList([...topicsList, {
        name: topicInput.trim(),
        difficulty: Number(topicDifficulty),
        completed: false,
        hoursSpent: 0,
        confidenceRating: 3
      }]);
    }
    setTopicInput('');
  };

  const handleRemoveTopicFromForm = (index) => {
    setTopicsList(topicsList.filter((_, i) => i !== index));
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!subjectName.trim()) {
      setError('Subject name is required');
      return;
    }
    if (!examDate) {
      setError('Exam date is required');
      return;
    }
    if (topicsList.length === 0) {
      setError('Please add at least one topic to the syllabus');
      return;
    }

    try {
      const payload = {
        userId,
        name: subjectName,
        examDate,
        targetHoursPerDay: Number(targetHours),
        topics: topicsList
      };

      await axios.post(API_URL, payload);
      setSuccess('Subject created successfully!');
      
      // Reset form
      setSubjectName('');
      setExamDate('');
      setTargetHours(2);
      setTopicsList([]);
      
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject and all its logs?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchSubjects();
    } catch (err) {
      console.error('Error deleting subject:', err);
    }
  };

  const toggleExpandSubject = (id) => {
    if (expandedSubject === id) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(id);
    }
  };

  const getDifficultyColor = (diff) => {
    if (diff <= 2) return 'badge-success';
    if (diff === 3) return 'badge-warning';
    return 'badge-danger';
  };

  const getProgress = (sub) => {
    if (!sub.topics || sub.topics.length === 0) return 0;
    const completed = sub.topics.filter(t => t.completed).length;
    return Math.round((completed / sub.topics.length) * 100);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Syllabus & Subjects Manager</h1>
        <p className="page-subtitle">Add subjects, enter syllabus topics, and set exam deadlines.</p>
      </div>

      <div className="dashboard-layout">
        {/* Creation Form */}
        <div className="glass-card">
          <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Add New Course</h2>
          
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

          <form onSubmit={handleCreateSubject}>
            <div className="form-group">
              <label className="form-label">Subject Name</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Machine Learning, Neural Networks"
                value={subjectName} 
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Exam Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={examDate} 
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Hours / Day</label>
                <input 
                  type="number" 
                  min="1" 
                  max="12" 
                  className="form-control" 
                  value={targetHours} 
                  onChange={(e) => setTargetHours(e.target.value)}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <label className="form-label">Add Syllabus Topics (Single or comma-separated list)</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Linear Regression, SVMs, Decision Trees"
                  value={topicInput} 
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTopicToForm(); } }}
                />
                <select 
                  className="form-control" 
                  style={{ width: '120px' }}
                  value={topicDifficulty}
                  onChange={(e) => setTopicDifficulty(e.target.value)}
                >
                  <option value="1">Easy (1)</option>
                  <option value="2">Mild (2)</option>
                  <option value="3">Normal (3)</option>
                  <option value="4">Hard (4)</option>
                  <option value="5">Extreme (5)</option>
                </select>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '0 1.25rem' }}
                  onClick={handleAddTopicToForm}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Temp list preview */}
              {topicsList.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  <span className="form-label" style={{ fontSize: '0.75rem' }}>Syllabus Draft ({topicsList.length} topics)</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {topicsList.map((topic, i) => (
                      <span key={i} className={`badge ${getDifficultyColor(topic.difficulty)}`} style={{ padding: '0.4rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textTransform: 'none' }}>
                        {topic.name} ({topic.difficulty})
                        <Trash2 size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => handleRemoveTopicFromForm(i)} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Create Subject & Save Syllabus
            </button>
          </form>
        </div>

        {/* Existing Subjects List */}
        <div className="section-stack">
          <div className="glass-card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Your Subjects</h2>
            
            {loading ? (
              <div className="spinner-container">
                <div className="spinner"></div>
                <span style={{ color: 'var(--text-secondary)' }}>Loading syllabus data...</span>
              </div>
            ) : subjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.4 }} />
                <p>No subjects added yet. Create one on the left!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {subjects.map((sub) => {
                  const progress = getProgress(sub);
                  const daysLeft = Math.ceil((new Date(sub.examDate) - new Date()) / (1000 * 60 * 60 * 24));
                  const isExpanded = expandedSubject === sub._id;
                  
                  return (
                    <div key={sub._id} className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => toggleExpandSubject(sub._id)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 className="card-title" style={{ fontSize: '1.1rem' }}>{sub.name}</h3>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={12} />
                              Exam: {new Date(sub.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ({daysLeft > 0 ? `${daysLeft}d left` : 'Passed'})
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={12} />
                              Target: {sub.targetHoursPerDay}h/day
                            </span>
                          </div>
                        </div>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', borderRadius: '8px', border: 'none' }}
                          onClick={() => handleDeleteSubject(sub._id)}
                        >
                          <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                        </button>
                      </div>

                      <div className="progress-container" style={{ margin: '0.75rem 0 0.25rem' }}>
                        <div className="progress-header" style={{ fontSize: '0.75rem' }}>
                          <span>Syllabus Completion</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="progress-bar-bg" style={{ height: '6px' }}>
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '1rem', paddingTop: '1rem' }}>
                          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Syllabus Topics ({sub.topics.length})</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                            {sub.topics.map((t, idx) => (
                              <div key={t._id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ fontSize: '0.85rem', color: t.completed ? 'var(--text-muted)' : '#fff', textDecoration: t.completed ? 'line-through' : 'none' }}>
                                  {t.name}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <span className={`badge ${getDifficultyColor(t.difficulty)}`} style={{ fontSize: '0.65rem' }}>
                                    Diff: {t.difficulty}
                                  </span>
                                  <span className={`badge ${t.completed ? 'badge-success' : 'badge-secondary'}`} style={{ fontSize: '0.65rem' }}>
                                    {t.completed ? 'Completed' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
