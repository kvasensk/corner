import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PlatformConfig } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

interface PlatformConfigContextType {
  config: PlatformConfig | null;
  setConfig: (cfg: PlatformConfig) => void;
  refresh: () => void;
  loading: boolean;
  error: string;
}

const PlatformConfigContext = createContext<
  PlatformConfigContextType | undefined
>(undefined);

export const usePlatformConfig = () => {
  const ctx = useContext(PlatformConfigContext);
  if (!ctx)
    throw new Error(
      'usePlatformConfig must be used within PlatformConfigProvider'
    );
  return ctx;
};

export const PlatformConfigProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const unsub = onSnapshot(
      doc(db, 'config', 'platform'),
      snap => {
        setConfig(snap.exists() ? (snap.data() as PlatformConfig) : null);
        setLoading(false);
      },
      err => {
        setError('Ошибка загрузки настроек');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const updateConfig = (cfg: PlatformConfig) => {
    setConfig(cfg);
    setLoading(true);
    setError('');
    fetch('/api/platformConfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    })
      .then(res => {
        if (!res.ok) throw new Error();
      })
      .catch(() => setError('Ошибка сохранения настроек'))
      .finally(() => setLoading(false));
  };

  // refresh теперь просто noop, так как onSnapshot всегда актуален
  const refresh = () => {};

  return (
    <PlatformConfigContext.Provider
      value={{ config, setConfig: updateConfig, refresh, loading, error }}
    >
      {children}
    </PlatformConfigContext.Provider>
  );
};
