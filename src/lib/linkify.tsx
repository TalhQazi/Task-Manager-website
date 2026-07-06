import React from "react";

export function renderMessageContent(text: string, isMe?: boolean) {
  if (!text) return "";

  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  
  // Regex to match phone numbers (7 to 15 digits, optionally starting with +)
  const phoneRegex = /(\+?[0-9]{7,15})/g;

  // Split content by whitespace or boundary to keep formatting intact
  const tokens = text.split(/(\s+)/);

  return (
    <>
      {tokens.map((token, index) => {
        if (token.match(urlRegex)) {
          return (
            <a
              key={index}
              href={token}
              target="_blank"
              rel="noopener noreferrer"
              className={`underline break-all hover:opacity-80 font-bold ${
                isMe ? "text-blue-200 hover:text-white" : "text-blue-400 hover:text-blue-600"
              }`}
            >
              {token}
            </a>
          );
        }

        if (token.match(phoneRegex)) {
          return (
            <a
              key={index}
              href={`tel:${token}`}
              className={`underline hover:opacity-80 font-semibold ${
                isMe ? "text-emerald-200 hover:text-white" : "text-emerald-400 hover:text-emerald-600"
              }`}
            >
              {token}
            </a>
          );
        }

        return token;
      })}
    </>
  );
}
