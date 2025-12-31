"use client"

import { useEffect, useState, useRef } from "react"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import { ShoppingCart, Mic, MicOff, Volume2 } from "lucide-react"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  aisle: string
  expiryDate?: string
  company?: string
}

const PRODUCTS = [
  {
    id: "1",
    name: "rice",
    price: 150,
    aisle: "aisle 1",
    category: "grains",
    expiryDate: "2025-12-31",
    company: "Daawat",
    direction: "2 steps ahead on your left, shelf number 3",
  },
  {
    id: "2",
    name: "bread",
    price: 40,
    aisle: "aisle 2",
    category: "bakery",
    expiryDate: "2025-11-15",
    company: "Britannia",
    direction: "Take right, then 1 step forward, on the top shelf",
  },
  {
    id: "3",
    name: "milk",
    price: 60,
    aisle: "aisle 3",
    category: "dairy",
    expiryDate: "2025-11-10",
    company: "Amul",
    direction: "Product is behind you, on your right side, middle shelf",
  },
  {
    id: "4",
    name: "sugar",
    price: 50,
    aisle: "aisle 1",
    category: "pantry",
    expiryDate: "2026-12-31",
    company: "Tata",
    direction: "1 step ahead, directly in front of you, lower shelf",
  },
  {
    id: "5",
    name: "salt",
    price: 20,
    aisle: "aisle 1",
    category: "pantry",
    expiryDate: "2026-12-31",
    company: "Tata",
    direction: "Next to sugar, on your left, same shelf",
  },
  {
    id: "6",
    name: "butter",
    price: 300,
    aisle: "aisle 3",
    category: "dairy",
    expiryDate: "2025-12-25",
    company: "Amul",
    direction: "Take 3 steps ahead, then turn right, refrigerated shelf",
  },
  {
    id: "7",
    name: "eggs",
    price: 80,
    aisle: "aisle 3",
    category: "dairy",
    expiryDate: "2025-11-08",
    company: "Farm Fresh",
    direction: "Next to butter, same refrigerated section, lower part",
  },
  {
    id: "8",
    name: "oil",
    price: 200,
    aisle: "aisle 4",
    category: "oils",
    expiryDate: "2026-06-30",
    company: "Saffola",
    direction: "Turn around and walk 4 steps, shelf at your eye level",
  },
  {
    id: "9",
    name: "flour",
    price: 100,
    aisle: "aisle 2",
    category: "grains",
    expiryDate: "2026-01-31",
    company: "Aashirvaad",
    direction: "Take right from aisle 1, 2 steps forward, top shelf",
  },
  {
    id: "10",
    name: "apple",
    price: 120,
    aisle: "aisle 5",
    category: "fruits",
    expiryDate: "2025-11-20",
    company: "Local Farm",
    direction: "Walk straight 5 steps, turn left, in the fruit section",
  },
]

export function VoiceShoppingSystem() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isListening, setIsListening] = useState(false)
  const [lastCommand, setLastCommand] = useState("")
  const { transcript, listening, startListening, stopListening } = useSpeechRecognition()
  const { speak, isSpeaking } = useTextToSpeech()
  const transcriptTimeoutRef = useRef<NodeJS.Timeout>()

  // Greet user on mount
  useEffect(() => {
    speak(
      "Welcome to Smart Shopping Assistant. How can I help you today? You can say commands like: Find rice, Add bread to my cart, What is my total, or Generate my bill.",
    )
  }, [speak])

  // Process commands when transcript changes
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setLastCommand(transcript)
      processCommand(transcript.toLowerCase())

      // Clear listening state after processing
      if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current)
      transcriptTimeoutRef.current = setTimeout(() => {
        setIsListening(false)
      }, 1000)
    }
  }, [transcript])

  const findProduct = (query: string) => {
    const normalized = query.trim().toLowerCase()
    return PRODUCTS.find((p) => normalized.includes(p.name) || p.name.includes(normalized))
  }

  const processCommand = (command: string) => {
    const lowerCommand = command.toLowerCase()

    // Find product - speak full details including direction
    if (lowerCommand.includes("find") || lowerCommand.includes("where is")) {
      const product = findProduct(command)
      if (product) {
        speak(
          `${product.name} from ${product.company}. Price is ${product.price} rupees. Expiry date is ${product.expiryDate}. Location: ${product.direction}`,
        )
      } else {
        speak("Sorry, product not found. Please try again.")
      }
      return
    }

    // Add to cart
    if (lowerCommand.includes("add") && (lowerCommand.includes("cart") || lowerCommand.includes("shopping"))) {
      const product = findProduct(command)
      if (product) {
        setCart((prev) => {
          const existing = prev.find((item) => item.id === product.id)
          if (existing) {
            speak(
              `Added another ${product.name} from ${product.company} to your cart. You now have ${existing.quantity + 1} of them.`,
            )
            return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
          } else {
            speak(
              `${product.name} from ${product.company}, price ${product.price} rupees, expiry ${product.expiryDate}, added to your cart.`,
            )
            return [
              ...prev,
              {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                aisle: product.aisle,
                expiryDate: product.expiryDate,
                company: product.company,
              },
            ]
          }
        })
      } else {
        speak("Product not found. Please try again.")
      }
      return
    }

    // Remove from cart
    if (lowerCommand.includes("remove") && (lowerCommand.includes("cart") || lowerCommand.includes("shopping"))) {
      const product = findProduct(command)
      if (product) {
        const itemInCart = cart.find((item) => item.id === product.id)
        if (itemInCart) {
          if (itemInCart.quantity > 1) {
            speak(`Removed one ${product.name}. You still have ${itemInCart.quantity - 1} in your cart.`)
            setCart((prev) =>
              prev
                .map((item) => (item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item))
                .filter((item) => item.quantity > 0),
            )
          } else {
            speak(`${product.name} removed from your cart.`)
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

    // Check what's in cart
    if (lowerCommand.includes("what") && (lowerCommand.includes("cart") || lowerCommand.includes("shopping"))) {
      if (cart.length === 0) {
        speak("Your cart is empty.")
      } else {
        const items = cart.map((item) => `${item.quantity} ${item.name} from ${item.company}`).join(", ")
        speak(`Your cart contains: ${items}.`)
      }
      return
    }

    // Get total
    if (lowerCommand.includes("total") || lowerCommand.includes("how much")) {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      if (total === 0) {
        speak("Your cart is empty. Total is zero rupees.")
      } else {
        speak(`Your total is ₹${total}.`)
      }
      return
    }

    // Generate bill
    if (lowerCommand.includes("bill") || lowerCommand.includes("checkout") || lowerCommand.includes("pay")) {
      if (cart.length === 0) {
        speak("Your cart is empty. Please add items before generating a bill.")
      } else {
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        const billSummary = cart
          .map(
            (item) =>
              `${item.quantity} ${item.name} from ${item.company}, expiry ${item.expiryDate}, at ${item.price} each`,
          )
          .join(". ")
        speak(
          `You have ${itemCount} items in your cart. ${billSummary}. Your total bill is ₹${total}. Thank you for shopping!`,
        )
      }
      return
    }

    // Clear cart
    if (lowerCommand.includes("clear") && (lowerCommand.includes("cart") || lowerCommand.includes("remove all"))) {
      setCart([])
      speak("Your cart has been cleared.")
      return
    }

    // Help
    if (lowerCommand.includes("help") || lowerCommand.includes("commands")) {
      speak(
        "You can say: Find rice, Add milk to cart, Remove butter, What is in my cart, What is my total, Generate my bill, or Clear my cart.",
      )
      return
    }

    speak(
      "Command not understood. Please say find, add to cart, remove from cart, what is my total, or generate my bill.",
    )
  }

  const handleStartListening = () => {
    setIsListening(true)
    startListening()
  }

  const handleStopListening = () => {
    setIsListening(false)
    stopListening()
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 max-w-2xl">
      {/* Status Indicator */}
      <div className="flex flex-col items-center gap-4 w-full">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isListening || listening ? "bg-green-500 animate-pulse" : isSpeaking ? "bg-blue-500" : "bg-gray-400"
          }`}
        >
          {isListening || listening ? (
            <Mic className="w-8 h-8 text-white" />
          ) : isSpeaking ? (
            <Volume2 className="w-8 h-8 text-white animate-pulse" />
          ) : (
            <MicOff className="w-8 h-8 text-white" />
          )}
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">
            {isListening || listening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready to listen"}
          </p>
          {lastCommand && <p className="text-sm text-muted-foreground mt-2">Last command: "{lastCommand}"</p>}
        </div>
      </div>

      {/* Voice Control Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleStartListening}
          disabled={isListening || listening}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          Start Listening
        </button>
        <button
          onClick={handleStopListening}
          disabled={!isListening && !listening}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 transition-colors"
        >
          Stop Listening
        </button>
      </div>

      {/* Cart Status */}
      <div className="flex items-center gap-3 bg-card p-4 rounded-lg w-full justify-center border border-border">
        <ShoppingCart className="w-6 h-6" />
        <div className="text-center">
          <p className="font-semibold">
            Cart: {cartCount} items | Total: ₹{cartTotal}
          </p>
          {cart.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {cart.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground bg-muted p-4 rounded-lg">
        <p>Try saying: "Find rice", "Add bread to cart", "What is my total", or "Generate my bill"</p>
      </div>
    </div>
  )
}
