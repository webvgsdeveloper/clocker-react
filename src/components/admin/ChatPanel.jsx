// src/components/admin/ChatPanel.jsx
import React, { useState, useEffect, useRef, Suspense, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useCall } from "../../contexts/CallContext";
import Card from "../common/Card";
import Button from "../common/Button";
import StatusBadge from "../common/StatusBadge";
import Badge from "../common/Badge";
import Image from "../common/Image";
import Input from "../common/Input";
import MediaMessage from "../common/MediaMessage";
import MediaPreviewer from "../common/MediaPreviewer";
import LoadingFallback from "../common/LoadingFallback";
import {
  panelVariants,
  staggerContainer,
  listItemVariants,
  popIn
} from "../common/animations";
import {
  faPaperPlane,
  faTrash,
  faVolumeMute,
  faVolumeUp,
  faComments,
  faPhone,
  faVideo,
  faChevronDown,
  faAddressBook,
  faPaperclip,
  faTimes,
  faFaceGrinWink,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const EmojiPicker = React.lazy(() => import("emoji-picker-react"));

// Alias para mantener compatibilidad con nombres anteriores
const contactListVariants = staggerContainer(0.08);

const ContactListItem = memo(({ contact, isSelected, onClick }) => (
  <motion.div
    variants={listItemVariants}
    onClick={onClick}
    className={`p-4 cursor-pointer flex justify-between items-center transition-all ${
      isSelected
        ? "bg-vgsdarkblue/5 border-r-4 border-vgsdarkblue"
        : "hover:bg-gray-100"
    }`}
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p
          className={`text-sm truncate ${contact.unread_count > 0 ? "font-black text-vgsblack" : "font-medium text-gray-700"}`}
        >
          {contact.name}
        </p>
        {contact.is_muted && (
          <Badge icon={faVolumeMute} variant="none" size="sm" />
        )}
      </div>
      <p className="text-xs text-vgsgray truncate">{contact.last_message}</p>
    </div>
    <div className="flex items-center gap-1">
      <StatusBadge status={contact.user_status} />
      {contact.unread_count > 0 && (
        <span className="bg-vgsred text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
          {contact.unread_count}
        </span>
      )}
    </div>
  </motion.div>
));

const ChatHeader = ({
  contact,
  onToggleMute,
  onDelete,
  onStartCall,
  showCallDropdown,
  setShowCallDropdown,
}) => (
  <header className="py-2 px-3 border-b border-vgsgray/50 flex justify-between items-center bg-gray-50/50">
    <div className="flex items-center gap-3">
      <Image
        src={api.getFileUrl(contact.profile_picture, contact.name)}
        alt={contact.name}
        className="w-7"
      />
      <p className="font-bold text-vgsblack">{contact.name}</p>
    </div>
    <div className="flex gap-2">
      <div className="relative">
        <Button
          onClick={() => setShowCallDropdown(!showCallDropdown)}
          variant="blue"
          animation="shrink"
        >
          <FontAwesomeIcon icon={faPhone} />
          <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
        </Button>
        <AnimatePresence>
          {showCallDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-1 w-48 bg-white border border-vgsgray rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <Button
                onClick={() => {
                  onStartCall("audio");
                  setShowCallDropdown(false);
                }}
                icon={faPhone}
                variant="white"
                className="w-full justify-start rounded-none! text-sm"
              >
                Voice Call
              </Button>
              <Button
                onClick={() => {
                  onStartCall("video");
                  setShowCallDropdown(false);
                }}
                icon={faVideo}
                variant="white"
                className="w-full justify-start rounded-none! text-sm"
              >
                Video Call
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="h-6 w-px bg-vgsgray mx-1"></div>
      <Button
        variant="gray"
        animation="grow"
        icon={contact.is_muted ? faVolumeMute : faVolumeUp}
        onClick={onToggleMute}
        className="px-3"
      />
      <Button
        variant="red"
        animation="grow"
        icon={faTrash}
        onClick={onDelete}
        className="px-3"
      />
    </div>
  </header>
);

const ChatPanel = ({ token, currentUser, filters }) => {
  const { socket } = useAuth();
  const { addNotification, updateMutedUsers } = useNotification();
  const { startCall } = useCall();

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCallDropdown, setShowCallDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewData, setPreviewData] = useState({
    isOpen: false,
    url: "",
    type: "",
    name: "",
  });

  const scrollRef = useRef();
  const fileInputRef = useRef();
  const emojiPickerRef = useRef(null);

  const closePreview = () =>
    setPreviewData((prev) => ({ ...prev, isOpen: false }));
  const openPreview = (data) => setPreviewData({ isOpen: true, ...data });
  const scrollToBottom = () =>
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadContacts = useCallback(async () => {
    const res = await api.getChatList(token, filters);
    if (res.success) setContacts(res.contacts || []);
  }, [token, filters]);

  const loadMessages = useCallback(async (contactId) => {
    const res = await api.getMessages(token, contactId);
    if (res.success) setMessages(res.messages || []);
  }, [token]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (contacts.length > 0) {
      const mutedIds = contacts
        .filter((c) => c.is_muted === true)
        .map((c) => Number(c.id));
      updateMutedUsers(mutedIds);
    }
  }, [contacts, updateMutedUsers]);

  useEffect(() => {
    if (selectedContact?.id) loadMessages(selectedContact.id);
  }, [selectedContact?.id, loadMessages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      const currentUserId = Number(currentUser?.user_id);
      const msgSenderId = Number(msg.sender_id);
      const selectedId = Number(selectedContact?.id);

      const isFromSelected =
        selectedContact &&
        (msgSenderId === selectedId || msgSenderId === currentUserId);

      if (isFromSelected) {
        setMessages((prev) => [...prev, msg]);
      } else if (msgSenderId !== currentUserId && msgSenderId !== 0) {
        let notifyText = msg.message || "";
        if (msg.file_url) {
          if (msg.file_type?.startsWith("video/")) notifyText = "🎥 Video";
          else if (msg.file_type?.startsWith("image/")) notifyText = "📷 Photo";
          else notifyText = "📁 File: " + (msg.file_name || "Attachment");
        }
        addNotification(
          msg.sender_name || "New Message",
          notifyText,
          "chat",
          true,
          false,
          msg.sender_id,
        );
      }
      loadContacts();
    };
    socket.on("new_direct_message", handleNewMessage);
    return () => socket.off("new_direct_message", handleNewMessage);
  }, [socket, selectedContact, currentUser, addNotification, loadContacts]);

  const handleToggleMute = async () => {
    if (!selectedContact) return;
    const newMuteStatus = !selectedContact.is_muted;
    const res = await api.toggleMuteChat(
      token,
      selectedContact.id,
      newMuteStatus ? 1 : 0,
    );
    if (res.success) {
      setSelectedContact((prev) => ({ ...prev, is_muted: newMuteStatus }));
      loadContacts();
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedContact) return;
    if (window.confirm("Do you wanna delete this conversation?")) {
      const res = await api.deleteChatConversation(token, selectedContact.id);
      if (res.success) {
        setSelectedContact(null);
        loadContacts();
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const hasText = newMessage && newMessage.trim() !== "";
    const hasFile = selectedFile !== null;

    if ((!hasText && !hasFile) || !selectedContact) return;

    const res = await api.sendChatMessage(
      token,
      selectedContact.id,
      newMessage,
      selectedFile,
    );
    if (res.success) {
      setNewMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      alert(res.error || "Error sending message");
    }
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={panelVariants}
      className="flex h-[calc(100vh-300px)] min-h-125 bg-white rounded-xl shadow-lg border border-vgsgray/30 overflow-hidden"
    >
      <MediaPreviewer
        isOpen={previewData.isOpen}
        onClose={closePreview}
        fileUrl={previewData.url}
        fileType={previewData.type}
        fileName={previewData.name}
      />
      <aside className="w-full sm:w-1/3 border-r border-vgsgray/20 bg-gray-50 flex flex-col">
        <Badge
          variant="red"
          icon={faAddressBook}
          rounded="none"
          className="tracking-widest uppercase font-bold p-4! w-full"
        >
          Contacts
        </Badge>
        <motion.div
          className="flex-1 overflow-y-auto"
          variants={contactListVariants}
          initial="hidden"
          animate="visible"
          key={contacts.length}
        >
          {contacts.map((c) => (
            <ContactListItem
              key={c.id}
              contact={c}
              isSelected={selectedContact?.id === c.id}
              onClick={() => setSelectedContact(c)}
            />
          ))}
        </motion.div>
      </aside>
      <main className="hidden sm:flex flex-1 flex-col bg-vgswhite">
        <AnimatePresence mode="wait">
          {selectedContact ? (
            <motion.div
              key={selectedContact.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              <ChatHeader
                contact={selectedContact}
                onToggleMute={handleToggleMute}
                onDelete={handleDeleteChat}
                showCallDropdown={showCallDropdown}
                setShowCallDropdown={setShowCallDropdown}
                onStartCall={(type) =>
                  startCall(
                    selectedContact.id,
                    selectedContact.name,
                    type,
                    selectedContact.profile_picture,
                  )
                }
              />
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-vgsgray-50/30">
                <AnimatePresence initial={false}>
                  {messages.map((m) => {
                    const isMe =
                      Number(m.sender_id) === Number(currentUser?.user_id);
                    return (
                      <motion.article
                        key={m.id}
                        variants={popIn}
                        initial="hidden"
                        animate="visible"
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${
                            isMe
                              ? "bg-vgsdarkblue text-vgswhite rounded-tr-none"
                              : "bg-vgswhite text-vgsblack rounded-tl-none border border-vgsgray/20"
                          }`}
                        >
                          {m.file_url && (
                            <MediaMessage
                              fileUrl={m.file_url}
                              fileType={m.file_type}
                              fileName={m.file_name}
                              isMe={isMe}
                              onPreview={openPreview}
                            />
                          )}
                          {m.message && (
                            <p
                              className={`${m.file_url ? "mt-2" : ""} leading-relaxed`}
                            >
                              {m.message}
                            </p>
                          )}
                          <p
                            className={`text-[9px] mt-1 text-right opacity-60 ${isMe ? "text-vgswhite" : "text-vgsgray"}`}
                          >
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
                <div ref={scrollRef} />
              </div>

              {/* INPUT DE MENSAJE */}
              <footer className="p-2 border-t border-vgsgray/50 bg-vgswhite flex flex-col gap-1 relative">
                {showEmojiPicker && (
                  <motion.div
                    ref={emojiPickerRef}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute bottom-16 left-0 z-50 shadow-2xl"
                  >
                    <Suspense
                      fallback={
                        <LoadingFallback
                          title="Emojis"
                          message="Loading Emojis..."
                          height="350px"
                        />
                      }
                    >
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        autoFocusSearch={false}
                        emojiStyle="native"
                        lazyLoadEmojis={true}
                        skinTonesDisabled={true}
                        theme="light"
                        width="100%"
                        height={350}
                        searchPlaceholder="Type your emoji"
                        previewConfig={{ showPreview: false }}
                        categories={[
                          { name: "Favorites", category: "suggested" },
                          { name: "Faces", category: "smileys_people" },
                          { name: "Symbols", category: "symbols" },
                        ]}
                      />
                    </Suspense>
                  </motion.div>
                )}

                <AnimatePresence>
                  {selectedFile && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: 10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 10 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center bg-vgsgray/10 px-2 py-1 mb-1 rounded-lg border border-vgsgray/30">
                        <Badge
                          size="sm"
                          variant="gray"
                          icon={faPaperclip}
                          className="mr-auto"
                        >
                          {selectedFile.name} (
                          {(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                        </Badge>
                        <Button
                          onClick={() => setSelectedFile(null)}
                          variant="gray"
                          animation="pulse"
                          icon={faTimes}
                          className="bg-transparent! text-xs"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    fullWidth={false}
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <Button
                    icon={faPaperclip}
                    variant="red"
                    animation="shrink"
                    onClick={() => fileInputRef.current.click()}
                    className="text-xs"
                  />
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type Here..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="text-xs"
                      icon={faFaceGrinWink}
                      iconPosition="left"
                      onIconClick={(e) => {
                        e.preventDefault();
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="blue"
                    animation="shrink"
                    icon={faPaperPlane}
                    className="text-xs"
                  />
                </form>
              </footer>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center bg-vgsgray-50/10"
            >
              <Card className="shadow-none bg-transparent border-none text-center">
                <Badge
                  icon={faComments}
                  variant="none"
                  size="4xl"
                  className="flex flex-col text-xl text-vgsgray"
                >
                  Select one of the contacts to chat
                </Badge>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

export default ChatPanel;