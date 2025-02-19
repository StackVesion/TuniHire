"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
    user: { email: string } | null;
    signin: (email: string) => void;
    signout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<{ email: string } | null>(null);

    const signin = (email: string) => {
        setUser({ email });
    };

    const signout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, signin, signout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
