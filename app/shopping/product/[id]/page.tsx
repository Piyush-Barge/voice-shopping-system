"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

const PRODUCTS = [
  {
    id: "1",
    name: "rice",
    price: 150,
    aisle: "aisle 1",
    category: "grains",
    description: "High quality basmati rice, 1 kg pack",
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
    description: "Fresh whole wheat bread, 400g",
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
    description: "Pure cow milk, 1 liter pack",
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
    description: "Refined white sugar, 1 kg",
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
    description: "Iodized salt, 500g",
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
    description: "Premium butter, 500g",
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
    description: "Fresh farm eggs, dozen",
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
    description: "Refined sunflower oil, 1 liter",
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
    description: "Refined wheat flour, 1 kg",
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
    description: "Fresh red apples, per kg",
    expiryDate: "2025-11-20",
    company: "Local Farm",
    direction: "Walk straight 5 steps, turn left, in the fruit section",
  },
]

export default function ProductDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<any>(null)
  const [lastCommand, setLastCommand] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const { transcript, listening, startListening, stopListening } = useSpeechRecognition()
  const { speak, isSpeaking } = useTextToSpeech()
  const [listeningStarted, setListeningStarted] = useState(false)

  useEffect(() => {
    const found = PRODUCTS.find((p) => p.id === productId)
    setProduct(found)
  }, [productId])

  useEffect(() => {
    if (product && !listeningStarted) {
      setListeningStarted(true)
      const timer = setTimeout(() => {
        const details = `${product.name}. ${product.description}. Price is ${product.price} rupees. Company: ${product.company}. Expiry date is ${product.expiryDate}. Location: ${product.direction}. Say add to cart, or back to shopping.`
        speak(details)
        setTimeout(() => {
          startListening()
        }, 2000)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [product, speak, startListening, listeningStarted])

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
    if (command.includes("add") || command.includes("buy")) {
      const cartData = localStorage.getItem("shopping-cart")
      const cart = cartData ? JSON.parse(cartData) : []
      const existingItem = cart.find((item: any) => item.id === product.id)

      if (existingItem) {
        existingItem.quantity += 1
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          aisle: product.aisle,
          expiryDate: product.expiryDate,
          company: product.company,
          direction: product.direction,
        })
      }

      localStorage.setItem("shopping-cart", JSON.stringify(cart))
      speak(`${product.name} from ${product.company} added to cart. Going back to shopping.`)
      stopListening()
      setTimeout(() => {
        router.push("/shopping")
      }, 500)
      return
    }

    if (command.includes("back") || command.includes("home") || command.includes("shopping")) {
      speak("Going back to shopping page.")
      stopListening()
      setTimeout(() => {
        router.push("/shopping")
      }, 500)
      return
    }

    if (command.includes("help")) {
      speak(`You can say: Add to cart, or Back to shopping.`)
      return
    }

    speak("Say add to cart or back to return to shopping.")
  }

  if (!product) {
    return (
      <main className="w-full min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-600">Loading product...</p>
        </div>
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

          {/* Product Details */}
          <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white capitalize mb-2">{product.name}</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400">{product.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Price</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">₹{product.price}</p>
                </div>
                <div className="bg-green-50 dark:bg-slate-700 p-4 rounded">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Company</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 capitalize">{product.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 dark:bg-slate-700 p-4 rounded">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Expiry Date</p>
                  <p className="text-xl font-semibold text-orange-600 dark:text-orange-400">{product.expiryDate}</p>
                </div>
                <div className="bg-purple-50 dark:bg-slate-700 p-4 rounded">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Category</p>
                  <p className="text-xl font-semibold text-purple-600 dark:text-purple-400 capitalize">
                    {product.category}
                  </p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-slate-700 p-4 rounded border-2 border-red-200 dark:border-red-600">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-2">Location Directions</p>
                <p className="text-lg font-bold text-red-700 dark:text-red-400">{product.direction}</p>
              </div>
            </div>
          </div>

          {/* Help Info */}
          <div className="w-full bg-blue-50 dark:bg-slate-700 p-4 rounded-lg border border-blue-200 dark:border-slate-600">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Say:</span> "Add to cart" to purchase, or "Back" to return to shopping
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
