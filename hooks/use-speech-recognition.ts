"use client"

import { useState, useCallback, useRef, useEffect } from "react"

const SpeechRecognition =
  typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("")
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const [shouldListen, setShouldListen] = useState(false)
  const [pausedForSpeaking, setPausedForSpeaking] = useState(false)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize recognition only once
  useEffect(() => {
    if (!SpeechRecognition || recognitionRef.current) return

    recognitionRef.current = new (SpeechRecognition as any)()
    const recognition = recognitionRef.current

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      console.log("Speech recognition started")
      setListening(true)
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " "
        }
      }
      if (finalTranscript) {
        console.log("Final transcript:", finalTranscript)
        setTranscript(finalTranscript.trim())
      }
    }

    recognition.onerror = (event: any) => {
      // "no-speech" is a normal occurrence when no speech is detected
      // It's not an actual error, so we handle it silently
      if (event.error === "no-speech") {
        console.log("No speech detected, will retry")
      } else if (event.error === "aborted") {
        // Aborted is also normal when we manually stop
        console.log("Recognition aborted")
      } else {
        // Only log actual errors like permission denied, network issues, etc.
        console.error("Speech recognition error:", event.error)
      }
      setListening(false)
    }

    recognition.onend = () => {
      console.log("Speech recognition ended")
      setListening(false)

      if (shouldListen && !pausedForSpeaking) {
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
        }
        // Increased delay to 1 second to prevent rapid restart cycles
        restartTimeoutRef.current = setTimeout(() => {
          try {
            if (shouldListen && !pausedForSpeaking && recognitionRef.current) {
              recognitionRef.current.start()
            }
          } catch (e) {
            // Silently handle restart errors (usually "already started")
            console.log("Recognition restart skipped")
          }
        }, 1000)
      }
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current)
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }
  }, [shouldListen, pausedForSpeaking])

  // Handle shouldListen changes
  useEffect(() => {
    if (!recognitionRef.current) return

        if (shouldListen && !listening && !pausedForSpeaking) {
      try {
        console.log("Starting recognition")
        recognitionRef.current.start()
      } catch (e) {
        // Silently handle "already started" errors
        console.log("Recognition already active")
      }
    } else if (!shouldListen && listening) {
      try {
        console.log("Stopping recognition")
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current)
        }
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore stop errors
      }
    }
  }, [shouldListen, listening, pausedForSpeaking])

  const startListening = useCallback(() => {
    setShouldListen(true)
  }, [])

  const stopListening = useCallback(() => {
    setShouldListen(false)
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
    }
  }, [])

  const pauseForSpeaking = useCallback(() => {
    console.log("Pausing recognition for speaking")
    setPausedForSpeaking(true)
    if (listening && recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore pause errors
      }
    }
  }, [listening])

  const resumeAfterSpeaking = useCallback(() => {
    console.log("Resuming recognition after speaking")
    setPausedForSpeaking(false)

    // Add delay to ensure audio has finished playing
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
    }
    restartTimeoutRef.current = setTimeout(() => {
      if (shouldListen && !listening && recognitionRef.current) {
        try {
          console.log("Restarting recognition after TTS")
          recognitionRef.current.start()
        } catch (e) {
          // Silently handle restart errors
          console.log("Recognition restart skipped")
        }
      }
    }, 1000)
  }, [shouldListen, listening])

  const resetTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  return {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    pauseForSpeaking,
    resumeAfterSpeaking,
  }
}
