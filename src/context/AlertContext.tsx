'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: AlertType;
  onConfirm?: () => void;
}

interface AlertContextData {
  showAlert: (title: string, message: string, type?: AlertType) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

const AlertContext = createContext<AlertContextData>({} as AlertContextData);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState>({ isOpen: false, title: '', message: '', type: 'info' });

  const showAlert = (title: string, message: string, type: AlertType = 'info') => {
    setAlert({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setAlert({ isOpen: true, title, message, type: 'confirm', onConfirm });
  };

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (alert.onConfirm) alert.onConfirm();
    closeAlert();
  };

  // Define as cores e ícones baseados no tipo de alerta
  const getAlertStyles = () => {
    switch (alert.type) {
      case 'success': return { icon: <CheckCircle2 size={40} className="text-emerald-500" />, btn: 'bg-emerald-500 hover:bg-emerald-600' };
      case 'error': return { icon: <XCircle size={40} className="text-red-500" />, btn: 'bg-red-500 hover:bg-red-600' };
      case 'warning':
      case 'confirm': return { icon: <AlertTriangle size={40} className="text-amber-500" />, btn: 'bg-amber-500 hover:bg-amber-600' };
      default: return { icon: <Info size={40} className="text-blue-500" />, btn: 'bg-blue-500 hover:bg-blue-600' };
    }
  };

  const styles = getAlertStyles();

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {/* O POP-UP GLOBAL ANIMADO */}
      {alert.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="mb-4 bg-gray-50 p-3 rounded-full">{styles.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{alert.title}</h3>
              <p className="text-gray-500 text-sm font-medium">{alert.message}</p>
            </div>
            
            <div className="p-4 bg-gray-50 flex gap-3 justify-center border-t border-gray-100">
              {alert.type === 'confirm' && (
                <button onClick={closeAlert} className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors">
                  Cancelar
                </button>
              )}
              <button onClick={alert.type === 'confirm' ? handleConfirm : closeAlert} className={`flex-1 py-2.5 rounded-xl font-bold text-white shadow-md transition-all hover:-translate-y-0.5 ${styles.btn}`}>
                {alert.type === 'confirm' ? 'Confirmar' : 'Entendi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);