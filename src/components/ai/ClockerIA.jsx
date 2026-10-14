// src/components/ai/ClockerIA.jsx
import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import api from "../../services/api";
import {
  faPaperPlane,
  faMinus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import Image from "../common/Image";
import Input from "../common/Input";
import { chatWindow, messagePop } from "../common/animations";

/**
 * MessageItem
 */
const MessageItem = memo(({ message, currentUserId }) => {
  const isMe = Number(message.sender_id) === Number(currentUserId);

  return (
    <motion.article
      variants={messagePop}
      initial="hidden"
      animate="visible"
      layout
      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm ${
          isMe
            ? "bg-vgsdarkblue text-white rounded-tr-none"
            : "bg-white text-vgsblack border border-vgsgray/20 rounded-tl-none"
        }`}
      >
        <div
          className={`prose prose-sm max-w-none ${isMe ? "prose-invert" : "prose-slate"} text-[12px] leading-relaxed`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.message}
          </ReactMarkdown>
        </div>
        <time
          className={`flex items-center justify-end gap-1 mt-1.5 opacity-40 text-[9px] font-bold ${isMe ? "text-white" : "text-vgsgray"}`}
        >
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </motion.article>
  );
});

/**
 * TypingIndicator
 */
const TypingIndicator = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex justify-start"
  >
    <div className="bg-vgswhite border border-vgsgray/20 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
      <div className="w-1.5 h-1.5 bg-vgsdarkblue/40 rounded-full animate-bounce"></div>
      <div className="w-1.5 h-1.5 bg-vgsdarkblue/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
      <div className="w-1.5 h-1.5 bg-vgsdarkblue/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
    </div>
  </motion.div>
);

const ClockerIA = () => {
  const { user, token, socket } = useAuth();
  const { addNotification } = useNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const loadAIHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getMessages(token, 0);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error("Error loading AI history", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      loadAIHistory();
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loadAIHistory, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !token) return;

    const textToSend = newMessage;
    setNewMessage("");
    setIsTyping(true);

    try {
      const res = await api.sendChatMessage(token, 0, textToSend);
      if (!res.success) {
        addNotification(
          "Error",
          "The message could not be sent to Clo",
          "error",
        );
        setIsTyping(false);
      }
    } catch (err) {
      console.error(err);
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (window.confirm("Do you want to clear your history with Clo AI?")) {
      const res = await api.deleteChatConversation(token, 0);
      if (res.success) {
        setMessages([]);
      }
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const isFromAI = Number(msg.sender_id) === 0;
      const isToAI = Number(msg.receiver_id) === 0;

      if (isFromAI || isToAI) {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === msg.id);
          if (exists) return prev;
          return [...prev, msg];
        });

        if (isFromAI) {
          setIsTyping(false);
          if (!isOpen) {
            addNotification("Clocker IA", "New response", "ai", true, false, 0);
          }
        }
      }
    };

    socket.on("new_direct_message", handleNewMessage);
    return () => socket.off("new_direct_message", handleNewMessage);
  }, [socket, isOpen, addNotification]);

  if (!user) return null;

  return (
    <aside className="fixed bottom-6 right-6 z-9995 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            variants={chatWindow}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-4 w-80 sm:w-100 h-137.5 bg-white rounded-2xl shadow-2xl border border-vgsgray/30 flex flex-col overflow-hidden pointer-events-auto"
          >
            <header className="p-4 bg-vgsdarkblue text-vgswhite flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Image
                  src={api.getFileUrl("uploads/profiles/Clocker-IA.webp")}
                  alt="Profile Clo IA"
                  className="w-10 rounded-full"
                />
                <div className="text-sm font-black flex flex-col">
                  Clo IA{" "}
                  <span className="text-xs opacity-50 font-normal italic">
                    By Clocker
                  </span>
                </div>
                <StatusBadge status="online" />
              </div>
              <div className="flex gap-1">
                <Button
                  onClick={clearChat}
                  icon={faTrash}
                  variant="blue"
                  className="hover:bg-vgswhite/10 px-2! py-1! text-sm"
                  title="Clean Clo IA"
                />
                <Button
                  onClick={() => setIsOpen(false)}
                  icon={faMinus}
                  className="hover:bg-vgswhite/10 px-2! py-2! text-sm"
                  title="Minimize Clo IA"
                />
              </div>
            </header>
            
            <main
              ref={scrollRef}
              className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4 scroll-smooth"
            >
              {loading && messages.length === 0 ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-vgsdarkblue"></div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((m, idx) => (
                    <MessageItem
                      key={m.id || idx}
                      message={m}
                      currentUserId={user.user_id}
                    />
                  ))}
                </AnimatePresence>
              )}
              {isTyping && <TypingIndicator />}
            </main>

            <footer className="p-4 bg-white border-t border-vgsgray/10 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to Clo"
                  className="text-sm"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || isTyping}
                  icon={faPaperPlane}
                />
              </form>
            </footer>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.div 
        className="pointer-events-auto"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Image
          src={api.getFileUrl("uploads/profiles/Clocker-IA.webp")}
          onClick={() => setIsOpen((prev) => !prev)}
          alt="Abrir Clo IA"
          className="w-15 h-15 rounded-full cursor-pointer shadow-lg border-2 border-vgswhite"
        />
      </motion.div>
    </aside>
  );
};

export default ClockerIA;