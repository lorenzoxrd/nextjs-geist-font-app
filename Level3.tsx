"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { motion, AnimatePresence } from "framer-motion"
import { useGameAudio } from "@/hooks/useGameAudio"
import { DraggableSyllable } from "./DraggableSyllable"
import { WordDropZone } from "./WordDropZone"
import { CelebrationModal } from "./CelebrationModal"
import { audioAssets } from "@/config/audioAssets"

interface Level3Props {
  onBack: () => void
  onComplete?: () => void
}

interface Exercise {
  word: string
  syllables: string[]
  image: string
  audioUrl: string
}

const exercises: Exercise[] = [
  {
    word: "LOBO",
    syllables: ["LO", "BO"],
    image: "https://images.pexels.com/photos/2361/nature-animal-wolf-wilderness.jpg",
    audioUrl: audioAssets.lobo
  },
  {
    word: "GATO",
    syllables: ["GA", "TO"],
    image: "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg",
    audioUrl: audioAssets.gato
  },
  {
    word: "RATÓN",
    syllables: ["RA", "TÓN"],
    image: "https://images.pexels.com/photos/2109530/pexels-photo-2109530.jpeg",
    audioUrl: audioAssets.raton
  }
]

export default function Level3({ onBack, onComplete }: Level3Props) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [placedSyllables, setPlacedSyllables] = useState<(string | undefined)[]>([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [isLevelComplete, setIsLevelComplete] = useState(false)
  const [score, setScore] = useState(0)
  const { playSound } = useGameAudio()

  const currentExercise = exercises[currentExerciseIndex]

  const handleSyllableDrop = useCallback((syllable: string, position: number) => {
    console.log('Dropped syllable:', syllable, 'at position:', position)
    
    const newPlacedSyllables = [...placedSyllables]
    newPlacedSyllables[position] = syllable
    setPlacedSyllables(newPlacedSyllables)

    // Check if word is complete
    if (newPlacedSyllables.length === currentExercise.syllables.length &&
        newPlacedSyllables.every(s => s !== undefined)) {
      const formedWord = newPlacedSyllables.join('')
      console.log('Formed word:', formedWord, 'Expected:', currentExercise.word)
      
      if (formedWord === currentExercise.word) {
        playSound('correct')
        setScore(prev => prev + 1)
        
        // Play word sound
        const audio = new Audio(currentExercise.audioUrl)
        audio.play().catch(console.error)

        setShowCelebration(true)

        if (currentExerciseIndex === exercises.length - 1) {
          setTimeout(() => {
            playSound('levelComplete')
            setIsLevelComplete(true)
          }, 1000)
        }
      } else {
        playSound('incorrect')
        // Reset placed syllables after a short delay
        setTimeout(() => {
          setPlacedSyllables([])
        }, 1000)
      }
    }
  }, [currentExercise, placedSyllables, currentExerciseIndex, playSound])

  const handleContinue = useCallback(() => {
    setShowCelebration(false)
    setPlacedSyllables([])
    
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
    }
  }, [currentExerciseIndex])

  const playCurrentWordSound = useCallback(() => {
    const audio = new Audio(currentExercise.audioUrl)
    audio.play().catch(console.error)
  }, [currentExercise])

  // Shuffle syllables for display
  const shuffledSyllables = [...currentExercise.syllables]
    .sort(() => Math.random() - 0.5)

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800">
            El Constructor de Palabras
          </h1>
          <div className="text-xl font-semibold text-purple-600">
            Puntos: {score} / {exercises.length}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          key={currentExercise.word}
        >
          <Card className="p-8 bg-white/90 backdrop-blur shadow-xl">
            <div className="space-y-8">
              <div className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={currentExercise.image}
                  alt="¿Qué animal es?"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                  priority
                />
              </div>

              <Button
                variant="outline"
                onClick={playCurrentWordSound}
                className="bg-purple-100 hover:bg-purple-200 mx-auto block"
              >
                Escuchar Palabra
              </Button>

              <div className="flex justify-center gap-4">
                {currentExercise.syllables.map((_, index) => (
                  <WordDropZone
                    key={index}
                    position={index}
                    onDrop={handleSyllableDrop}
                    placedWord={placedSyllables[index]}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 justify-items-center">
                {shuffledSyllables.map((syllable) => (
                  <DraggableSyllable
                    key={syllable}
                    syllable={syllable}
                    isPlaced={placedSyllables.includes(syllable)}
                  />
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        <AnimatePresence mode="wait">
          {showCelebration && !isLevelComplete && (
            <CelebrationModal
              title="¡Excelente!"
              message="¡Has formado la palabra correctamente!"
              onClose={handleContinue}
            />
          )}

          {isLevelComplete && (
            <CelebrationModal
              title="¡Nivel Completado!"
              message={`¡Felicitaciones! Has completado el Constructor de Palabras con ${score} puntos.`}
              onClose={onBack}
              onNext={onComplete}
              isLevelComplete={true}
            />
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <Button
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-600 text-white"
          >
            Volver al Menú
          </Button>
        </div>
      </div>
    </DndProvider>
  )
}
