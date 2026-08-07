import React from 'react';
import { Bot, User } from 'lucide-react';

export default function MessageBubble({ message, timestamp }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`message-bubble ${isAssistant ? 'assistant' : 'user'}`}>
      <div className={`msg-avatar ${isAssistant ? 'assistant' : 'user'}`}>
        {isAssistant ? <Bot size={20} /> : <User size={20} />}
      </div>
      <div>
        <div className="msg-content">
          <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
        </div>
        {timestamp && <div className="msg-time">{timestamp}</div>}
      </div>
    </div>
  );
}
