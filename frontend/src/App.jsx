import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import CandidateSelector from './components/CandidateSelector';
import InterviewChat from './components/InterviewChat';
import FeedbackPanel from './components/FeedbackPanel';

export default function App() {
  const [stage, setStage] = useState('SELECT_CANDIDATE'); // SELECT_CANDIDATE | INTERVIEW_ACTIVE | FEEDBACK_VIEW
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setFeedback(null);
    setStage('INTERVIEW_ACTIVE');
  };

  const handleInterviewFinished = (feedbackData) => {
    setFeedback(feedbackData);
    setStage('FEEDBACK_VIEW');
  };

  const handleRestart = () => {
    setFeedback(null);
    setStage('INTERVIEW_ACTIVE');
  };

  const handleSwitchCandidate = () => {
    setSelectedCandidate(null);
    setFeedback(null);
    setStage('SELECT_CANDIDATE');
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="app-header">
        <div className="brand-logo" onClick={handleSwitchCandidate} style={{ cursor: 'pointer' }}>
          <div className="brand-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={22} color="#38bdf8" />
          </div>
          <div>
            <div className="brand-title">AI Interviewer</div>
            <div className="brand-subtitle">Adaptive Multi-Turn Technical Evaluation Agent</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="header-badge">
            <span className="pulse-dot" /> FastAPI + LangChain Agent Engine
          </div>
        </div>
      </header>

      {/* Dynamic Main Stage */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {stage === 'SELECT_CANDIDATE' && (
          <CandidateSelector onSelectCandidate={handleSelectCandidate} />
        )}

        {stage === 'INTERVIEW_ACTIVE' && selectedCandidate && (
          <InterviewChat
            candidate={selectedCandidate}
            onBackToCandidates={handleSwitchCandidate}
            onInterviewFinished={handleInterviewFinished}
          />
        )}

        {stage === 'FEEDBACK_VIEW' && (
          <FeedbackPanel
            feedback={feedback}
            candidate={selectedCandidate}
            onRestart={handleRestart}
            onSwitchCandidate={handleSwitchCandidate}
          />
        )}
      </main>
    </div>
  );
}
