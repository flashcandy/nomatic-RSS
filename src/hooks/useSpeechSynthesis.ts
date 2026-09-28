import { useState, useEffect, useCallback, useRef } from 'react';
import { FeedItem } from '../types';

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSentence, setCurrentSentence] = useState('');
  const [currentArticle, setCurrentArticle] = useState<FeedItem | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((item: FeedItem, rate: number = 1.0, voiceIndex: number = 0) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Clean text of HTML tags
    const temp = document.createElement('div');
    temp.innerHTML = item.content || item.description;
    const cleanText = `${item.title}. Published by ${item.author || item.feedTitle}. ${temp.textContent || temp.innerText}`;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    const availableVoices = window.speechSynthesis.getVoices();
    if (availableVoices.length > 0) {
      // Prefer natural English voices if available
      const preferredVoice = availableVoices[voiceIndex] || 
        availableVoices.find(v => v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Enhanced'))) ||
        availableVoices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    utterance.rate = rate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentArticle(item);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSentence('');
      setCurrentArticle(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentSentence('');
    };

    utterance.onboundary = (event) => {
      if (event.name === 'sentence' || event.name === 'word') {
        const textSoFar = cleanText.substring(event.charIndex, event.charIndex + 60);
        setCurrentSentence(textSoFar);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentArticle(null);
      setCurrentSentence('');
    }
  }, []);

  return {
    voices,
    isSpeaking,
    isPaused,
    currentArticle,
    currentSentence,
    speak,
    pause,
    resume,
    stop,
  };
}
