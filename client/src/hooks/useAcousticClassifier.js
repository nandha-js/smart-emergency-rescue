import { useState, useEffect, useRef } from 'react'

export default function useAcousticClassifier({ onEmergencyDetected }) {
  const [isClassifying, setIsClassifying] = useState(false)
  const [detectedPattern, setDetectedPattern] = useState(null)
  
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const screamCountRef = useRef(0)

  const startClassification = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContextClass()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser

      setIsClassifying(true)
      setDetectedPattern(null)
      screamCountRef.current = 0
      analyzeAudio()
    } catch (err) {
      console.error('[Acoustic Classifier] Microphones access blocked:', err)
    }
  }

  const stopClassification = () => {
    setIsClassifying(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }

  const analyzeAudio = () => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calculate volume/energy
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i]
    }
    const averageVolume = sum / bufferLength

    // Frequency bands
    const lowFreq = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 // Bass / Impact
    const midHighFreq = dataArray.slice(30, 80).reduce((a, b) => a + b, 0) / 50 // Screaming range (1KHz - 3.5KHz)
    const superHighFreq = dataArray.slice(100, 200).reduce((a, b) => a + b, 0) / 100 // Glass breaking (>4KHz)

    // 1. Crash/Impact signature: Sudden, extremely loud wideband energy spike
    if (averageVolume > 200 && lowFreq > 220) {
      setDetectedPattern('Vehicle Collision (Impact)')
      onEmergencyDetected('Acoustic Edge AI: Car crash impact profile detected.')
      stopClassification()
      return
    }

    // 2. Glass breaking signature: High amplitude at very high frequencies
    if (superHighFreq > 160 && averageVolume > 140) {
      setDetectedPattern('Glass Shatter (Breaking)')
      onEmergencyDetected('Acoustic Edge AI: Glass break frequency signature detected.')
      stopClassification()
      return
    }

    // 3. Sustained Scream signature: High energy in mid-high frequencies sustained over multiple frames
    if (midHighFreq > 150) {
      screamCountRef.current += 1
      if (screamCountRef.current > 35) { // ~1.5 seconds sustained
        setDetectedPattern('Distress Scream (Sustained)')
        onEmergencyDetected('Acoustic Edge AI: Continuous human distress scream detected.')
        stopClassification()
        return
      }
    } else {
      screamCountRef.current = Math.max(0, screamCountRef.current - 1)
    }

    animationFrameRef.current = requestAnimationFrame(analyzeAudio)
  }

  useEffect(() => {
    return () => {
      stopClassification()
    }
  }, [])

  return {
    isClassifying,
    startClassification,
    stopClassification,
    detectedPattern,
  }
}
