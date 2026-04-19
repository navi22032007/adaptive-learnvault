import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { Sparkles, Send, Bot, User, Loader2, Plus, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIResourceGenerator() {
  const { fetchChatSessions, getChatHistory, sendChatMessage } = useStore();
  
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'bot', content: "Hello! I'm your learning architect. How can I assist your studies today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const messagesEndRef = useRef(null);

  const loadSessions = async () => {
    const data = await fetchChatSessions();
    if (data) setSessions(data);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const selectSession = async (sessionId) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    setIsLoading(true);
    const sessionData = await getChatHistory(sessionId);
    if (sessionData && sessionData.messages.length > 0) {
      setMessages(sessionData.messages);
    } else {
      setMessages([{ role: 'bot', content: "Hello! What can we discuss today?" }]);
    }
    setIsLoading(false);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([{ role: 'bot', content: "Hello! I'm your learning architect. How can I assist your studies today?" }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setInputValue('');
    setIsLoading(true);

    const result = await sendChatMessage(userText, activeSessionId);
    
    if (result) {
      if (!activeSessionId) {
        // Was a new chat, now we have a session ID
        setActiveSessionId(result.id);
        loadSessions(); // refresh sidebar
      }
      setMessages(result.messages);
    } else {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: `Apologies, I encountered an error communicating with the server.` 
      }]);
    }
    setIsLoading(false);
  };

  // Render Content
  const chatContent = (
    <>
      {/* Sidebar for Sessions */}
      <div className={`border-r border-white/10 p-4 flex-col hidden md:flex ${isFullScreen ? 'w-1/4' : 'w-1/3'}`}>
        <button 
          onClick={handleNewChat}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all font-medium text-sm mb-4 border border-violet-500/20"
        >
          <Plus size={16} /> New Chat
        </button>
        
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => selectSession(s.id)}
              className={`flex items-center gap-3 w-full p-3 rounded-xl text-left transition-all ${
                s.id === activeSessionId 
                ? 'bg-white/10 text-white' 
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <MessageSquare size={14} className="flex-shrink-0" />
              <span className="text-sm truncate font-medium">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white">Learning Agent</h3>
              <p className="text-white/40 text-xs">Curriculum Architect</p>
            </div>
          </div>
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/5 hover:text-white transition-all transform active:scale-95"
            title={isFullScreen ? "Minimize" : "Full Screen"}
          >
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar space-y-6">
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                  msg.role === 'user' ? 'bg-white/10' : 'bg-violet-600/20 text-violet-400'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-violet-600 text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 max-w-none'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="flex gap-4 max-w-[85%]">
                 <div className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center flex-shrink-0 mt-1">
                   <Bot size={16} />
                 </div>
                 <div className="flex items-center gap-2 text-white/40 text-sm bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none border border-white/5">
                   <Loader2 size={14} className="animate-spin" />
                   Thinking...
                 </div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="relative mt-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything or ask for a study plan..."
            className="w-full pl-5 pr-14 py-4 rounded-xl bg-[#141419] border border-white/10 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all disabled:opacity-30"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );

  if (isFullScreen) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl p-4 md:p-8 flex items-center justify-center"
      >
        <motion.div 
          layoutId="ai-chat-container"
          className="w-full h-full max-w-7xl max-h-[90vh] bg-[#0f0f13] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_32px_128px_-32px_rgba(124,58,237,0.3)] flex flex-col md:flex-row relative"
        >
          {chatContent}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div layoutId="ai-chat-container" className="p-1 rounded-3xl bg-[#0f0f13]/80 border border-white/10 shadow-2xl mb-6 backdrop-blur-xl flex h-[600px] overflow-hidden relative">
      {chatContent}
    </motion.div>
  );
}
