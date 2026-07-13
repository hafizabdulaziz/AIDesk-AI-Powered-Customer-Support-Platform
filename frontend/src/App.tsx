import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Plus, Menu, X, Trash2, Send, User, Bot, 
  Settings, LogOut, Sun, Moon, ChevronDown, Sparkles 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  sender: 'USER' | 'AI';
  timestamp: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [userId] = useState<string>(localStorage.getItem('support_user_id') || uuidv4());
  const [ticketId, setTicketId] = useState<string | null>(localStorage.getItem('support_ticket_id'));
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('support_user_id', userId);
  }, [isDarkMode, userId]);

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
        const response = await fetch('http://localhost:8001/api/v1/chat/message', {
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
        
        if (data.ticket_id) {
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
        console.error("Error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border dark:border-slate-800 w-96 space-y-6">
          <h2 className="text-2xl font-bold text-center">Login to AI Support</h2>
          <button 
            onClick={() => setIsLoggedIn(true)}
            className="w-full p-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Login / Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg"><Sparkles className="text-blue-500" /> AI Support</div>
          <button onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-3">
          <button onClick={() => { setMessages([]); setTicketId(null); localStorage.removeItem('support_ticket_id'); }} className="w-full flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {/* History items would go here */}
        </div>
        <div className="p-4 border-t dark:border-slate-800">
           <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
             {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
           </button>
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
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'USER' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && <div className="text-slate-500 italic">AI is thinking...</div>}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-2">
            <input 
              className="flex-1 bg-transparent p-2 outline-none"
              placeholder="Ask anything..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
            <button type="submit" className="p-2 bg-blue-600 text-white rounded-lg"><Send className="w-5 h-5" /></button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default App;
