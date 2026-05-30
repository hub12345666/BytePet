import type { ChatMessage, ChatSession } from "../../types/domain";

export function filterSessionsByCharacter(sessions: ChatSession[], characterId: string): ChatSession[] {
  return sessions.filter((session) => session.characterId === characterId);
}

export function filterMessagesBySession(messages: ChatMessage[], sessionId: string, characterId: string): ChatMessage[] {
  return messages.filter((message) => message.sessionId === sessionId && message.characterId === characterId);
}

