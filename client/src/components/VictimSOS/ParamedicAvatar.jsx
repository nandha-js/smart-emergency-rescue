import { useState, useEffect, useRef } from 'react'
import { postTriageResponse } from '../../services/api'
import useVoiceRecognition from '../../hooks/useVoiceRecognition'

export default function ParamedicAvatar({ alertId, onResolve }) {
  const [messages, setMessages] = useState([
    { role: 'paramedic', text: 'Initializing virtual responder Aria... help is en route.' },
  ])
  const [inputText, setInputText] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [triageLoading, setTriageLoading] = useState(false)
  const chatEndRef = useRef(null)

  const {
    transcript,
    isListening,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition()

  // Speak text via SpeechSynthesis with Lip-Sync animations
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return

    window.speechSynthesis.cancel() // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text)

    // Select a pleasant voice if available
    const voices = window.speechSynthesis.getVoices()
    const englishVoice = voices.find((v) => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find((v) => v.lang.startsWith('en'))
    if (englishVoice) {
      utterance.voice = englishVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  // Speak initial greeting when mounted
  useEffect(() => {
    const greeting = 'Hello, I am Aria. I see your SOS signal is active and rescuers have been dispatched. Are you in a safe environment right now?'
    speakText(greeting)
    setMessages([{ role: 'paramedic', text: greeting }])
  }, [])

  // Auto-scroll chat log
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Sync voice recognition to typing text box
  useEffect(() => {
    if (transcript) {
      setInputText(transcript)
    }
  }, [transcript])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!inputText.trim() || triageLoading) return

    const userText = inputText
    setInputText('')
    resetTranscript()
    stopListening()

    // Add user response to chat feed
    setMessages((prev) => [...prev, { role: 'victim', text: userText }])
    setTriageLoading(true)

    try {
      const response = await postTriageResponse(alertId, userText)
      if (response.data.success) {
        const reply = response.data.responseText
        setMessages((prev) => [...prev, { role: 'paramedic', text: reply }])
        speakText(reply)
      }
    } catch (err) {
      console.error('Failed to post triage logs:', err)
      const errReply = 'Satellite connection interrupted. Keep calm. Rescuers are still tracking your location.'
      setMessages((prev) => [...prev, { role: 'paramedic', text: errReply }])
      speakText(errReply)
    } finally {
      setTriageLoading(false)
    }
  }

  return (
    <div className="glass-card triage-avatar-card" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem', marginTop: '1.5rem' }}>
      
      {/* 3D-Effect Vector Lip-Sync Avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div
          className={`avatar-sphere ${isSpeaking ? 'speaking' : ''}`}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--color-info) 0%, #1e40af 100%)',
            boxShadow: isSpeaking ? '0 0 30px rgba(59, 130, 246, 0.6)' : '0 0 15px rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            transition: 'box-shadow 0.3s ease',
          }}
        >
          {/* Avatar Face Container */}
          <div style={{ width: '60px', height: '60px', position: 'relative' }}>
            {/* Eyes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'absolute', top: '15px' }}>
              <span className="avatar-eye" style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }} />
              <span className="avatar-eye" style={{ width: '8px', height: '8px', background: '#fff', borderRadius: '50%' }} />
            </div>

            {/* Pulsing Mouth (Speech Animation) */}
            <div
              className={`avatar-mouth ${isSpeaking ? 'speaking' : ''}`}
              style={{
                width: isSpeaking ? '24px' : '16px',
                height: isSpeaking ? '12px' : '3px',
                background: '#fff',
                borderRadius: isSpeaking ? '50%' : '2px',
                position: 'absolute',
                bottom: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                transition: 'all 0.15s ease',
              }}
            />
          </div>

          {/* Pulse Waves Overlay */}
          {isSpeaking && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '2px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '50%',
                animation: 'pulse-ring 1.5s infinite',
              }}
            />
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-info)', fontWeight: 700, marginTop: '0.75rem', letterSpacing: '0.1em', uppercase: 'true' }}>
          ARIA — VIRTUAL PARAMEDIC
        </span>
      </div>

      {/* Chat Logs Area */}
      <div
        className="chat-log-box"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          height: '180px',
          overflowY: 'auto',
          padding: '0.75rem',
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.role === 'paramedic' ? 'flex-start' : 'flex-end',
              background: m.role === 'paramedic' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.08)',
              border: m.role === 'paramedic' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.5rem 0.75rem',
              maxWidth: '85%',
              lineHeight: '1.4',
            }}
          >
            <strong>{m.role === 'paramedic' ? 'Aria' : 'You'}:</strong> {m.text}
          </div>
        ))}
        {triageLoading && (
          <div style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.75rem' }}>
            Aria is evaluating your condition...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Inputs Section */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isListening ? 'Listening... speak or type here' : 'Speak to Aria or type a response...'}
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '0.6rem',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />

        {voiceSupported && (
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`btn ${isListening ? 'btn-danger' : 'btn-outline'}`}
            style={{ padding: '0.6rem' }}
            title="Toggle Mic Input"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          </button>
        )}

        <button type="submit" className="btn btn-success" style={{ padding: '0.6rem 1rem' }} disabled={triageLoading}>
          Send
        </button>
      </form>
    </div>
  )
}
