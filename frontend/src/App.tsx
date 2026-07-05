import { useState, useEffect, useRef } from 'react';
import './App.css';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Message {
  id: string;
  content: string;
  sender: 'USER' | 'AI';
  timestamp: string;
}

interface ChatState {
  ticket_id: string;
  response: string;
  status: string;
  needs_handoff: boolean;
}

function App() {
  // 1. Real State (No dummies!)
  // In a real production app, user_id would come from Auth (JWT)
  const [userId] = useState<string>(uuidv4());
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [handoffAlert, setHandoffAlert] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 2. Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // 3. API Integration
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessageContent = inputValue.trim();
    setInputValue('');
    
    // Add user message to UI immediately
    const userMsg: Message = {
      id: uuidv4(),
      content: userMessageContent,
      sender: 'USER',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ticket_id: ticketId, // Might be null for new sessions
          content: userMessageContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: ChatState = await response.json();

      // Update ticketId if it's a new session
      if (!ticketId) {
        setTicketId(data.ticket_id);
      }

      // Add AI response to UI
      const aiMsg: Message = {
        id: uuidv4(),
        content: data.response,
        sender: 'AI',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Handle Handoff
      if (data.needs_handoff) {
        setHandoffAlert(true);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMsg: Message = {
        id: uuidv4(),
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        sender: 'AI',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="chat-container">
        {/* Header */}
        <header className="chat-header">
          <div className="status-dot"></div>
          <h2>AI Support Assistant</h2>
        </header>

        {/* Handoff Alert */}
        {handoffAlert && (
          <div className="handoff-alert">
            ⚠️ A human agent has been notified. They will join this chat shortly.
          </div>
        )}

        {/* Message Area */}
        <div className="message-area" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="empty-state">
              <p>How can I help you today?</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender.toLowerCase()}`}>
              <div className="content">{msg.content}</div>
              <div className="message-info">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message ai">
              <div className="loading-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form className="input-area" onSubmit={sendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="send-button" 
            disabled={isLoading || !inputValue.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
