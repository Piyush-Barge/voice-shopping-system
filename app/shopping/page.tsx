"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  aisle: string
}

interface Product {
  id: string
  name: string
  price: number
  aisle: string
  category: string
  expiryDate: string
  company: string
  location: string
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "rice",
    price: 150,
    aisle: "aisle 1",
    category: "grains",
    expiryDate: "2025-12-31",
    company: "Daawat",
    location: "2 steps ahead on your left, shelf number 3",
  },
  {
    id: "2",
    name: "bread",
    price: 40,
    aisle: "aisle 2",
    category: "bakery",
    expiryDate: "2025-11-15",
    company: "Britannia",
    location: "Take right, then 1 step forward, on the top shelf",
  },
  {
    id: "3",
    name: "milk",
    price: 60,
    aisle: "aisle 3",
    category: "dairy",
    expiryDate: "2025-11-10",
    company: "Amul",
    location: "3 steps ahead on your right, bottom shelf",
  },
  {
    id: "4",
    name: "sugar",
    price: 50,
    aisle: "aisle 1",
    category: "pantry",
    expiryDate: "2026-12-31",
    company: "Madhur",
    location: "1 step ahead on your left, middle shelf",
  },
  {
    id: "5",
    name: "salt",
    price: 20,
    aisle: "aisle 1",
    category: "pantry",
    expiryDate: "2026-12-31",
    company: "Tata",
    location: "2 steps ahead on your right, shelf number 2",
  },
  {
    id: "6",
    name: "butter",
    price: 300,
    aisle: "aisle 3",
    category: "dairy",
    expiryDate: "2025-12-25",
    company: "Amul",
    location: "4 steps ahead on your left, in the refrigerator section",
  },
  {
    id: "7",
    name: "eggs",
    price: 80,
    aisle: "aisle 3",
    category: "dairy",
    expiryDate: "2025-11-08",
    company: "Keggs",
    location: "3 steps ahead on your right, refrigerator bottom shelf",
  },
  {
    id: "8",
    name: "oil",
    price: 200,
    aisle: "aisle 4",
    category: "oils",
    expiryDate: "2026-06-30",
    company: "Fortune",
    location: "Take left, 2 steps forward, middle shelf on your right",
  },
  {
    id: "9",
    name: "flour",
    price: 100,
    aisle: "aisle 2",
    category: "grains",
    expiryDate: "2026-01-31",
    company: "Aashirvaad",
    location: "1 step ahead on your left, top shelf",
  },
  {
    id: "10",
    name: "apple",
    price: 120,
    aisle: "aisle 5",
    category: "fruits",
    expiryDate: "2025-11-20",
    company: "Fresh Farms",
    location: "Take right, 3 steps forward, in the fruit basket on your left",
  },
]

export default function ShoppingPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [lastCommand, setLastCommand] = useState("")
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null)
  const [waitingForProductName, setWaitingForProductName] = useState(false)
  const {
    transcript,
    listening,
    startListening,
    stopListening,
    resetTranscript,
    pauseForSpeaking,
    resumeAfterSpeaking,
  } = useSpeechRecognition()

  const handleSpeakingChange = useCallback(
    (speaking: boolean) => {
      if (speaking) {
        pauseForSpeaking()
      } else {
        resumeAfterSpeaking()
      }
    },
    [pauseForSpeaking, resumeAfterSpeaking],
  )

  const { speak, isSpeaking } = useTextToSpeech(handleSpeakingChange)
  const processedRef = useRef(false)

  useEffect(() => {
    startListening()
    speak(
      "Welcome to voice shopping. I will read all details to you. You can say: Find rice, Add to cart, Next product, Show cart, Checkout, or Help.",
    )
    return () => stopListening()
  }, [])

  useEffect(() => {
    if (!transcript || transcript === lastCommand) return

    console.log("[v0] Processing transcript:", transcript)
    setLastCommand(transcript)
    processCommand(transcript.toLowerCase())
    resetTranscript()
  }, [transcript])

  const speakProductDetails = (product: Product) => {
    const details = `${product.name}, by ${product.company}. Price: ${product.price} rupees. Expiry date: ${product.expiryDate}. Category: ${product.category}. Location: ${product.location}. Say add to cart or next product.`
    speak(details)
  }

  const findProduct = (query: string): Product | undefined => {
    const normalized = query.trim().toLowerCase()
    return PRODUCTS.find((p) => normalized.includes(p.name) || p.name.includes(normalized))
  }

  const processCommand = (command: string) => {
    console.log("[v0] Command received:", command)
    const lowerCommand = command.toLowerCase()

    const normalized = lowerCommand
      .replace(/[.,!?]/g, "")
      .replace(/\bcard\b/g, "cart") // "show card" → "show cart"
      .replace(/\bcheck\s*out\b/g, "checkout") // "check out" → "checkout"
      .replace(/\bcart\s*on\b/g, "carton") // Fix common mishearing
      .trim()

    console.log("[v0] Normalized command:", normalized)

    if (waitingForProductName) {
      setWaitingForProductName(false)
      const product = findProduct(command)
      if (product) {
        console.log("[v0] Found product:", product.id)
        setCurrentProduct(product)
        speakProductDetails(product)
      } else {
        speak("Sorry, product not found. Please say another product name or say help for commands.")
        setWaitingForProductName(true)
      }
      return
    }

    if (normalized.includes("next")) {
      setWaitingForProductName(true)
      speak("What product would you like to find? Please say the product name.")
      return
    }

    if (normalized.includes("what") && (normalized.includes("product") || normalized.includes("current"))) {
      if (currentProduct) {
        speakProductDetails(currentProduct)
        return
      } else {
        speak("No product selected. Say find rice to start.")
        return
      }
    }

    if (normalized.includes("add") && !normalized.includes("find")) {
      if (currentProduct && !findProduct(command)) {
        setCart((prev) => {
          const existing = prev.find((item) => item.id === currentProduct.id)
          const updatedCart = existing
            ? prev.map((item) => (item.id === currentProduct.id ? { ...item, quantity: item.quantity + 1 } : item))
            : [...prev, { ...currentProduct, quantity: 1 }]

          speak(`${currentProduct.name} added to cart. Say next product to find another item.`)
          return updatedCart
        })
        return
      }

      const product = findProduct(command)
      if (product) {
        setCart((prev) => {
          const existing = prev.find((item) => item.id === product.id)
          const updatedCart = existing
            ? prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
            : [...prev, { ...product, quantity: 1 }]

          const msg = existing
            ? `Added another ${product.name}. You now have ${existing.quantity + 1}.`
            : `${product.name} added to cart. Price is ${product.price} rupees.`
          speak(msg)
          return updatedCart
        })
      } else {
        speak("Product not found. Please try again.")
      }
      return
    }

    if (normalized.includes("exit") || normalized.includes("home") || normalized.includes("goodbye")) {
      speak("Thank you for shopping. Going back to home.")
      stopListening()
      setTimeout(() => router.push("/"), 1500)
      return
    }

    if (normalized.includes("find") || normalized.includes("where")) {
      const product = findProduct(command)
      if (product) {
        console.log("[v0] Found product:", product.id)
        setCurrentProduct(product)
        speakProductDetails(product)
      } else {
        speak("Sorry, product not found. Please say another product name.")
      }
      return
    }

    if (normalized.includes("remove")) {
      const product = findProduct(command)
      if (product) {
        const itemInCart = cart.find((item) => item.id === product.id)
        if (itemInCart) {
          if (itemInCart.quantity > 1) {
            speak(`Removed one ${product.name}. You have ${itemInCart.quantity - 1} left.`)
            setCart((prev) =>
              prev
                .map((item) => (item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item))
                .filter((item) => item.quantity > 0),
            )
          } else {
            speak(`${product.name} removed from cart.`)
            setCart((prev) => prev.filter((item) => item.id !== product.id))
          }
        } else {
          speak("Product not in your cart.")
        }
      } else {
        speak("Product not found.")
      }
      return
    }

    if (
      (normalized.includes("show") || normalized.includes("view") || normalized.includes("my")) &&
      (normalized.includes("cart") || normalized.includes("items") || normalized.includes("basket"))
    ) {
      console.log("[v0] Show cart command triggered")
      if (cart.length === 0) {
        speak("Your cart is empty.")
      } else {
        const items = cart.map((item) => `${item.quantity} ${item.name} at ${item.price} rupees each`).join(", ")
        speak(`Your cart contains: ${items}.`)
      }
      return
    }

    if (normalized.includes("total") || normalized.includes("how much") || normalized.includes("price")) {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      if (total === 0) {
        speak("Your cart is empty. Total is zero rupees.")
      } else {
        speak(`Your total is ${total} rupees.`)
      }
      return
    }

    if (
      normalized.includes("checkout") ||
      normalized.includes("bill") ||
      normalized.includes("pay") ||
      normalized.includes("proceed") ||
      normalized.includes("purchase") ||
      normalized.includes("buy")
    ) {
      console.log("[v0] Checkout command triggered")
      if (cart.length === 0) {
        speak("Your cart is empty. Please add items first.")
      } else {
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const billSummary = cart.map((item) => `${item.quantity} ${item.name} at ${item.price} rupees each`).join(". ")
        speak(
          `Your bill is ready. You have ${itemCount} items. Items: ${billSummary}. Total bill is ${total} rupees. Thank you for shopping!`,
        )
      }
      return
    }

    if (normalized.includes("clear")) {
      setCart([])
      speak("Your cart has been cleared.")
      return
    }

    if (normalized.includes("help") || normalized.includes("commands")) {
      speak(
        "You can say: Find rice to search for a product, Add to cart to add current product, Next product to search for another item, Show cart to hear your items, What is my total for the price, Checkout to complete purchase, or Clear cart to empty it.",
      )
      return
    }

    console.log("[v0] No command matched")
    speak("Command not understood. Say help for available commands.")
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex flex-col items-center gap-8">
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
                {waitingForProductName
                  ? "Waiting for product name..."
                  : listening
                    ? "Listening..."
                    : isSpeaking
                      ? "Speaking..."
                      : "Ready"}
              </p>
              {lastCommand && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Last command: "{lastCommand}"</p>
              )}
            </div>
          </div>

          <div className="w-full bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Shopping Cart</h2>
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {cartCount} items
              </span>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-3 mb-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700 rounded"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400 py-4">
                Cart is empty. Say 'find rice' to start shopping.
              </p>
            )}

            <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white">Total:</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{cartTotal}</p>
              </div>
            </div>
          </div>

          <div className="w-full bg-blue-50 dark:bg-slate-700 p-4 rounded-lg border border-blue-200 dark:border-slate-600">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Try saying:</span> "Find rice", "Add to cart", "Next product" (to search
              for another item), "Show cart", "What's my total", "Checkout", or "Help"
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
