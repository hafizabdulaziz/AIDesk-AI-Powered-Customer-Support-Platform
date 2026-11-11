import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Menu, X, Settings, Sparkles, User, Search, Trash2, Edit2, 
  Paperclip, Send, Check, AlertCircle, ShieldCheck, Cpu, MessageSquare, ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8001/api/v1' : '/api/v1');

interface Message {
  id: string;
  content: string;
  sender: 'USER' | 'AI';
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at?: string;
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('support_user_id'));
  const [ticketId, setTicketId] = useState<string | null>(localStorage.getItem('support_ticket_id'));

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // File attachment state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Health status state
  const [aiHealth, setAiHealth] = useState<{ ollama_running: boolean; model_installed: boolean; status: string; message: string } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessToast(msg);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // Auto-initialize guest user
  useEffect(() => {
    const initGuestUser = async () => {
      let currentUserId = localStorage.getItem('support_user_id');
      if (!currentUserId) {
        try {
          const guestEmail = `guest_${Math.random().toString(36).substring(7)}@aidesk.ai`;
          const guestPassword = 'GuestPassword123!';
          const guestName = 'Valued Guest';

          let res = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: guestEmail, password: guestPassword, name: guestName })
          });
          
          let data = await res.json();
          if (res.ok && data.user_id) {
            currentUserId = data.user_id;
          } else {
            res = await fetch(`${API_BASE_URL}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'guest_user@aidesk.ai', password: guestPassword })
            });
            data = await res.json();
            if (res.ok && data.user_id) {
              currentUserId = data.user_id;
            } else {
              currentUserId = 'guest-uuid-' + uuidv4();
            }
          }

          if (currentUserId) {
            localStorage.setItem('support_user_id', currentUserId);
            setUserId(currentUserId);
          }
        } catch (e) {
          console.error("Auto guest init error:", e);
          const fallbackId = 'fallback-guest-' + uuidv4();
          localStorage.setItem('support_user_id', fallbackId);
          setUserId(fallbackId);
        }
      }
    };
    initGuestUser();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat/health`);
      if (res.ok) {
        const data = await res.json();
        setAiHealth(data);
      }
    } catch (e) {
      console.error("Health check error:", e);
    }
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

  const fetchSessions = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/list-sessions/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetch(`${API_BASE_URL}/agent/tickets/${ticketId}/history`)
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
              const formatted: Message[] = data.map((msg: any) => ({
                  id: msg.id || uuidv4(),
                  content: msg.content,
                  sender: (msg.sender === 'AI' ? 'AI' : 'USER') as 'AI' | 'USER',
                  timestamp: msg.timestamp || new Date().toISOString()
              }));
              setMessages(formatted);
            }
        })
        .catch(err => console.error("History loading error:", err));
    } else {
        setMessages([]);
    }
  }, [ticketId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setTicketId(null);
    localStorage.removeItem('support_ticket_id');
    setMessages([]);
    setAttachedFile(null);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const renameSession = async (id: string) => {
    if (!newSessionTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/rename-session/${id}?new_title=${encodeURIComponent(newSessionTitle)}`, {
        method: 'PUT'
      });
      if (res.ok) {
        showToast("Session renamed successfully.");
        setEditingSessionId(null);
        setNewSessionTitle('');
        fetchSessions();
      } else {
        showToast("Failed to rename session.", true);
      }
    } catch (e) {
      showToast("Error renaming session.", true);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Kya aap waqai is chat ko delete karna chahte hain?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chat/delete-session/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("Session deleted successfully.");
        if (ticketId === id) {
          handleNewChat();
        }
        fetchSessions();
      } else {
        showToast("Failed to delete session.", true);
      }
    } catch (e) {
      showToast("Error deleting session.", true);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE_URL}/chat/upload-file`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        showToast(`File "${file.name}" uploaded & indexed successfully.`);
      } else {
        showToast("File upload failed.", true);
      }
    } catch (e) {
      showToast("Error uploading file.", true);
    }
  };

  const sendMessage = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const promptText = customPrompt || inputValue;
    if (!promptText.trim() || isLoading) return;

    if (attachedFile) {
      await handleFileUpload(attachedFile);
    }

    const userMsg: Message = {
      id: uuidv4(),
      content: promptText,
      sender: 'USER',
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachedFile(null);
    setIsLoading(true);

    const aiMsgId = uuidv4();
    const initialAiMsg: Message = {
      id: aiMsgId,
      content: '',
      sender: 'AI',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, initialAiMsg]);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || 'guest-user-id',
          ticket_id: ticketId,
          content: userMsg.content,
        }),
      });

      if (!response.ok) {
        throw new Error("Streaming request failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const textContent = line.replace("data: ", "");
              accumulatedContent += textContent + " ";
              setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId ? { ...msg, content: accumulatedContent.trim() } : msg
              ));
            }
          }
        }
      }

      // Refresh sessions to get new ticket id if created
      fetchSessions();
      if (!ticketId) {
        // fetch latest session for user
        setTimeout(async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/chat/list-sessions/${userId}`);
            if (res.ok) {
              const sessions = await res.json();
              if (sessions.length > 0) {
                setTicketId(sessions[0].id);
                localStorage.setItem('support_ticket_id', sessions[0].id);
              }
            }
          } catch (err) {}
        }, 500);
      }

    } catch (error) {
      // Fallback to standard non-streaming message endpoint
      try {
        const fallbackRes = await fetch(`${API_BASE_URL}/chat/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId || 'guest-user-id',
            ticket_id: ticketId,
            content: userMsg.content,
          }),
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (data.ticket_id && !ticketId) {
            setTicketId(data.ticket_id);
            localStorage.setItem('support_ticket_id', data.ticket_id);
          }
          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: data.response } : msg
          ));
          fetchSessions();
        } else {
          throw new Error("Fallback failed");
        }
      } catch (err) {
        showToast("Failed to connect to AI service. Please check connection.", true);
        setMessages(prev => prev.filter(msg => msg.id !== aiMsgId));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = chatHistory.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Toast Notifications */}
      {error && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-2 bg-red-600/90 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border border-red-500 text-sm font-medium">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        </div>
      )}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className="flex items-center gap-2 bg-emerald-600/90 text-white px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md border border-emerald-500 text-sm font-medium">
            <Check className="w-4 h-4" /> {successToast}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} flex-shrink-0 bg-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden relative z-20`}>
        <div className="p-4 flex items-center justify-between min-w-[18rem]">
          <div className="font-bold text-lg flex items-center gap-2 text-blue-400">
            <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" /> AIDesk AI
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="hover:bg-slate-800 p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 pb-2 min-w-[18rem]">
          <button 
            onClick={handleNewChat} 
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-indigo-500 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Search Conversations */}
        <div className="px-3 py-2 min-w-[18rem]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-sm text-slate-200 placeholder-slate-500 pl-9 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-w-[18rem] custom-scrollbar">
          <div className="text-xs font-semibold text-slate-500 px-3 py-2 uppercase tracking-wider">Recent Conversations</div>
          {filteredHistory.length === 0 ? (
            <div className="text-xs text-slate-500 px-3 py-4 text-center">No chat history found</div>
          ) : (
            filteredHistory.map(chat => (
              <div 
                key={chat.id} 
                onClick={() => { setTicketId(chat.id); localStorage.setItem('support_ticket_id', chat.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`group flex items-center justify-between p-2.5 text-sm rounded-xl cursor-pointer transition-all ${ticketId === chat.id ? 'bg-slate-800 text-white font-medium border border-slate-700/50 shadow-sm' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}
              >
                <div className="flex items-center gap-2.5 truncate flex-1">
                  <MessageSquare className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  {editingSessionId === chat.id ? (
                    <input 
                      type="text" 
                      value={newSessionTitle} 
                      onChange={e => setNewSessionTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && renameSession(chat.id)}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                      className="bg-slate-950 text-white px-2 py-0.5 rounded text-xs border border-blue-500 outline-none w-full"
                    />
                  ) : (
                    <span className="truncate">{chat.title}</span>
                  )}
                </div>
                <div className="hidden group-hover:flex items-center gap-1">
                  {editingSessionId === chat.id ? (
                    <button onClick={(e) => { e.stopPropagation(); renameSession(chat.id); }} className="p-1 hover:text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(chat.id); setNewSessionTitle(chat.title); }} className="p-1 hover:text-blue-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  )}
                  <button onClick={(e) => deleteSession(chat.id, e)} className="p-1 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2 min-w-[18rem] bg-slate-950/80">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 p-2.5 text-sm text-slate-300 hover:bg-slate-900 rounded-xl transition-colors font-medium"
          >
            <Settings className="w-4 h-4 text-slate-400" /> Settings & Status
          </button>
          <div className="flex items-center justify-between p-2 text-xs text-slate-500 rounded-lg bg-slate-900/50">
            <div className="flex items-center gap-2 truncate">
              <User className="w-4 h-4 text-blue-500" /> 
              <span className="truncate">Guest Session</span>
            </div>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" title="Connected" />
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col relative bg-slate-900">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="hover:bg-slate-800 p-2 rounded-lg transition-colors text-slate-400 hover:text-white">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">AIDesk AI Assistant</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">llama3.2</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{aiHealth?.ollama_running ? "Ollama Connected" : "AI Service Active"}</span>
            </div>
          </div>
        </header>

        {/* Message Scroll Container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Kese madad kar sakta hoon aapki?</h1>
                <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
                  Ask questions, upload documents for RAG analysis, or request technical support assistance.
                </p>
              </div>

              {/* Suggestion Prompt Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-4">
                {[
                  "What is AIDesk?",
                  "How do I create a support ticket?",
                  "Who built you?",
                  "Help with troubleshooting"
                ].map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(undefined, prompt)}
                    className="p-3 text-left text-xs md:text-sm bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <span>{prompt}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transform group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className={`flex items-start gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${msg.sender === 'USER' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-400 border border-slate-700'}`}>
                    {msg.sender === 'USER' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.sender === 'USER' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-none'}`}>
                    {msg.sender === 'AI' ? (
                      <div className="prose prose-invert max-w-none text-slate-200">
                        <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && messages[messages.length - 1]?.sender === 'USER' && (
            <div className="flex justify-start animate-fadeIn">
              <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700 p-4 rounded-2xl rounded-tl-none shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 pl-2">AIDesk is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Message Composer */}
        <div className="p-4 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent">
          <form onSubmit={e => sendMessage(e)} className="max-w-4xl mx-auto relative">
            
            {/* Attached File Preview */}
            {attachedFile && (
              <div className="flex items-center justify-between bg-slate-800 border border-slate-700 px-3 py-2 rounded-t-xl text-xs">
                <div className="flex items-center gap-2 text-slate-300 truncate">
                  <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                  <span className="truncate">{attachedFile.name}</span>
                  <span className="text-slate-500">({(attachedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-400 p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="relative flex items-center bg-slate-950 border border-slate-700/80 rounded-2xl shadow-xl focus-within:border-blue-500 transition-all">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={e => e.target.files && setAttachedFile(e.target.files[0])} 
                className="hidden" 
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 text-slate-400 hover:text-slate-200 transition-colors"
                title="Attach Document / File"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <textarea 
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Yahan apna sawal likhein (Press Enter to send)..."
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 py-3.5 px-2 focus:outline-none resize-none max-h-32 text-sm"
              />

              <button 
                type="submit" 
                disabled={isLoading || (!inputValue.trim() && !attachedFile)}
                className="p-3.5 m-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all shadow-md flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center mt-2 text-[11px] text-slate-500">
              AIDesk AI may produce inaccurate info. Verify important information. Powered by Ollama & LangChain.
            </div>
          </form>
        </div>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" /> Settings & System Status
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="font-semibold text-slate-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" /> AI Provider & Connection Status
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Provider Engine:</span>
                    <span className="text-slate-200 font-medium">Local Ollama (llama3.2)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Ollama Running:</span>
                    <span className={aiHealth?.ollama_running ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                      {aiHealth?.ollama_running ? "Connected (Healthy)" : "Checking / Offline"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Model Installed:</span>
                    <span className={aiHealth?.model_installed ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                      {aiHealth?.model_installed ? "llama3.2 ready" : "Not detected"}
                    </span>
                  </div>
                  {aiHealth?.message && (
                    <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                      {aiHealth.message}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300">Application Info</div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span className="text-slate-200">1.0.0 Production</span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Endpoint:</span>
                    <span className="text-slate-200 font-mono text-[10px]">{API_BASE_URL}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
