import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Clock, Calendar, GraduationCap } from 'lucide-react';
import Dashboard from './components/Dashboard';
import SubjectForm from './components/SubjectForm';
import StudyLogger from './components/StudyLogger';
import ScheduleView from './components/ScheduleView';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const userId = 'student_cse_aiml';

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': 
        return <Dashboard userId={userId} setActivePage={setActivePage} />;
      case 'subjects': 
        return <SubjectForm userId={userId} />;
      case 'logger': 
        return <StudyLogger userId={userId} />;
      case 'schedule': 
        return <ScheduleView userId={userId} />;
      default: 
        return <Dashboard userId={userId} setActivePage={setActivePage} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects & Syllabus', icon: BookOpen },
    { id: 'logger', label: 'Log Study Session', icon: Clock },
    { id: 'schedule', label: 'Study Schedule', icon: Calendar }
  ];

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">
            <GraduationCap size={22} />
          </div>
          <span className="logo-text">StudyAI</span>
        </div>

        <div className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <span className="user-name">CSE Student</span>
            <span className="user-role">AI-ML Branch</span>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
