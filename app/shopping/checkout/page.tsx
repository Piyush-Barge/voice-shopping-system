"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

export default function CheckoutPage() {
  const router = useRouter()
  const [billingData, setBillingData] = useState<any>(null)
  const [lastCommand, setLastCommand] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const { transcript, listening, startListening } = useSpeechRecognition()
  const { speak, isSpeaking } = useTextToSpeech()
  const listeningStartedRef = useRef(false)

  useEffect(() => {
    const data = localStorage.getItem("billing-data")
    if (data) {
      setBillingData(JSON.parse(data))
    }
  }, [])

  useEffect(() => {
    if (billingData && !listeningStartedRef.current) {
      listeningStartedRef.current = true
      const timer = setTimeout(() => {
        const itemDetails = billingData.items
          .map(
            (item: any) =>
              `${item.quantity} ${item.name} from ${item.company}, expiry date ${item.expiryDate}, ₹${item.price} each`,
          )
          .join(". ")

        speak(
          `Your bill is ready. ${itemDetails}. Total items: ${billingData.itemCount}. Total amount is ₹${billingData.total}. Say confirm to complete purchase or cancel to go back.`,
        )
        setTimeout(() => {
          startListening()
        }, 2000)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [billingData, speak, startListening])

  useEffect(() => {
    if (!isProcessing && transcript && transcript.trim() && !orderComplete) {
      setLastCommand(transcript)
      processCommand(transcript.toLowerCase())
      setIsProcessing(true)

      setTimeout(() => {
        setIsProcessing(false)
        setTimeout(() => {
          startListening()
        }, 500)
      }, 2000)
    }
  }, [transcript, isProcessing, startListening, orderComplete])

  const processCommand = (command: string) => {
    if (command.includes("confirm") || command.includes("yes") || command.includes("pay")) {
      setOrderComplete(true)
      const itemDetails = billingData.items
        .map((item: any) => `${item.quantity} ${item.name} from ${item.company}`)
        .join(", ")

      speak(
        `Payment successful! Your order has been confirmed. Items: ${itemDetails}. Total amount paid: ₹${billingData.total}. Thank you for shopping with us. Your order will be delivered to you shortly.`,
      )

      localStorage.removeItem("shopping-cart")
      localStorage.removeItem("billing-data")

      setTimeout(() => {
        router.push("/shopping")
      }, 4000)
      return
    }

    if (command.includes("cancel") || command.includes("back") || command.includes("no")) {
      speak("Order cancelled. Going back to shopping.")
      setTimeout(() => {
        router.push("/shopping")
      }, 1500)
      return
    }

    speak("Say confirm to complete the purchase or cancel to go back.")
  }

  if (!billingData) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <p className="text-lg text-slate-600">Loading checkout...</p>
      </main>
    )
  }

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex flex-col items-center gap-8">
          {/* Status Indicator */}
          <div className="flex flex-col items-center gap-4 w-full">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                orderComplete
                  ? "bg-green-500 shadow-lg shadow-green-500"
                  : listening
                    ? "bg-green-500 animate-pulse shadow-lg shadow-green-500"
                    : isSpeaking
                      ? "bg-blue-500 animate-pulse shadow-lg shadow-blue-500"
                      : "bg-slate-400"
              }`}
            >
              {orderComplete ? (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              ) : listening ? (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                </svg>
              ) : isSpeaking ? (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              )}
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {orderComplete ? "Order Confirmed!" : listening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready"}
              </p>
              {lastCommand && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Last command: "{lastCommand}"</p>
              )}
            </div>
          </div>

          {/* Bill Summary */}
          <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 text-center">Order Summary</h1>

            <div className="space-y-4 mb-8">
              {billingData.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex flex-col p-4 bg-slate-100 dark:bg-slate-700 rounded border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white capitalize">{item.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Company: {item.company} | Expiry: {item.expiryDate}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{item.price * item.quantity}</p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Qty: {item.quantity} × ₹{item.price}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-slate-200 dark:border-slate-600 pt-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-slate-600 dark:text-slate-400">Items Count:</p>
                <p className="font-semibold text-slate-900 dark:text-white">{billingData.itemCount}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">Total Amount:</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">₹{billingData.total}</p>
              </div>
            </div>
          </div>

          {/* Help Info */}
          {!orderComplete && (
            <div className="w-full bg-green-50 dark:bg-slate-700 p-4 rounded-lg border border-green-200 dark:border-slate-600">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Say:</span> "Confirm" to complete purchase or "Cancel" to go back
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
