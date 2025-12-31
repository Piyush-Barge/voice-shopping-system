"use client"

import { useState, useCallback } from "react"

export function useTextToSpeech(onSpeakingChange?: (speaking: boolean) => void) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined") return

      // Cancel any previous speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onstart = () => {
        console.log("[v0] TTS started")
        setIsSpeaking(true)
        onSpeakingChange?.(true)
      }

      utterance.onend = () => {
        console.log("[v0] TTS ended")
        setIsSpeaking(false)
        onSpeakingChange?.(false)
      }

      utterance.onerror = () => {
        console.log("[v0] TTS error")
        setIsSpeaking(false)
        onSpeakingChange?.(false)
      }

      window.speechSynthesis.speak(utterance)
    },
    [onSpeakingChange],
  )

  return { speak, isSpeaking }
}
