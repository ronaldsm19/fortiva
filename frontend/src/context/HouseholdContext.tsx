import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { accountApi, type Persons } from '@/services/account';
import { useAuth } from './AuthContext';
import type { OwnerKey } from '@/services/types';

interface HouseholdCtx extends Persons {
  /** Nombre a mostrar para un owner ('Ana'→persona 1, 'Luis'→persona 2, 'Pareja'→Compartido). */
  ownerLabel: (owner: OwnerKey) => string;
  /** Inicial(es) para el avatar. */
  ownerInitial: (owner: OwnerKey) => string;
  refresh: () => void;
}

const Ctx = createContext<HouseholdCtx | null>(null);

const initialOf = (name: string) => (name.trim()[0] ?? 'P').toUpperCase();

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [persons, setPersons] = useState<Persons>({
    p1Name: 'Persona 1',
    p2Name: null,
    hasPartner: false,
  });

  const refresh = useCallback(() => {
    if (!isAuthenticated) return;
    accountApi.persons().then(setPersons).catch(() => undefined);
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ownerLabel = (owner: OwnerKey) => {
    if (owner === 'Pareja') return 'Compartido';
    if (owner === 'Ana') return persons.p1Name;
    return persons.p2Name ?? 'Persona 2';
  };

  const ownerInitial = (owner: OwnerKey) => {
    if (owner === 'Pareja') return initialOf(persons.p1Name) + (persons.p2Name ? initialOf(persons.p2Name) : '');
    if (owner === 'Ana') return initialOf(persons.p1Name);
    return persons.p2Name ? initialOf(persons.p2Name) : 'P';
  };

  return (
    <Ctx.Provider value={{ ...persons, ownerLabel, ownerInitial, refresh }}>{children}</Ctx.Provider>
  );
}

export function useHousehold() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useHousehold debe usarse dentro de HouseholdProvider');
  return ctx;
}
