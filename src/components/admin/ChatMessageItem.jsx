// src/components/admin/ChatMessageItem.jsx
import { memo } from "react";
import { motion } from "framer-motion";
import MediaMessage from "../common/MediaMessage";
import { popIn } from "../common/animations";

// URL detection regex capturing groups for splitting
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Parses message text and wraps URLs in secure, breakable anchor tags.
 */
const renderMessageContent = (text, isMe) => {
  if (!text) return null;
  const parts = text.split(URL_REGEX);

  return parts.map((part, index) => {
    // Non-global regex test to ensure stateless evaluation
    if (/^https?:\/\/[^\s]+$/i.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline transition-opacity hover:opacity-80 break-all wrap-anywhere ${
            isMe
              ? "text-vgswhite font-medium underline"
              : "text-vgsdarkblue font-semibold hover:text-vgsred"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const ChatMessageItem = memo(({ message, currentUserId, onPreview }) => {
  const isMe = Number(message.sender_id) === Number(currentUserId);
  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <motion.article
      variants={popIn}
      initial="hidden"
      animate="visible"
      className={`flex ${isMe ? "justify-end" : "justify-start"} w-full min-w-0`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] min-w-0 p-3 rounded-2xl shadow-sm text-sm wrap-break-word ${
          isMe
            ? "bg-vgsdarkblue text-vgswhite rounded-tr-none"
            : "bg-vgswhite text-vgsblack rounded-tl-none border border-vgsgray/20"
        }`}
      >
        {message.file_url && (
          <MediaMessage
            fileUrl={message.file_url}
            fileType={message.file_type}
            fileName={message.file_name}
            isMe={isMe}
            onPreview={onPreview}
          />
        )}
        {message.message && (
          <p
            className={`${message.file_url ? "mt-2" : ""} leading-relaxed wrap-break-word`}
          >
            {renderMessageContent(message.message, isMe)}
          </p>
        )}
        <p
          className={`text-[9px] mt-1 text-right opacity-60 ${
            isMe ? "text-vgswhite" : "text-vgsgray"
          }`}
        >
          {formattedTime}
        </p>
      </div>
    </motion.article>
  );
});

ChatMessageItem.displayName = "ChatMessageItem";

export default ChatMessageItem;
