import { useEffect, useRef, useState } from 'react'
import {
  Brain,
  Loader2,
  MoreVertical,
  Paperclip,
  Send,
  Sparkles,
} from 'lucide-react'
import { sendChatMessage } from '../lib/api'

const USER_AVATAR_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBRGZ3C8cUoG6uaIq8GzZgzbSbZ7er9rJm7J97edjqFCw24k3nwVx8QocodNQ4ldkx8ZLxqbyVzKaHKtZ40FlPstaSd0TZRhsRq1H0fsYPj9cxVOD-aEYx91YEUGgVuTwgpxpLljdqk5LzEucz6gma6S8tyShlWkC7oF2vKyzmzNeipcYiWzJU0AUrkHwgIaKpo889tBXaepEYh3QZ6wyfzKe20TnXOxwukjlLSEoTjVinkIv09u7-2LLrXaQC6HZlnClOCSEKFT_g'

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hello! I have full access to your medical records and clinical profile. How can I assist you with your health data today?',
}

export default function Chat() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const messagesRef = useRef(null)

  useEffect(() => {
    const container = messagesRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isTyping])

  async function handleSend(e) {
    e.preventDefault()
    const trimmed = message.trim()
    if (!trimmed || isTyping) return

    setError(null)
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setMessage('')
    setIsTyping(true)

    try {
      const res = await sendChatMessage(trimmed)
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
        },
      ])
    } catch (err) {
      const status = err.status
      if (status === 429) {
        setError(
          "You've reached the AI request limit. Please wait a few minutes before sending more messages.",
        )
      } else if (status === 503) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content:
              'AI assistant is temporarily unavailable. Your health records are still saved safely.',
          },
        ])
      } else {
        setError(err.message || 'Failed to get a response. Please try again.')
      }
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-margin-mobile h-[calc(100vh-80px)]">
      <div className="py-lg border-b border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="font-headline-md text-[18px] text-on-surface font-bold leading-tight">
              HealthLens Assistant
            </h2>
            <div className="flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-on-surface-variant text-[12px]">
                Context-aware: Connected to your Health Vault
              </p>
            </div>
          </div>
        </div>
        <button type="button" className="text-outline">
          <MoreVertical />
        </button>
      </div>

      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto py-lg space-y-lg chat-scroll"
      >
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <div
              key={msg.id}
              className="flex flex-row-reverse gap-md items-start max-w-[90%] ml-auto"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex-shrink-0 flex items-center justify-center text-primary mt-1 overflow-hidden">
                <img alt="User" className="w-full h-full object-cover" src={USER_AVATAR_SRC} />
              </div>
              <div className="bg-primary-container p-lg rounded-2xl rounded-tr-sm shadow-md text-on-primary">
                <p className="text-body-md leading-relaxed font-body-md whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex gap-md items-start max-w-[90%]">
              <div className="w-8 h-8 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center text-on-primary-container mt-1">
                <Sparkles size={18} />
              </div>
              <div className="bg-white p-lg rounded-2xl rounded-tl-sm shadow-ambient border border-outline-variant/10">
                <p className="text-body-md text-on-surface leading-relaxed font-body-md whitespace-pre-wrap">
                  {msg.content}
                </p>
              </div>
            </div>
          ),
        )}

        {isTyping && (
          <div className="flex gap-md items-start max-w-[90%]">
            <div className="w-8 h-8 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center text-on-primary-container mt-1">
              <Sparkles size={18} />
            </div>
            <div className="bg-white p-lg rounded-2xl rounded-tl-sm shadow-ambient border border-outline-variant/10 flex items-center gap-2">
              <Loader2 className="animate-spin text-primary" size={18} />
              <span className="text-body-md text-on-surface-variant">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-sm text-error bg-error-container/30 rounded-xl py-2 px-4">
            {error}
          </p>
        )}
      </div>

      <div className="py-lg relative">
        <form
          onSubmit={handleSend}
          className="bg-white rounded-full p-2 pr-2 flex items-center shadow-ambient border border-outline-variant/20"
        >
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center text-outline-variant hover:text-primary transition-colors"
          >
            <Paperclip />
          </button>
          <input
            className="flex-1 border-none focus:ring-0 bg-transparent text-body-md font-body-md px-md text-on-surface placeholder-outline-variant"
            placeholder="Ask about your health history..."
            type="text"
            maxLength={1500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping}
            className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:shadow-lg active:scale-90 transition-all disabled:opacity-60"
          >
            <Send />
          </button>
        </form>
        <p className="text-center text-[11px] text-outline mt-sm">
          HealthLens AI can make mistakes. Verify critical medical information with your physician.
        </p>
      </div>
    </div>
  )
}
