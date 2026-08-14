import React, { useState, useEffect } from 'react';
import { BarChart3, Vote, Plus, Sparkles, PieChart, Share2, Copy, Bot, ArrowRight, Layers } from 'lucide-react';
import CandidateSelector from './components/CandidateSelector';
import InterviewChat from './components/InterviewChat';
import FeedbackPanel from './components/FeedbackPanel';

import PollCreator from './components/PollCreator';
import PollVoteCard from './components/PollVoteCard';
import PollResults from './components/PollResults';
import PollAnalytics from './components/PollAnalytics';
import PollDashboard from './components/PollDashboard';
import './styles/pollStyles.css';

const API_BASE = 'http://localhost:8000/api/polls';

const INITIAL_POLLS = [
  {
    id: 'poll-1',
    question: 'Which Frontend Tech Stack do you prefer for high-performance prototypes?',
    category: 'Engineering',
    status: 'active',
    creator: 'Vibe Team',
    options: [
      { id: 'opt-1', text: 'React + Vite + Vanilla CSS', votes: 42 },
      { id: 'opt-2', text: 'Next.js + Tailwind CSS', votes: 28 },
      { id: 'opt-3', text: 'Vue 3 + Vite + Tailwind', votes: 15 },
      { id: 'opt-4', text: 'SvelteKit + CSS Modules', votes: 9 }
    ],
    total_votes: 94,
    is_preset: true
  },
  {
    id: 'poll-2',
    question: 'What is the most valuable AI Feature for Coding Assistants?',
    category: 'AI & Innovation',
    status: 'active',
    creator: 'Vibe Team',
    options: [
      { id: 'opt-201', text: 'Autonomous Agentic Workflows', votes: 68 },
      { id: 'opt-202', text: 'Real-time Live Context Search', votes: 35 },
      { id: 'opt-203', text: 'Instant Code Visualizer & UI Mocks', votes: 47 },
      { id: 'opt-204', text: 'Voice-to-Code Interaction', votes: 19 }
    ],
    total_votes: 169,
    is_preset: true
  },
  {
    id: 'poll-3',
    question: 'Where should the Q3 Engineering Team Offsite be hosted?',
    category: 'Team Culture',
    status: 'active',
    creator: 'Community',
    options: [
      { id: 'opt-301', text: 'Goa Beach Resort & Hackathon', votes: 38 },
      { id: 'opt-302', text: 'Manali Mountain Retreat', votes: 29 },
      { id: 'opt-303', text: 'Coorg Coffee Estate & Camping', votes: 18 }
    ],
    total_votes: 85,
    is_preset: true
  }
];

export default function App() {
  // Main Suite Mode Switcher: 'POLL_PULSE' or 'AI_INTERVIEWER'
  const [appMode, setAppMode] = useState('POLL_PULSE');

  // --- AI Interviewer App State ---
  const [interviewStage, setInterviewStage] = useState('SELECT_CANDIDATE'); // SELECT_CANDIDATE | INTERVIEW_ACTIVE | FEEDBACK_VIEW
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setFeedback(null);
    setInterviewStage('INTERVIEW_ACTIVE');
  };

  const handleInterviewFinished = (feedbackData) => {
    setFeedback(feedbackData);
    setInterviewStage('FEEDBACK_VIEW');
  };

  const handleRestartInterview = () => {
    setFeedback(null);
    setInterviewStage('INTERVIEW_ACTIVE');
  };

  const handleSwitchCandidate = () => {
    setSelectedCandidate(null);
    setFeedback(null);
    setInterviewStage('SELECT_CANDIDATE');
  };

  // --- Poll Pulse App State ---
  const [polls, setPolls] = useState(INITIAL_POLLS);
  const [activePollId, setActivePollId] = useState('poll-1');
  const [viewMode, setViewMode] = useState('STUDIO'); // 'HUB' | 'STUDIO' | 'CREATE' | 'ANALYTICS'
  const [studioSubMode, setStudioSubMode] = useState('RESULTS'); // 'VOTE' | 'RESULTS'
  const [userVotes, setUserVotes] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [isSimulating, setIsSimulating] = useState(true);
  const [shareModalPoll, setShareModalPoll] = useState(null);

  // Fetch polls from backend on mount
  useEffect(() => {
    fetch(API_BASE)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.polls && data.polls.length > 0) {
          setPolls(data.polls);
        }
      })
      .catch(err => console.log('Using local state engine:', err));
  }, []);

  // Live Auto Voter Simulation Engine
  useEffect(() => {
    if (!isSimulating || appMode !== 'POLL_PULSE') return;

    const interval = setInterval(() => {
      setPolls(prevPolls => {
        return prevPolls.map(p => {
          if (p.id !== activePollId) return p;
          const randomOptIdx = Math.floor(Math.random() * p.options.length);
          const updatedOptions = p.options.map((opt, i) => 
            i === randomOptIdx ? { ...opt, votes: opt.votes + 1 } : opt
          );
          return {
            ...p,
            options: updatedOptions,
            total_votes: p.total_votes + 1
          };
        });
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isSimulating, activePollId, appMode]);

  const activePoll = polls.find(p => p.id === activePollId) || polls[0];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleCreatePoll = async (pollData) => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pollData)
      });
      const data = await res.json();
      if (data.status === 'success' && data.poll) {
        setPolls(prev => [data.poll, ...prev]);
        setActivePollId(data.poll.id);
        setViewMode('STUDIO');
        setStudioSubMode('VOTE');
        showToast('🚀 Poll launched successfully!');
        return;
      }
    } catch (e) {
      console.log('Backend fallback creation');
    }

    const newId = `poll-${Date.now()}`;
    const newPoll = {
      id: newId,
      question: pollData.question,
      category: pollData.category || 'General',
      status: 'active',
      creator: 'You',
      options: pollData.options.map((optText, i) => ({
        id: `opt-${newId}-${i}`,
        text: optText,
        votes: 0
      })),
      total_votes: 0,
      is_preset: false
    };

    setPolls(prev => [newPoll, ...prev]);
    setActivePollId(newId);
    setViewMode('STUDIO');
    setStudioSubMode('VOTE');
    showToast('🚀 Poll created and ready for votes!');
  };

  const handleCastVote = async (pollId, optionId) => {
    setUserVotes(prev => ({ ...prev, [pollId]: optionId }));

    setPolls(prevPolls => prevPolls.map(p => {
      if (p.id !== pollId) return p;
      const updatedOptions = p.options.map(opt => 
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );
      return {
        ...p,
        options: updatedOptions,
        total_votes: p.total_votes + 1
      };
    }));

    setStudioSubMode('RESULTS');
    showToast('✅ Vote recorded! Viewing live animated results.');

    try {
      await fetch(`${API_BASE}/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: optionId })
      });
    } catch (e) {
      console.log('Vote saved in local engine');
    }
  };

  const handleSharePoll = (poll) => {
    setShareModalPoll(poll);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#poll-${shareModalPoll.id}`;
    navigator.clipboard.writeText(url);
    showToast('📋 Poll link copied to clipboard!');
    setShareModalPoll(null);
  };

  return (
    <div className="poll-app-container">
      {/* Top Application Selector Header Bar */}
      <header className="poll-header" style={{ padding: '0.85rem 1.5rem', background: '#090d16' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Main App Brand / Switcher */}
          <div className="poll-brand" onClick={() => setAppMode(appMode === 'POLL_PULSE' ? 'AI_INTERVIEWER' : 'POLL_PULSE')}>
            <div className="poll-brand-logo" style={{ background: appMode === 'POLL_PULSE' ? 'linear-gradient(135deg, #38bdf8, #6366f1)' : 'linear-gradient(135deg, #a855f7, #ec4899)' }}>
              {appMode === 'POLL_PULSE' ? <BarChart3 size={22} /> : <Bot size={22} />}
            </div>
            <div>
              <div className="poll-brand-title">
                {appMode === 'POLL_PULSE' ? 'Poll Pulse Studio' : 'AI Technical Interviewer'}
              </div>
              <div className="poll-brand-tag">
                {appMode === 'POLL_PULSE' ? 'Live Poll Creator & Real-Time Results' : 'Adaptive Multi-Turn Evaluation Agent'}
              </div>
            </div>
          </div>

          {/* App Switcher Button */}
          <button
            onClick={() => setAppMode(appMode === 'POLL_PULSE' ? 'AI_INTERVIEWER' : 'POLL_PULSE')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              padding: '0.45rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={14} color="#38bdf8" />
            Switch to {appMode === 'POLL_PULSE' ? 'AI Interviewer' : 'Poll Pulse'}
          </button>
        </div>

        {/* Dynamic Nav Pills per App Mode */}
        {appMode === 'POLL_PULSE' ? (
          <div className="nav-pills">
            <button
              className={`nav-pill ${viewMode === 'HUB' ? 'active' : ''}`}
              onClick={() => setViewMode('HUB')}
            >
              Explore Hub
            </button>
            <button
              className={`nav-pill ${viewMode === 'STUDIO' ? 'active' : ''}`}
              onClick={() => setViewMode('STUDIO')}
            >
              Active Studio
            </button>
            <button
              className={`nav-pill ${viewMode === 'CREATE' ? 'active' : ''}`}
              onClick={() => setViewMode('CREATE')}
            >
              <Plus size={14} /> Create Poll
            </button>
            <button
              className={`nav-pill ${viewMode === 'ANALYTICS' ? 'active' : ''}`}
              onClick={() => setViewMode('ANALYTICS')}
            >
              <PieChart size={14} /> Analytics
            </button>
          </div>
        ) : (
          <div className="nav-pills">
            <button
              className={`nav-pill ${interviewStage === 'SELECT_CANDIDATE' ? 'active' : ''}`}
              onClick={handleSwitchCandidate}
            >
              Candidates List
            </button>
            {selectedCandidate && (
              <button
                className={`nav-pill ${interviewStage === 'INTERVIEW_ACTIVE' ? 'active' : ''}`}
                onClick={() => setInterviewStage('INTERVIEW_ACTIVE')}
              >
                Active Chat ({selectedCandidate.name})
              </button>
            )}
            {feedback && (
              <button
                className={`nav-pill ${interviewStage === 'FEEDBACK_VIEW' ? 'active' : ''}`}
                onClick={() => setInterviewStage('FEEDBACK_VIEW')}
              >
                Evaluation Report
              </button>
            )}
          </div>
        )}

        {/* Status Badge */}
        <div className="live-pulse-badge">
          <span className="pulse-dot" /> LIVE SYNC ACTIVE
        </div>
      </header>

      {/* Main Stage */}
      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1140px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* ================= MODE 1: POLL PULSE ================= */}
        {appMode === 'POLL_PULSE' && (
          <>
            {/* VIEW 1: EXPLORE HUB */}
            {viewMode === 'HUB' && (
              <PollDashboard
                polls={polls}
                activePollId={activePollId}
                onSelectPoll={(id) => {
                  setActivePollId(id);
                  setViewMode('STUDIO');
                  setStudioSubMode('VOTE');
                }}
                onCreateClick={() => setViewMode('CREATE')}
                onSharePoll={handleSharePoll}
              />
            )}

            {/* VIEW 2: ACTIVE STUDIO (VOTE / RESULTS) */}
            {viewMode === 'STUDIO' && activePoll && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                  <div className="nav-pills" style={{ padding: '6px' }}>
                    <button
                      className={`nav-pill ${studioSubMode === 'VOTE' ? 'active' : ''}`}
                      onClick={() => setStudioSubMode('VOTE')}
                    >
                      <Vote size={15} /> Cast Vote
                    </button>
                    <button
                      className={`nav-pill ${studioSubMode === 'RESULTS' ? 'active' : ''}`}
                      onClick={() => setStudioSubMode('RESULTS')}
                    >
                      <BarChart3 size={15} /> Live Results & Charts
                    </button>
                  </div>
                </div>

                {studioSubMode === 'VOTE' ? (
                  <PollVoteCard
                    poll={activePoll}
                    onVote={handleCastVote}
                    onViewResults={() => setStudioSubMode('RESULTS')}
                    hasVoted={Boolean(userVotes[activePoll.id])}
                    userVotedOptionId={userVotes[activePoll.id]}
                    onShare={handleSharePoll}
                  />
                ) : (
                  <PollResults
                    poll={activePoll}
                    onBackToVote={() => setStudioSubMode('VOTE')}
                    userVotedOptionId={userVotes[activePoll.id]}
                    onShare={handleSharePoll}
                    isSimulating={isSimulating}
                    onToggleSimulation={() => setIsSimulating(!isSimulating)}
                  />
                )}
              </div>
            )}

            {/* VIEW 3: CREATE POLL */}
            {viewMode === 'CREATE' && (
              <PollCreator
                onCreatePoll={handleCreatePoll}
                onCancel={() => setViewMode('HUB')}
              />
            )}

            {/* VIEW 4: ANALYTICS */}
            {viewMode === 'ANALYTICS' && (
              <PollAnalytics polls={polls} />
            )}
          </>
        )}

        {/* ================= MODE 2: AI TECHNICAL INTERVIEWER ================= */}
        {appMode === 'AI_INTERVIEWER' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {interviewStage === 'SELECT_CANDIDATE' && (
              <CandidateSelector onSelectCandidate={handleSelectCandidate} />
            )}

            {interviewStage === 'INTERVIEW_ACTIVE' && selectedCandidate && (
              <InterviewChat
                candidate={selectedCandidate}
                onBackToCandidates={handleSwitchCandidate}
                onInterviewFinished={handleInterviewFinished}
              />
            )}

            {interviewStage === 'FEEDBACK_VIEW' && (
              <FeedbackPanel
                feedback={feedback}
                candidate={selectedCandidate}
                onRestart={handleRestartInterview}
                onSwitchCandidate={handleSwitchCandidate}
              />
            )}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {shareModalPoll && (
        <div className="modal-overlay" onClick={() => setShareModalPoll(null)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
              Share Live Poll
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Anyone with this link can vote and view live real-time results.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input
                type="text"
                readOnly
                className="form-input"
                value={`${window.location.origin}/#poll-${shareModalPoll.id}`}
              />
              <button className="btn-primary" onClick={handleCopyLink} style={{ flexShrink: 0 }}>
                <Copy size={16} /> Copy
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShareModalPoll(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <Sparkles size={18} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
