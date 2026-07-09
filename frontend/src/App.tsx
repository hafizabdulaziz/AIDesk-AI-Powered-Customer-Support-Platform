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

interface HistoryMessage {
  id: string;
  content: string;
  sender: 'USER' | 'AI' | 'HUMAN_AGENT';
  timestamp: string;
}

function App() {
  const [userId] = useState<string>(localStorage.getItem('support_user_id') || uuidv4());
  const [ticketId, setTicketId] = useState<string | null>(localStorage.getItem('support_ticket_id'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [handoffAlert, setHandoffAlert] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize User ID in storage
  useEffect(() => {
    localStorage.setItem('support_user_id', userId);
  }, [userId]);

  // Load History on Mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!ticketId) return;
      
      try {
        const response = await fetch(`http://localhost:8000/api/v1/chat/history/${ticketId}`);
        if (response.ok) {
          const data: HistoryMessage[] = await response.json();
          const formattedMessages: Message[] = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender === 'USER' ? 'USER' : 'AI',
            timestamp: msg.timestamp,
          }));
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };

    loadHistory();
  }, [ticketId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessageContent = inputValue.trim();
    setInputValue('');
    
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ticket_id: ticketId,
          content: userMessageContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      const data: ChatState = await response.json();

      if (!ticketId) {
        setTicketId(data.ticket_id);
        localStorage.setItem('support_ticket_id', data.ticket_id);
      }

      const aiMsg: Message = {
        id: uuidv4(),
        content: data.response,
        sender: 'AI',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (data.needs_handoff) {
        setHandoffAlert(true);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, {
        id: uuidv4(),
        content: `Error: ${error.message || "Unexpected connection error"}`,
        sender: 'AI',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="chat-container">
        <header className="chat-header">
          <div className="header-left">
            <div className="status-dot"></div>
            <h2>AI Support Assistant</h2>
          </div>
          <button className="reset-chat" onClick={() => {
            localStorage.removeItem('support_ticket_id');
            setTicketId(null);
            setMessages([]);
            setHandoffAlert(false);
          }}>New Chat</button>
        </header>

        {handoffAlert && (
          <div className="handoff-banner">
            <span className="banner-icon">🔔</span>
            <span>A human agent has been notified. They will join shortly.</span>
          </div>
        )}

        <div className="message-area" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="welcome-screen">
              <div className="welcome-icon">🤖</div>
              <h3>Welcome to AI Support</h3>
              <p>Ask me anything about our products or policies!</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.sender.toLowerCase()}`}>
              <div className={`message-bubble ${msg.sender.toLowerCase()}`}>
                <div className="content">{msg.content}</div>
                <div className="timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message-wrapper ai">
              <div className="message-bubble ai loading">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form className="input-area" onSubmit={sendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className="send-button" disabled={isLoading || !inputValue.trim()}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
