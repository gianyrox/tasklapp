'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { LogCategory } from '../../confy/types';
import { useLogging } from './LoggingContext';

interface AppConfig {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
  autoRefresh: boolean;
  refreshInterval: number;
  debugMode: boolean;
}

const defaultConfig: AppConfig = {
  theme: 'system',
  notifications: true,
  language: 'en',
  autoRefresh: true,
  refreshInterval: 60000, // 1 minute
  debugMode: false,
};

type ConfigContextType = {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetConfig: () => void;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const { log } = useLogging();
  
  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('app_config');
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsedConfig }));
        
        log({
          category: LogCategory.SYSTEM,
          action: 'config_loaded',
          details: { source: 'localStorage' }
        }).catch(err => console.error('Failed to log config load:', err));
      }
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
      
      log({
        category: LogCategory.ERROR,
        action: 'config_load_failed',
        details: { error: String(error) }
      }).catch(err => console.error('Failed to log config error:', err));
    }
  }, [log]);
  
  // Update config and save to localStorage
  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      try {
        localStorage.setItem('app_config', JSON.stringify(newConfig));
        
        log({
          category: LogCategory.SYSTEM,
          action: 'config_updated',
          details: { updates }
        }).catch(err => console.error('Failed to log config update:', err));
      } catch (error) {
        console.error('Failed to save config to localStorage:', error);
        
        log({
          category: LogCategory.ERROR,
          action: 'config_save_failed',
          details: { error: String(error) }
        }).catch(err => console.error('Failed to log config error:', err));
      }
      
      return newConfig;
    });
  };
  
  // Reset config to defaults
  const resetConfig = () => {
    setConfig(defaultConfig);
    
    try {
      localStorage.setItem('app_config', JSON.stringify(defaultConfig));
      
      log({
        category: LogCategory.SYSTEM,
        action: 'config_reset',
        details: { restoredDefaults: true }
      }).catch(err => console.error('Failed to log config reset:', err));
    } catch (error) {
      console.error('Failed to reset config in localStorage:', error);
      
      log({
        category: LogCategory.ERROR,
        action: 'config_reset_failed',
        details: { error: String(error) }
      }).catch(err => console.error('Failed to log config error:', err));
    }
  };
  
  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  
  return context;
} 