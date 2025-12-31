"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"

export default function Home() {
  const router = useRouter()
  const { speak, isSpeaking } = useTextToSpeech()
  const { transcript, listening, startListening } = useSpeechRecognition()
  const [hasGreeted, setHasGreeted] = useState(false)
  const [hasStartedListening, setHasStartedListening] = useState(false)

  // Initial greeting
  useEffect(() => {
    if (!hasGreeted) {
      const timer = setTimeout(() => {
        speak("Welcome to Smart Shopping Assistant. Say start shopping to begin.")
        setHasGreeted(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [hasGreeted, speak])

  useEffect(() => {
    if (hasGreeted && !hasStartedListening && !isSpeaking && !listening) {
      // Wait 2 seconds after speaking ends to ensure audio is clear
      const timer = setTimeout(() => {
        console.log("Starting to listen for start command")
        startListening()
        setHasStartedListening(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [hasGreeted, hasStartedListening, isSpeaking, listening, startListening])

  useEffect(() => {
    if (transcript) {
      console.log("Transcript received:", transcript)
      const lower = transcript
        .toLowerCase()
        .trim()
        .replace(/[.,!?;:]/g, "")

      if (lower.includes("start shopping") || lower.includes("start") || lower.includes("begin")) {
        console.log("Navigating to shopping page")
        speak("Starting shopping assistant")
        setTimeout(() => {
          router.push("/shopping")
        }, 1000)
      } else if (lower.length > 0) {
        console.log("Command not recognized, waiting for 'start shopping'")
        // Don't restart listening immediately, wait a bit
        setTimeout(() => {
          if (!isSpeaking) {
            startListening()
          }
        }, 1500)
      }
    }
  }, [transcript, startListening, speak, router, isSpeaking])

  return (
    <main className="w-full h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">Smart Shopping</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">Voice-Guided Shopping Assistant</p>
        </div>

        <div className="space-y-6 mt-12">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-md border border-slate-200 dark:border-slate-700">
            <p className="text-slate-700 dark:text-slate-300 mb-2 font-semibold">
              {isSpeaking ? "Speaking..." : listening ? "Listening..." : "Ready"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {transcript ? `You said: ${transcript}` : "Say 'start shopping' to begin"}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
