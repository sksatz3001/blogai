"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

interface CreditsContextType {
  credits: number | null;
  userName: string;
  refreshCredits: () => Promise<void>;
  isLoading: boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [credits, setCredits] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshCredits = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/credits");
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
        setUserName(data.userName || "User");
      }
    } catch (error) {
      console.error("Failed to fetch credits:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // Poll for updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshCredits, 30000);
    return () => clearInterval(interval);
  }, [refreshCredits]);

  return (
    <CreditsContext.Provider value={{ credits, userName, refreshCredits, isLoading }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
}
