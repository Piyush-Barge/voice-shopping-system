"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  aisle: string
  expiryDate?: string
  company?: string
}

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [lastCommand, setLastCommand] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { transcript, listening, startListening } = useSpeechRecognition()
  const { speak, isSpeaking } = useTextToSpeech()
  const listeningStartedRef = useRef(false)

  useEffect(() => {
    const cartData = localStorage.getItem("shopping-cart")
    if (cartData) {
      setCart(JSON.parse(cartData))
    }
  }, [])

  useEffect(() => {
    if (!listeningStartedRef.current && cart.length > 0) {
      listeningStartedRef.current = true
      const timer = setTimeout(() => {
        const itemList = cart.map((item) => `${item.quantity} ${item.name} from ${item.company}`).join(", ")
        speak(`Your cart has ${itemList}. Say checkout to proceed or back to continue shopping.`)
        setTimeout(() => {
          startListening()
        }, 2000)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [cart, speak, startListening])

  useEffect(() => {
    if (!isProcessing && transcript && transcript.trim()) {
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
  }, [transcript, isProcessing, startListening])

  const processCommand = (command: string) => {
    if (command.includes("checkout") || command.includes("bill") || command.includes("pay")) {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
      const billData = {
        items: cart,
        total: total,
        itemCount: itemCount,
        billSummary: cart.map((item) => `${item.quantity} ${item.name}`).join(", "),
      }

      localStorage.setItem("billing-data", JSON.stringify(billData))

      speak(`Processing checkout. You have ${itemCount} items totaling ₹${total}.`)
      setTimeout(() => {
        router.push("/shopping/checkout")
      }, 2000)
      return
    }

    if (command.includes("back") || command.includes("shopping") || command.includes("continue")) {
      speak("Going back to shopping.")
      setTimeout(() => {
        router.push("/shopping")
      }, 1000)
      return
    }

    if (command.includes("remove")) {
      speak("You can remove items by saying remove and the product name, like remove milk.")
      return
    }

    speak("Say checkout to proceed with payment or back to continue shopping.")
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex flex-col items-center gap-8">
          {/* Status Indicator */}
          <div className="flex flex-col items-center gap-4 w-full">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                listening
                  ? "bg-green-500 animate-pulse shadow-lg shadow-green-500"
                  : isSpeaking
                    ? "bg-blue-500 animate-pulse shadow-lg shadow-blue-500"
                    : "bg-slate-400"
              }`}
            >
              {listening ? (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                </svg>
              ) : isSpeaking ? (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.5 12c0-.23-.02-.46-.05-.68l1.86-1.41c.4-.3.51-.84.12-1.35l-1.42-2.45c-.22-.37-.66-.52-1.08-.35L17.9 5.8c-.25-.2-.56-.3-.88-.3-.05 0-.1 0-.15.01L15 2.05c-.4-.3-.94-.3-1.34 0l-2 1.41c-.27-.03-.52-.05-.77-.05-2.64 0-4.96 1.59-6.02 3.86l-2.36.01c-.5 0-.93.38-.93.87v1.85c0 .49.43.87.93.87h.08l.47 2.04c.23 1.02.76 1.94 1.5 2.66l-.5 2.18c-.12.51.06 1.04.47 1.38l1.5 1.32c.4.35 1 .35 1.4 0l.62-.55.62.55c.4.35 1 .35 1.4 0l1.5-1.32c.41-.34.59-.87.47-1.38l-.5-2.18c.74-.72 1.27-1.64 1.5-2.66l.47-2.04h.08c.5 0 .93-.38.93-.87V6.67c0-.49-.43-.87-.93-.87h-2.36c-1.06-2.27-3.38-3.86-6.02-3.86z" />
                </svg>
              )}
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {listening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready"}
              </p>
              {lastCommand && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Last command: "{lastCommand}"</p>
              )}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="w-full bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Your Shopping Cart</h2>

            {cart.length > 0 ? (
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-700 rounded"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white capitalize">{item.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {item.company && `${item.company} - `}Qty: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 py-4">Your cart is empty.</p>
            )}

            <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white">Total:</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{cartTotal}</p>
              </div>
            </div>
          </div>

          {/* Help Info */}
          <div className="w-full bg-blue-50 dark:bg-slate-700 p-4 rounded-lg border border-blue-200 dark:border-slate-600">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Say:</span> "Checkout" to proceed to payment or "Back" to continue
              shopping
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
