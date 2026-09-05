import React from "react";

// Matches "@First", "@First Last" or "@First Middle Last" mentions inserted by
// the mention picker (each following word must start with an uppercase letter
// so ordinary sentences after "@" don't over-match).
const MENTION_REGEX = /@[A-Za-z][\w.'-]*(?: [A-Z][\w.'-]*){0,2}/g;

function renderPlainSegment(text: string, isMe: boolean | undefined, keyPrefix: string) {
  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi;

  // Regex to match phone numbers (7 to 15 digits, optionally starting with +)
  const phoneRegex = /(\+?[0-9]{7,15})/g;

  // Split content by whitespace or boundary to keep formatting intact
  const tokens = text.split(/(\s+)/);

  return tokens.map((token, index) => {
    if (token.match(urlRegex)) {
      return (
        <a
          key={`${keyPrefix}-${index}`}
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
          key={`${keyPrefix}-${index}`}
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
  });
}

export function renderMessageContent(text: string, isMe?: boolean) {
  if (!text) return "";

  // Split out @mentions first, then linkify the plain segments between them.
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderPlainSegment(text.slice(lastIndex, match.index), isMe, `seg-${lastIndex}`));
    }
    parts.push(
      <span
        key={`mention-${match.index}`}
        className={`font-semibold rounded px-0.5 ${
          isMe ? "text-yellow-200 bg-white/10" : "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
        }`}
      >
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(...renderPlainSegment(text.slice(lastIndex), isMe, `seg-${lastIndex}`));
  }

  return <>{parts}</>;
}
