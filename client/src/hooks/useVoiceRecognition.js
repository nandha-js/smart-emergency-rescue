import { useState, useEffect, useRef, useCallback } from 'react'

const KEYWORDS = [
  'help',
  'emergency',
  'sos',
  'accident',
  'save me',
  'please help',
  'ambulance',
  'fire',
  'attack',
]

export default function useVoiceRecognition() {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [detectedKeyword, setDetectedKeyword] = useState(null)

  const recognitionRef = useRef(null)
  const isListeningRef = useRef(false)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let interim = ''
        let final = ''

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            final += result[0].transcript + ' '
          } else {
            interim += result[0].transcript
          }
        }

        if (final) {
          setTranscript((prev) => prev + final)
          // Check for keywords
          const lowerFinal = final.toLowerCase()
          for (const keyword of KEYWORDS) {
            if (lowerFinal.includes(keyword)) {
              setDetectedKeyword(keyword)
              break
            }
          }
        }
        setInterimTranscript(interim)
      }

      recognition.onerror = (event) => {
        console.error('[Speech] Error:', event.error)
        if (event.error === 'not-allowed') {
          setIsListening(false)
          isListeningRef.current = false
        }
      }

      recognition.onend = () => {
        // Auto-restart if still supposed to be listening
        if (isListeningRef.current) {
          try {
            recognition.start()
          } catch (e) {
            // Already started
          }
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        isListeningRef.current = false
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Not started
        }
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        isListeningRef.current = true
      } catch (e) {
        console.error('[Speech] Start error:', e)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      isListeningRef.current = false
      setIsListening(false)
      setInterimTranscript('')
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Not started
      }
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setDetectedKeyword(null)
  }, [])

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    detectedKeyword,
    resetTranscript,
  }
}
