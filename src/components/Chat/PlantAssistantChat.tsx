'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePlant } from '@/context/PlantContext';
import { plantAiService } from '@/services/aiProvider';
import {
  X,
  Send,
  Bot,
  User,
} from 'lucide-react';

const QUICK_SUGGESTIONS = [
  'Why are my leaves turning yellow?',
  'How often should I water this plant?',
  'Can I grow it in Maharashtra, India?',
  'Is this plant poisonous to cats or dogs?',
  'How do I propagate from stem cuttings?',
  'What soil mixture works best for this species?',
];

export const PlantAssistantChat: React.FC = () => {
  const {
    isChatOpen,
    setIsChatOpen,
    activeChatPlant,
    setActiveChatPlant,
    chatMessages,
    addChatMessage,
    userApiKey,
  } = usePlant();

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  if (!isChatOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isTyping) return;

    // Add user message
    addChatMessage({
      role: 'user',
      content: query.trim(),
    });

    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    try {
      const plantContext = activeChatPlant
        ? {
            name: activeChatPlant.commonName,
            scientificName: activeChatPlant.scientificName,
            details: `${activeChatPlant.category}, ${activeChatPlant.family}, Light: ${activeChatPlant.growingConditions?.sunlight}, Water: ${activeChatPlant.growingConditions?.water}`,
          }
        : undefined;

      const response = await plantAiService.askAssistant(
        [...chatMessages, { id: 'temp', role: 'user', content: query.trim(), timestamp: '' }],
        plantContext,
        userApiKey
      );

      addChatMessage({
        role: 'assistant',
        content: response.reply,
      });
    } catch {
      addChatMessage({
        role: 'assistant',
        content: 'I apologize, but I encountered an issue processing your botanical query. Please try again.',
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-0 sm:p-4 bg-[#183D32]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl h-[85vh] sm:h-[680px] bg-[#FFFFFF] sm:rounded-3xl rounded-t-3xl shadow-2xl border border-[#183D32]/15 overflow-hidden flex flex-col">
        {/* Header with Active Plant Banner */}
        <div className="px-5 py-3.5 bg-[#EDF4EB] border-b border-[#C8DBC4] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#183D32] flex items-center justify-center text-[#DCE8D9] shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif text-base font-bold text-[#183D32] truncate">
                  PlantLens AI Assistant
                </h3>
                <span className="w-2 h-2 rounded-full bg-[#15803D]" />
              </div>
              <p className="text-[11px] text-[#475850] truncate">
                Botanical specialist & Horticultural guidance
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 rounded-full hover:bg-[#DCE8D9] text-[#183D32] transition-colors"
            aria-label="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Plant Context Card if loaded */}
        {activeChatPlant ? (
          <div className="px-4 py-2 bg-[#F1EBDD] border-b border-[#E5DCB8] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeChatPlant.imageUrl}
                alt={activeChatPlant.commonName}
                className="w-7 h-7 rounded-lg object-cover shrink-0 border border-white"
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#73847B] block leading-none">
                  Active Subject
                </span>
                <span className="font-bold text-[#183D32] truncate block">
                  {activeChatPlant.commonName}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveChatPlant(null)}
              className="text-[11px] font-semibold text-[#73847B] hover:text-[#183D32]"
            >
              Clear Subject
            </button>
          </div>
        ) : (
          <div className="px-4 py-1.5 bg-[#F7F8F3] border-b border-[#183D32]/10 text-[11px] text-[#73847B] flex items-center justify-between">
            <span>General Botanical Care Mode</span>
            <span className="text-[10px]">Select any plant from scans to pin context</span>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {chatMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-[10px] ${
                    isUser ? 'bg-[#3A725D]' : 'bg-[#183D32]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[#DCE8D9]" />}
                </div>

                <div
                  className={`max-w-[82%] sm:max-w-[78%] rounded-2xl p-3.5 leading-relaxed space-y-1.5 shadow-2xs ${
                    isUser
                      ? 'bg-[#183D32] text-[#F7F8F3] rounded-tr-xs'
                      : 'bg-[#F7F8F3] text-[#1A2420] border border-[#183D32]/10 rounded-tl-xs'
                  }`}
                >
                  {/* Markdown formatted content */}
                  <div
                    className="whitespace-pre-wrap leading-relaxed space-y-1"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n\n/g, '<div class="h-2"></div>'),
                    }}
                  />
                  <div className={`text-[9px] text-right ${isUser ? 'text-white/60' : 'text-[#73847B]'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-[#73847B] text-xs pl-9">
              <div className="w-2 h-2 rounded-full bg-[#183D32] animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-[#183D32] animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-[#183D32] animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] ml-1">Analyzing botanical references...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-[#FFFFFF] border-t border-[#183D32]/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {QUICK_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(sug)}
              className="py-1 px-2.5 rounded-full bg-[#F7F8F3] hover:bg-[#EDF4EB] text-[11px] text-[#183D32] border border-[#183D32]/10 whitespace-nowrap transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Chat Input Box */}
        <div className="p-3 bg-[#FFFFFF] border-t border-[#183D32]/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything about this plant (watering, propagation, climate, toxicity)..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#183D32]/20 bg-[#F7F8F3] text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#183D32]"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="p-2.5 rounded-xl bg-[#183D32] text-[#F7F8F3] hover:bg-[#122E26] disabled:opacity-40 transition-all shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
