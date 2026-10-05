import React, { useState, useRef, useEffect } from 'react';
import { KeyRound, X, Check, Shield } from 'lucide-react';
import { AuthState, Family } from '../types';
import { authenticateWithPassword } from '../utils/authUtils';

interface TeacherPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: Family[];
  onLoginSuccess: (auth: AuthState) => void;
}

export const TeacherPasswordModal: React.FC<TeacherPasswordModalProps> = ({
  isOpen,
  onClose,
  families,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setPassword('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsVerifying(true);
    setErrorMsg('');

    try {
      const resolvedAuth = await authenticateWithPassword(password, families);
      if (resolvedAuth) {
        onLoginSuccess(resolvedAuth);
        onClose();
      } else {
        setErrorMsg('Incorrect password');
        inputRef.current?.select();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="teacher-password-modal-overlay"
      dir="ltr"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="teacher-password-modal-content"
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E4DCC8] p-5 select-none animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1F5A4E]/10 flex items-center justify-center text-[#1F5A4E]">
              <Shield className="w-4 h-4 text-[#1F5A4E]" />
            </div>
            <h3 className="font-bold text-base text-[#1F2A3D]">Teacher Access</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Enter Teacher or Parent Password
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1F5A4E]/40"
              />
              <KeyRound className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            {errorMsg && (
              <p className="text-xs text-red-600 mt-1 font-semibold">{errorMsg}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !password.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0F6E56] hover:bg-[#0C5845] transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              {isVerifying ? (
                <span>Checking...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Unlock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
