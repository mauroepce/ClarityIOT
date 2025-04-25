import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppContextType = {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: {username: string} | null;
};

export const AppContext = createContext<AppContextType>({
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  user: null,
});

export const AppContextProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{username: string} | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    // For demo purposes, we'll just check if both fields are filled
    if (username.trim() && password.trim()) {
      const userData = {username};
      setUser(userData);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem('user');
  };

  return (
    <AppContext.Provider value={{isAuthenticated, login, logout, user}}>
      {children}
    </AppContext.Provider>
  );
};
