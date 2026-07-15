import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Menu, X, Settings, LogOut, Sparkles, Mail, Lock, User 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = 'http://localhost:8001/api/v1';

interface Message {
  id: string;
  content: string;
  sender: 'USER' | 'AI';
  timestamp: string;
}

function App() {
  const [isLoggedIn] = useState(!!localStorage.getItem('support_user_id'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode] = useState(true);

  const [userId] = useState<string | null>(localStorage.getItem('support_user_id'));
  const [ticketId, setTicketId] = useState<string | null>(localStorage.getItem('support_ticket_id'));

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth states
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatHistory, setChatHistory] = useState<{id: string, title: string}[]>([]);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const endpoint = isLoginMode ? '/auth/login' : '/auth/signup';
    const body = isLoginMode ? { email, password } : { email, password, name };
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Auth failed');

        if (isLoginMode) {
            localStorage.setItem('support_user_id', data.user_id);
            window.location.reload();
        } else {
            alert('Signup successful! Please login.');
            setIsLoginMode(true);
        }
    } catch (err: any) {
        showError(err.message);
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    if(userId) {
        fetch(`${API_BASE_URL}/chat/list-sessions/${userId}`)
          .then(res => res.json())
          .then(data => setChatHistory(data))
          .catch(err => console.error("History fetch error:", err));
    }
  }, [isDarkMode, userId]);

  useEffect(() => {
    if (ticketId) {
      fetch(`${API_BASE_URL}/chat/history/${ticketId}`)
        .then(res => res.json())
        .then(data => {
            const formatted = data.map((msg: any) => ({
                id: msg.id || uuidv4(),
                content: msg.content,
                sender: msg.sender === 'AI' ? 'AI' : 'USER',
                timestamp: msg.timestamp || new Date().toISOString()
            }));
            setMessages(formatted);
        })
        .catch(err => console.error("History loading error:", err));
    } else {
        setMessages([]);
    }
  }, [ticketId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg: Message = {
      id: uuidv4(),
      content: inputValue,
      sender: 'USER',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            ticket_id: ticketId,
            content: userMsg.content,
          }),
        });

        if (!response.ok) throw new Error("Failed to send message");
        const data = await response.json();
        
        if (data.ticket_id && !ticketId) {
            setTicketId(data.ticket_id);
            localStorage.setItem('support_ticket_id', data.ticket_id);
        }

        const aiMsg: Message = {
            id: uuidv4(),
            content: data.response,
            sender: 'AI',
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        showError("Failed to send message.");
    } finally {
        setIsLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <form onSubmit={handleAuth} className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl border dark:border-slate-800 w-full max-w-md space-y-4">
          <h2 className="text-3xl font-bold text-center mb-8">{isLoginMode ? 'Login' : 'Sign Up'}</h2>
          
          {!isLoginMode && (
             <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Full Name" className="w-full p-3 pl-10 border dark:border-slate-700 rounded-xl bg-transparent" value={name} onChange={e => setName(e.target.value)} required />
             </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input type="email" placeholder="Email" className="w-full p-3 pl-10 border dark:border-slate-700 rounded-xl bg-transparent" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input type="password" placeholder="Password" className="w-full p-3 pl-10 border dark:border-slate-700 rounded-xl bg-transparent" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="w-full p-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition">
            {isLoginMode ? 'Login' : 'Sign Up'}
          </button>
          
          <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="w-full text-center text-sm text-blue-500 hover:underline">
            {isLoginMode ? 'Need an account? Sign Up' : 'Already have an account? Login'}
          </button>
          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} bg-white dark:bg-slate-900 border-r dark:border-slate-800 transition-all flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          <div className="font-bold text-lg"><Sparkles className="inline text-blue-500" /> AI Support</div>
          <button onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <button onClick={() => { setTicketId(null); localStorage.removeItem('support_ticket_id'); setMessages([]); }} className="m-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="inline w-4 h-4" /> New Chat</button>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatHistory.map(chat => (
              <button key={chat.id} onClick={() => { setTicketId(chat.id); localStorage.setItem('support_ticket_id', chat.id); }} className="w-full p-3 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 truncate">{chat.title}</button>
            ))}
        </div>
        <div className="p-4 border-t dark:border-slate-800 space-y-2">
           <button className="w-full flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Settings className="w-4 h-4"/> Settings</button>
           <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full flex items-center gap-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><LogOut className="w-4 h-4"/> Logout</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b dark:border-slate-800 flex items-center px-4">
          {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)}><Menu className="w-6 h-6" /></button>}
          <span className="ml-4 font-semibold">Active Chat</span>
        </header>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'USER' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
            </div>
          ))}
          {isLoading && <div className="p-4 bg-slate-200 dark:bg-slate-800 rounded-2xl">AI is thinking...</div>}
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t dark:border-slate-800">
          <input className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl p-3 outline-none" placeholder="Ask anything..." value={inputValue} onChange={e => setInputValue(e.target.value)} />
        </form>
      </main>
    </div>
  );
}
export default App;
