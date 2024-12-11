import { useState, useEffect } from 'react';
import axios from 'axios';
import { createContext } from 'react';

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
    const [child, setChild] = useState(null);

    useEffect(() => {
        if (!child) {
            axios.get('/profile').then(({ data }) => {
                setChild(data);
            });
        }
    }, []);

    return (
        <UserContext.Provider value={{ child, setChild }}>
            {children}
        </UserContext.Provider>
    );
}
