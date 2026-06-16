import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { BookOpen, Clock, Calendar, CheckCircle2, ChevronRight, Brain } from 'lucide-react';
import PredictionCard from './PredictionCard';

export default function Dashboard({ userId, setActivePage }) {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const API_SUBJECTS = 'http://localhost:5000/api/subjects';
  const API_SESSIONS = 'http://localhost:5000/api/sessions';

  useEffect(() => {
    Promise.all([
      axios.get(`${API_SUBJECTS}/${userId}`),
      axios.get(`${API_SESSIONS}/${userId}`)
    ]).then(([subRes, sesRes]) => {
      setSubjects(subRes.data);
      setSessions(sesRes.data);
      if (subRes.data.length > 0) {
        setSelectedSubjectId(subRes.data[0]._id);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Error loading dashboard data:', err);
      setLoading(false);
    });
  }, [userId]);

  // Calculations
  const totalSubjects = subjects.length;
  const totalTopics = subjects.reduce((sum, sub) => sum + (sub.topics?.length || 0), 0);
  const completedTopics = subjects.reduce((sum, sub) => sum + (sub.topics?.filter(t => t.completed).length || 0), 0);
  const completionPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  
  const totalHours = sessions.reduce((sum, s) => sum + s.hoursStudied, 0);
  
  const todayDateString = new Date().toDateString();
  const todayHours = sessions
    .filter(s => new Date(s.date).toDateString() === todayDateString)
    .reduce((sum, s) => sum + s.hoursStudied, 0);

  // Get days to nearest exam
  const getNearestExamDays = () => {
    if (subjects.length === 0) return 'N/A';
    const futureExams = subjects
      .map(s => new Date(s.examDate) - new Date())
      .filter(diff => diff > 0);
    if (futureExams.length === 0) return 'Passed';
    const minDiff = Math.min(...futureExams);
    return `${Math.ceil(minDiff / (1000 * 60 * 60 * 24))} days`;
  };

  // Chart Data 1: Hours per subject
  const getSubjectChartData = () => {
    return subjects.map(sub => {
      const hours = sub.topics?.reduce((sum, t) => sum + (t.hoursSpent || 0), 0) || 0;
      return {
        name: sub.name.length > 12 ? sub.name.substring(0, 10) + '..' : sub.name,
        hours: Math.round(hours * 10) / 10
      };
    });
  };

  // Chart Data 2: Last 7 days study hours timeline
  const getTimelineChartData = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toDateString());
    }

    return dates.map(dateStr => {
      const hours = sessions
        .filter(s => new Date(s.date).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.hoursStudied, 0);
      
      const parsedDate = new Date(dateStr);
      return {
        date: parsedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
        hours: Math.round(hours * 10) / 10
      };
    });
  };

  const getSubProgress = (sub) => {
    if (!sub.topics || sub.topics.length === 0) return 0;
    const completed = sub.topics.filter(t => t.completed).length;
    return Math.round((completed / sub.topics.length) * 100);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#0d0c22', border: '1px solid var(--primary)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem' }}>
          <p style={{ color: '#fff', fontWeight: 'bold' }}>{payload[0].name || 'Study Time'}</p>
          <p style={{ color: 'var(--primary)' }}>{payload[0].value} hours</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Welcome back, CSE Student</h1>
          <p className="page-subtitle">Your AI-ML smart study plan is ready. Track syllabus readiness below.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setActivePage('logger')}
          style={{ gap: '0.5rem' }}
        >
          <Clock size={16} />
          <span>Log Hours</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon-wrapper">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-value">{completionPercentage}%</div>
          <div className="stat-label">Syllabus Complete</div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon-wrapper">
            <Clock size={22} />
          </div>
          <div className="stat-value">{totalHours}h</div>
          <div className="stat-label">Total Time Studied</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-icon-wrapper">
            <BookOpen size={22} />
          </div>
          <div className="stat-value">{todayHours}h</div>
          <div className="stat-label">Studied Today</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon-wrapper">
            <Calendar size={22} />
          </div>
          <div className="stat-value">{getNearestExamDays()}</div>
          <div className="stat-label">Next Exam Countdown</div>
        </div>
      </div>

      {loading ? (
        <div className="spinner-container" style={{ padding: '8rem 0' }}>
          <div className="spinner"></div>
          <span style={{ color: 'var(--text-secondary)' }}>Loading dashboard statistics...</span>
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <BookOpen size={64} style={{ opacity: 0.2 }} color="var(--primary)" />
          <h2 className="card-title">Setup Your Syllabus First</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px' }}>
            To generate daily plans and forecast completion dates, add your academic courses and syllabus topics.
          </p>
          <button className="btn btn-primary" onClick={() => setActivePage('subjects')}>
            Add First Subject
          </button>
        </div>
      ) : (
        <>
          {/* Main Visual Grid */}
          <div className="dashboard-layout">
            {/* Left side: Charts */}
            <div className="section-stack">
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 className="card-title" style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>Study Time per Subject (Hours)</h3>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={getSubjectChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="hours" radius={[8, 8, 0, 0]} fill="url(#colorStudy)" >
                        <defs>
                          <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 className="card-title" style={{ marginBottom: '1.5rem', fontSize: '1.05rem' }}>Daily Study Activity (7-Day Trend)</h3>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <LineChart data={getTimelineChartData()} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="var(--secondary)" 
                        strokeWidth={3}
                        dot={{ r: 4, stroke: 'var(--bg-primary)', strokeWidth: 2, fill: 'var(--secondary)' }}
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right side: AI Predictor */}
            <div>
              <PredictionCard 
                userId={userId} 
                initialSubjectId={selectedSubjectId} 
                subjects={subjects} 
              />
            </div>
          </div>

          {/* Bottom Subject List */}
          <div className="glass-card" style={{ marginTop: '2rem' }}>
            <div className="card-header-main" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '1.25rem' }}>
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Course Breakdown</h3>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActivePage('subjects')}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', borderRadius: '10px' }}
              >
                Manage Courses
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {subjects.map((sub) => {
                const progress = getSubProgress(sub);
                const isSelected = selectedSubjectId === sub._id;
                
                return (
                  <div 
                    key={sub._id} 
                    className="subject-item-row"
                    style={{ 
                      cursor: 'pointer', 
                      borderColor: isSelected ? 'rgba(124, 106, 247, 0.4)' : 'var(--border-color)',
                      background: isSelected ? 'rgba(124, 106, 247, 0.03)' : 'rgba(255,255,255,0.02)'
                    }}
                    onClick={() => setSelectedSubjectId(sub._id)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>{sub.name}</span>
                        {isSelected && (
                          <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Brain size={8} /> Active Analysis
                          </span>
                        )}
                      </div>
                      <div className="progress-container" style={{ margin: '0.5rem 0 0', maxWidth: '400px' }}>
                        <div className="progress-bar-bg" style={{ height: '6px' }}>
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>{progress}%</span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {sub.topics?.filter(t => t.completed).length} / {sub.topics?.length} topics done
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
