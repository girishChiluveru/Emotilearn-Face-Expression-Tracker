import { useState, useEffect, createContext } from 'react';
import axios from 'axios';

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [child, setChild] = useState(null);
  const [ready, setReady] = useState(false);

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
    <UserContext.Provider value={{ child, setChild, ready }}>
      {children}
    </UserContext.Provider>
  );
}
