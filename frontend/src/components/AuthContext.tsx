import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

if (!getApps().length) {
  initializeApp(firebaseConfig);
}
export const auth = getAuth();
const googleAuthProvider = new GoogleAuthProvider();

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return auth.onIdTokenChanged(async (u) => {
      setUser(u);
      if (u) {
        const token = await u.getIdToken();
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('token');
      }
      setLoading(false);
    });
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
