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
  Paperclip
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Message {
  id: string;
  content: string;
  sender: 'USER' | 'AI';
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userId] = useState<string>(localStorage.getItem('support_user_id') || uuidv4());
  const [ticketId, setTicketId] = useState<string | null>(localStorage.getItem('support_ticket_id'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [handoffAlert, setHandoffAlert] = useState(false);
  const [isListening, setIsListening] = useState(false);
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

  useEffect(() => {
    localStorage.setItem('support_user_id', userId);
    
    // Initialize Web Speech API
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

    const aiMsgId = uuidv4();
    setMessages((prev) => [...prev, {
      id: aiMsgId,
      content: '',
      sender: 'AI',
      timestamp: new Date().toISOString(),
    }]);

    try {
      // If no ticketId, first call /message to get a ticketId and the first response
      // This ensures we have a stable ticketId for subsequent streaming calls.
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

      // If we already had a ticketId or just got one, we can still stream if we want, 
      // but for the first message, the /message call already gave us the answer.
      if (!ticketId) {
        setMessages((prev) => prev.map(msg => 
          msg.id === aiMsgId ? { ...msg, content: initialResponse } : msg
        ));
        if (needsHandoff) setHandoffAlert(true);
      } else {
        // Use streaming for existing sessions
        const response = await fetch('http://localhost:8001/api/v1/chat/stream-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            ticket_id: currentTicketId,
            content: userMessageContent,
          }),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponseText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          
          // Parse stream chunks
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              aiResponseText += line.replace('data: ', '');
            }
          }
          
          setMessages((prev) => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: aiResponseText } : msg
          ));
        }
        // Note: Handoff detection for streaming would need separate logic or a special token in stream.
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

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 overflow-hidden font-sans">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ease-in-out bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden shrink-0`}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <MessageCircle className="w-6 h-6" />
            <span className={!isSidebarOpen ? 'hidden' : 'block'}>AI Support</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-gray-200 rounded-md lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 py-2">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center gap-2 justify-center p-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className={!isSidebarOpen ? 'hidden' : 'block'}>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className={`text-xs font-semibold text-gray-500 uppercase px-3 mb-2 ${!isSidebarOpen ? 'hidden' : 'block'}`}>Recent Chats</p>
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className="w-full flex items-center gap-3 p-3 text-left text-sm rounded-lg hover:bg-gray-200 transition-colors group relative"
            >
              <MessageSquare className="w-4 h-4 shrink-0 text-gray-500" />
              <div className={`flex-1 overflow-hidden ${!isSidebarOpen ? 'hidden' : 'block'}`}>
                <p className="font-medium truncate">{chat.title}</p>
              </div>
              <Trash2 className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2" />
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-1">
          <button className="w-full flex items-center gap-3 p-2 text-sm rounded-lg hover:bg-gray-200 transition-colors">
            <Settings className="w-4 h-4" />
            <span className={!isSidebarOpen ? 'hidden' : 'block'}>Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 p-2 text-sm rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className={!isSidebarOpen ? 'hidden' : 'block'}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-white">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-md">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-semibold text-lg">
              {ticketId ? 'Active Conversation' : 'New Conversation'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-xs text-gray-500">AI Online</span>
          </div>
        </header>

        {handoffAlert && (
          <div className="bg-blue-50 text-blue-700 px-4 py-2 text-sm flex items-center gap-2">
            <span>🔔</span>
            <span>A human agent has been notified and will join shortly.</span>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto opacity-60">
              <div className="p-4 bg-blue-100 rounded-full">
                <Bot className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">How can I help you today?</h3>
              <p className="text-sm">I can help with product inquiries, returns, or any general questions you might have.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'USER' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {msg.sender === 'USER' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`space-y-1 ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'USER' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-gray-100 rounded-tl-none flex items-start gap-2'
                    }`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {msg.sender === 'AI' && (
                        <button onClick={() => speak(msg.content)} className="p-1 hover:bg-gray-200 rounded-full shrink-0">
                          <Volume2 className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 items-start max-w-[70%]">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-gray-500" />
                </div>
                <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none">
                  <p className="text-sm">Typing...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto relative flex gap-2">
            <button 
                type="button" 
                onClick={toggleListening} 
                className={`p-3 rounded-full ${isListening ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
                <Mic className="w-5 h-5" />
            </button>
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
                <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
            />
            <input
              type="text"
              className="flex-1 bg-gray-100 border border-transparent rounded-full py-3 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || isUploading}
            />
            <button 
              type="submit" 
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 transition-all"
              disabled={isLoading || !inputValue.trim() || isUploading}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;
