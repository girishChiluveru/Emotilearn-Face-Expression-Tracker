import { useState, useEffect, createContext } from 'react';
import axios from 'axios';

export const UserContext = createContext({});

const EMOTION_GRADIENTS = {
  happy:   'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',   // bright YELLOW → orange
  sad:     'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',   // bold BLUE
  angry:   'linear-gradient(135deg, #FF0000 0%, #DC143C 100%)',   // strong RED
  fear:    'linear-gradient(135deg, #8B00FF 0%, #9400D3 100%)',   // vivid VIOLET
  disgust: 'linear-gradient(135deg, #00FF00 0%, #32CD32 100%)',   // bright GREEN
  neutral: 'linear-gradient(135deg, #e8ecff 0%, #f0f4ff 100%)',   // default
};

export function UserContextProvider({ children }) {
  const [child, setChild] = useState(null);
  const [ready, setReady] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('neutral');

  // central effect to update body background based on the current emotion
  useEffect(() => {
    const gradient = EMOTION_GRADIENTS[currentEmotion?.toLowerCase()] ?? EMOTION_GRADIENTS.neutral;
    document.body.style.transition = 'background 0.6s ease';
    document.body.style.background = gradient;
  }, [currentEmotion]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // 1. Super Admin uses localStorage (frontend-only session)
        const savedSuper = localStorage.getItem('emotilearn_super');
        if (savedSuper) {
          setChild(JSON.parse(savedSuper));
          setReady(true);
          return;
        }

        // 2. Regular child/therapist — validate via backend session cookie
        const { data } = await axios.get('/profile');
        setChild(data?.user || null);
      } catch {
        setChild(null);
      } finally {
        setReady(true);
      }
    };

    checkSession();
  }, []);

  return (
    <UserContext.Provider value={{ child, setChild, ready, currentEmotion, setCurrentEmotion }}>
      {children}
    </UserContext.Provider>
  );
}
