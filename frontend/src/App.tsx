import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Menu, 
  X, 
  Trash2, 
  Send, 
  User, 
  Bot, 
  Settings, 
  LogOut,
  MessageCircle,
  Mic,
  Volume2,
  Paperclip,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Message {
  id: string;
  content: string;
  sender: 'USER' | 'AI';
  timestamp: string;
  image?: string; // Added for multimodal support
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [userId] = useState<string>(localStorage.getItem('support_user_id') || uuidv4());
  const [ticketId, setTicketId] = useState<string | null>(localStorage.getItem('support_ticket_id'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [handoffAlert, setHandoffAlert] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // For previewing image before send

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchChatSessions = async () => {
      try {
        const response = await fetch(`http://localhost:8001/api/v1/chat/list-sessions/${userId}`);
        if (response.ok) {
          const sessions = await response.json();
          setChatHistory(sessions);
        }
      } catch (error) {
        console.error('Failed to load chat sessions:', error);
      }
    };
    fetchChatSessions();
  }, [userId]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('support_user_id', userId);
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => prev + ' ' + transcript);
        setIsListening(false);
      };
    }
  }, [userId]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target?.result as string);
      reader.readAsDataURL(file);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8001/api/v1/chat/upload-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      alert(`File ${file.name} uploaded and indexed successfully!`);
    } catch (error) {
      console.error(error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const loadHistory = async () => {
      if (!ticketId) return;
      try {
        const response = await fetch(`http://localhost:8001/api/v1/chat/history/${ticketId}`);
        if (response.ok) {
          const data = await response.json();
          const formattedMessages: Message[] = data.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender === 'USER' ? 'USER' : 'AI',
            timestamp: msg.timestamp,
            image: msg.image,
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
    if ((!inputValue.trim() && !selectedImage) || isLoading) return;

    const userMessageContent = inputValue.trim();
    const imageToBase64 = selectedImage;
    
    setInputValue('');
    setSelectedImage(null);
    
    const userMsg: Message = {
      id: uuidv4(),
      content: userMessageContent,
      sender: 'USER',
      timestamp: new Date().toISOString(),
      image: imageToBase64,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const aiMsgId = uuidv4();
    setMessages((prev) => [...prev, {
      id: aiMsgId,
      content: '',
      sender: 'AI',
      timestamp: new Date().toISOString(),
    }]);

    try {
      let currentTicketId = ticketId;
      let initialResponse = '';
      let needsHandoff = false;

      if (!currentTicketId) {
        const initRes = await fetch('http://localhost:8001/api/v1/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            content: userMessageContent,
            image: imageToBase64,
          }),
        });

        if (!initRes.ok) throw new Error("Failed to initialize chat session");
        const data = await initRes.json();
        currentTicketId = data.ticket_id;
        initialResponse = data.response;
        needsHandoff = data.needs_handoff;
        setTicketId(currentTicketId);
        localStorage.setItem('support_ticket_id', currentTicketId);
      }

      if (!ticketId) {
        setMessages((prev) => prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, content: initialResponse } : msg
        ));
        if (needsHandoff) setHandoffAlert(true);
      } else {
        const response = await fetch('http://localhost:8001/api/v1/chat/stream-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            ticket_id: currentTicketId,
            content: userMessageContent,
            image: imageToBase64,
          }),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponseText = '';

        while (true) {
          const { done, value } = await reader.read();
          of the lines:
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              aiResponseText += line.replace('data: ', '');
            }
          }
          setMessages((prev) => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: aiResponseText } : msg
          ));
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      setMessages((prev) => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, content: `Error: ${error.message}` } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setTicketId(null);
    setMessages([]);
    setHandoffAlert(false);
    localStorage.removeItem('support_ticket_id');
  };

  const suggestions = [
    "How can I reset my password?",
    "What are your shipping policies?",
    "I want to track my order",
    "Tell me more about your premium plan"
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out bg-sidebar-bg text-sidebar-foreground flex flex-col overflow-hidden shrink-0 border-r border-border`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className={!isSidebarOpen ? 'hidden' : 'block'}>AI Platform</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded-md lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-2">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center gap-2 justify-center p-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className={!isSidebarOpen ? 'hidden' : 'block'}>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          <p className={`text-xs font-semibold text-muted-foreground uppercase px-3 mb-2 ${!isSidebarOpen ? 'hidden' : 'block'}`}>Recent History</p>
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className="w-full flex items-center gap-3 p-3 text-left text-sm rounded-xl hover:bg-white/10 transition-colors group relative"
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground" />
              <div className={`flex-1 overflow-hidden ${!isSidebarOpen ? 'hidden' : 'block'}`}>
                <p className="font-medium truncate">{chat.title}</p>
              </div>
              <Trash2 className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" />
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 space-y-1">
          <button className="w-full flex items-center gap-3 p-2 text-sm rounded-lg hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4" />
            <span className={!isSidebarOpen ? 'hidden' : 'block'}>Settings</span>
          </button>
          <div className="flex items-center justify-between p-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="w-full flex items-center gap-3 p-2 text-sm rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors text-left">
              <LogOut className="w-4 h-4" />
              <span className={!isSidebarOpen ? 'hidden' : 'block'}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-background">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-muted rounded-md">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 group cursor-pointer hover:bg-muted p-1 rounded-lg transition-all">
              <h2 className="font-semibold text-lg">
                {ticketId ? 'Active Chat' : 'AI Assistant'}
              </h2>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
               <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="hidden sm:inline">Llama 3.2 Online</span>
             </div>
          </div>
        </header>

        {handoffAlert && (
          <div className="bg-primary/10 text-primary px-4 py-2 text-sm flex items-center gap-2 border-b border-primary/20 animate-in slide-in-from-top duration-300">
            <span>🔔</span>
            <span>A human agent has been notified and will join shortly.</span>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-2xl mx-auto px-4">
              <div className="relative">
                <div className="p-6 bg-primary/10 rounded-3xl">
                  <Bot className="w-16 h-16 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">How can I help you today?</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Ask me anything about your products, support, or just have a chat.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => { setInputValue(s); }}
                    className="p-4 text-left text-sm rounded-2xl border border-border bg-card hover:border-primary transition-all hover:shadow-md group"
                  >
                    <p className="font-medium group-hover:text-primary transition-colors">{s}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-8">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`flex gap-4 max-w-[90%] ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      msg.sender === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {msg.sender === 'USER' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.sender === 'USER' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-card border border-border rounded-tl-none'
                      }`}>
                        {msg.image && (
                          <img src={msg.image} alt="User upload" className="max-w-full h-auto rounded-lg mb-3 border border-border" />
                        )}
                        <ReactMarkdown className="prose dark:prose-invert max-w-none">
                          {msg.content}
                        </ReactMarkdown>
                        {msg.sender === 'AI' && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                            <button onClick={() => speak(msg.content)} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                              <Volume2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="flex justify-start max-w-3xl mx-auto w-full">
              <div className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-gradient-to-t from-background via-background to-transparent">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto relative flex items-center gap-2">
            <div className="flex-1 relative flex items-center gap-2 bg-card border border-border rounded-2xl p-2 shadow-lg focus-within:border-primary transition-all">
              <button 
                  type="button" 
                  onClick={toggleListening} 
                  className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white' : 'hover:bg-muted text-muted-foreground'}`}
              >
                  <Mic className="w-5 h-5" />
              </button>
              <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all"
              >
                  <Paperclip className="w-5 h-5" />
              </button>
              <button 
                  type="button" 
                  onClick={() => cameraInputRef.current?.click()} 
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all"
              >
                  <Camera className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                onChange={handleCameraCapture}
              />
              <input
                type="text"
                className="flex-1 bg-transparent border-none focus:ring-0 py-2 pl-2 pr-2 text-sm outline-none"
                placeholder={selectedImage ? "Add a caption..." : "Ask anything..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading || isUploading}
              />
              {selectedImage && (
                <div className="relative group">
                  <img src={selectedImage} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-primary" />
                  <button 
                    type="button" 
                    onClick={() => setSelectedImage(null)} 
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <button 
                type="submit" 
                className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
                disabled={isLoading || !inputValue.trim() || !selectedImage || isUploading}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
          <p className="text-center text-[10px] text-muted-foreground mt-3">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
