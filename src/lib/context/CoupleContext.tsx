import { logger } from '@/lib/core/logger';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/core/supabase';
import { useAuth } from '@/lib/context/AuthContext';

interface CoupleContextData {
  coupleId: string | null;
  hasCouple: boolean;
  isLoadingCouple: boolean;
  anniversaryDate: string | null;
  refreshCoupleStatus: () => Promise<string | null>;
  updateAnniversaryDate: (newDate: string) => void;
  clearCouple: () => void;
}

const CoupleContext = createContext<CoupleContextData>({} as CoupleContextData);

export function CoupleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [anniversaryDate, setAnniversaryDate] = useState<string | null>(null);
  const [isLoadingCouple, setIsLoadingCouple] = useState<boolean>(true);

  const refreshCoupleStatus = useCallback(async (): Promise<string | null> => {
    if (!user) {
      setCoupleId(null);
      setAnniversaryDate(null);
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
        setAnniversaryDate(null);
        return null;
      }

      const id = data?.couple_id ?? null;
      setCoupleId(id);

      if (id) {
        const { data: cData } = await supabase
          .from('couples')
          .select('anniversary_date')
          .eq('id', id)
          .maybeSingle();
        if (cData?.anniversary_date) {
          setAnniversaryDate(cData.anniversary_date);
        }
      } else {
        setAnniversaryDate(null);
      }

      return id;
    } catch (err) {
      logger.warn('Exceção ao verificar status de casal:', err);
      setCoupleId(null);
      setAnniversaryDate(null);
      return null;
    } finally {
      setIsLoadingCouple(false);
    }
  }, [user]);

  const updateAnniversaryDate = useCallback((newDate: string) => {
    setAnniversaryDate(newDate);
  }, []);

  const clearCouple = useCallback(() => {
    setCoupleId(null);
    setAnniversaryDate(null);
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
        anniversaryDate,
        refreshCoupleStatus,
        updateAnniversaryDate,
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
