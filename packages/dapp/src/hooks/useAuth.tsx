'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '@/lib/utils';

interface AuthUser {
    id: string;
    email: string | null;
    username: string | null;
    address: string | null;
    avatar: string | null;
    authProvider: string;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, username?: string) => Promise<void>;
    logout: () => void;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize from localStorage
    useEffect(() => {
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
            setToken(savedToken);
            fetchProfile(savedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchProfile = async (jwt: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                // Token expired or invalid
                localStorage.removeItem('auth_token');
                setToken(null);
            }
        } catch {
            // API unreachable — keep token for retry later
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (email: string, password: string) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Login failed' }));
            throw new Error(err.message || 'Invalid email or password');
        }

        const data = await res.json();
        localStorage.setItem('auth_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
    }, []);

    const signup = useCallback(async (email: string, password: string, username?: string) => {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Signup failed' }));
            throw new Error(err.message || 'Could not create account');
        }

        const data = await res.json();
        localStorage.setItem('auth_token', data.access_token);
        setToken(data.access_token);
        setUser(data.user);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider
            value= {{
        user,
            isAuthenticated: !!user,
                isLoading,
                login,
                signup,
                logout,
                token,
            }
}
        >
    { children }
    </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
