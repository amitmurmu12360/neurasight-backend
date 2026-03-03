"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TypewriterTextProps {
  phrases: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export default function TypewriterText({
  phrases,
  className = "",
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
}: TypewriterTextProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    if (!currentPhrase) return;

    let timeout: NodeJS.Timeout;

    if (!isDeleting && currentText === currentPhrase) {
      // Pause at full phrase
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseDuration);
    } else if (isDeleting && currentText === "") {
      // Move to next phrase
      setIsDeleting(false);
      setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
    } else if (isDeleting) {
      // Deleting
      timeout = setTimeout(() => {
        setCurrentText(currentPhrase.slice(0, currentText.length - 1));
      }, deletingSpeed);
    } else {
      // Typing
      timeout = setTimeout(() => {
        setCurrentText(currentPhrase.slice(0, currentText.length + 1));
      }, typingSpeed);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentText, isDeleting, currentPhraseIndex, phrases, pauseDuration, typingSpeed, deletingSpeed]);

  return (
    <span className={className}>
      {currentText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="inline-block w-0.5 bg-emerald-400"
      >
        |
      </motion.span>
    </span>
  );
}

