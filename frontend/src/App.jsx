import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, Vote, Plus, Sparkles, PieChart, Share2, Copy, Bot, 
  ChevronDown, LayoutGrid, Check, Activity, Layers, BarChart2
} from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- AI Interviewer App State ---
  const [interviewStage, setInterviewStage] = useState('SELECT_CANDIDATE');
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
  const [viewMode, setViewMode] = useState('HUB'); // 'HUB' | 'STUDIO' | 'CREATE' | 'ANALYTICS'
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
      {/* Sleek Minimalist Header Bar */}
      <header className="poll-header-clean">
        {/* Left: Brand + Interactive App Switcher Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="brand-dropdown-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="brand-icon-box">
              {appMode === 'POLL_PULSE' ? <BarChart3 size={20} /> : <Bot size={20} />}
            </div>
            <div className="brand-text-wrapper">
              <span className="brand-title">
                {appMode === 'POLL_PULSE' ? 'Poll Pulse' : 'AI Interviewer'}
              </span>
              <span className="brand-subtitle-badge">
                {appMode === 'POLL_PULSE' ? 'Live Prototype' : 'Evaluation Engine'}
              </span>
            </div>
            <ChevronDown size={16} className={`chevron-icon ${isDropdownOpen ? 'open' : ''}`} />
          </button>

          {/* App Switcher Dropdown Menu */}
          {isDropdownOpen && (
            <div className="app-dropdown-menu">
              <div className="dropdown-label">Select Application</div>
              
              <div
                className={`dropdown-item ${appMode === 'POLL_PULSE' ? 'active' : ''}`}
                onClick={() => {
                  setAppMode('POLL_PULSE');
                  setIsDropdownOpen(false);
                }}
              >
                <div className="dropdown-item-icon poll">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <div className="dropdown-item-title">Poll Pulse Studio</div>
                  <div className="dropdown-item-desc">Poll Creator & Live Animated Results</div>
                </div>
                {appMode === 'POLL_PULSE' && <Check size={16} color="#38bdf8" style={{ marginLeft: 'auto' }} />}
              </div>

              <div
                className={`dropdown-item ${appMode === 'AI_INTERVIEWER' ? 'active' : ''}`}
                onClick={() => {
                  setAppMode('AI_INTERVIEWER');
                  setIsDropdownOpen(false);
                }}
              >
                <div className="dropdown-item-icon ai">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="dropdown-item-title">AI Technical Interviewer</div>
                  <div className="dropdown-item-desc">Multi-Turn Adaptive Interview Agent</div>
                </div>
                {appMode === 'AI_INTERVIEWER' && <Check size={16} color="#a855f7" style={{ marginLeft: 'auto' }} />}
              </div>
            </div>
          )}
        </div>

        {/* Center: Streamlined Clean Navigation Pills (3 focused tabs) */}
        {appMode === 'POLL_PULSE' ? (
          <div className="clean-nav-pills">
            <button
              className={`clean-nav-pill ${viewMode === 'HUB' ? 'active' : ''}`}
              onClick={() => setViewMode('HUB')}
            >
              <LayoutGrid size={15} /> Explore Hub
            </button>
            <button
              className={`clean-nav-pill ${viewMode === 'STUDIO' ? 'active' : ''}`}
              onClick={() => setViewMode('STUDIO')}
            >
              <BarChart2 size={15} /> Live Studio
            </button>
            <button
              className={`clean-nav-pill ${viewMode === 'ANALYTICS' ? 'active' : ''}`}
              onClick={() => setViewMode('ANALYTICS')}
            >
              <PieChart size={15} /> Analytics
            </button>
          </div>
        ) : (
          <div className="clean-nav-pills">
            <button
              className={`clean-nav-pill ${interviewStage === 'SELECT_CANDIDATE' ? 'active' : ''}`}
              onClick={handleSwitchCandidate}
            >
              Candidates
            </button>
            {selectedCandidate && (
              <button
                className={`clean-nav-pill ${interviewStage === 'INTERVIEW_ACTIVE' ? 'active' : ''}`}
                onClick={() => setInterviewStage('INTERVIEW_ACTIVE')}
              >
                Interview Chat
              </button>
            )}
            {feedback && (
              <button
                className={`clean-nav-pill ${interviewStage === 'FEEDBACK_VIEW' ? 'active' : ''}`}
                onClick={() => setInterviewStage('FEEDBACK_VIEW')}
              >
                Report
              </button>
            )}
          </div>
        )}

        {/* Right: Quick Action Button & Compact Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {appMode === 'POLL_PULSE' && (
            <button
              className="btn-header-create"
              onClick={() => setViewMode('CREATE')}
            >
              <Plus size={16} /> New Poll
            </button>
          )}

          <div className="compact-live-badge">
            <span className="pulse-dot" /> Live
          </div>
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
