import { logger } from '../lib/logger';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CoupleContextData {
  coupleId: string | null;
  hasCouple: boolean;
  isLoadingCouple: boolean;
  refreshCoupleStatus: () => Promise<string | null>;
  clearCouple: () => void;
}

const CoupleContext = createContext<CoupleContextData>({} as CoupleContextData);

export function CoupleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [isLoadingCouple, setIsLoadingCouple] = useState<boolean>(true);

  const refreshCoupleStatus = useCallback(async (): Promise<string | null> => {
    if (!user) {
      setCoupleId(null);
      setIsLoadingCouple(false);
      return null;
    }

    try {
      setIsLoadingCouple(true);
      const { data, error } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.warn('Erro ao consultar couple_members:', error.message);
        setCoupleId(null);
        return null;
      }

      const id = data?.couple_id ?? null;
      setCoupleId(id);
      return id;
    } catch (err) {
      logger.warn('Exceção ao verificar status de casal:', err);
      setCoupleId(null);
      return null;
    } finally {
      setIsLoadingCouple(false);
    }
  }, [user]);

  const clearCouple = useCallback(() => {
    setCoupleId(null);
    setIsLoadingCouple(false);
  }, []);

  useEffect(() => {
    if (user) {
      refreshCoupleStatus();
    } else {
      clearCouple();
    }
  }, [user, refreshCoupleStatus, clearCouple]);

  return (
    <CoupleContext.Provider
      value={{
        coupleId,
        hasCouple: !!coupleId,
        isLoadingCouple,
        refreshCoupleStatus,
        clearCouple,
      }}
    >
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const context = useContext(CoupleContext);
  if (!context) {
    throw new Error('useCouple deve ser utilizado dentro de um CoupleProvider');
  }
  return context;
}
