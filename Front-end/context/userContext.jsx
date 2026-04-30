import { useState, useEffect, createContext } from 'react';
import axios from 'axios';

// Ensure axios is configured correctly for this context
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const [child, setChild] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            try {
                // 1. Check Super Admin (Frontend-only session)
                const savedSuper = localStorage.getItem('emotilearn_super');
                if (savedSuper) {
                    setChild(JSON.parse(savedSuper));
                    setReady(true);
                    return;
                }

                // 2. Check Backend Session (Child/Therapist)
                const { data } = await axios.get('/profile');
                if (data) {
                    setChild(data);
                } else {
                    setChild(null);
                }
            } catch (err) {
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
