/**
 * useEmotionBackground.js — v3 (TESTING MODE)
 * Bold, obvious colors so you can instantly see emotion changes.
 * Applies solid background to document.body.
 */
import { useState, useCallback, useEffect } from 'react';

// ── BOLD TEST COLORS — very obvious for debugging ──
const EMOTION_GRADIENTS = {
  happy:   'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',   // bright YELLOW → orange
  sad:     'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',   // bold BLUE
  angry:   'linear-gradient(135deg, #FF0000 0%, #DC143C 100%)',   // strong RED
  fear:    'linear-gradient(135deg, #8B00FF 0%, #9400D3 100%)',   // vivid VIOLET
  disgust: 'linear-gradient(135deg, #00FF00 0%, #32CD32 100%)',   // bright GREEN
  neutral: 'linear-gradient(135deg, #e8ecff 0%, #f0f4ff 100%)',   // subtle default
};

// Title font sizes by emotion
const EMOTION_FONT_SCALE = {
  happy:   '2.6rem',
  neutral: '2.2rem',
  sad:     '1.9rem',
  fear:    '2rem',
  angry:   '2.4rem',
  disgust: '2rem',
};

export function useEmotionBackground() {
  const [currentEmotion, setCurrentEmotion] = useState('neutral');

  // Apply directly to body
  useEffect(() => {
    const gradient = EMOTION_GRADIENTS[currentEmotion] ?? EMOTION_GRADIENTS.neutral;
    document.body.style.transition = 'background 0.6s ease';
    document.body.style.background = gradient;
    document.body.classList.add('emotion-transition');

    return () => {
      document.body.style.background = '';
    };
  }, [currentEmotion]);

  const setEmotion = useCallback((emotion) => {
    const key = emotion?.toLowerCase?.() ?? 'neutral';
    if (EMOTION_GRADIENTS[key]) {
      console.log('[EmotionBG] Switching to:', key);   // debug log
      setCurrentEmotion(key);
    }
  }, []);

  return {
    currentEmotion,
    setEmotion,
    titleFontSize: EMOTION_FONT_SCALE[currentEmotion] ?? '2.2rem',
  };
}
