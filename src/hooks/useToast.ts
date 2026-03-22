import { useContext } from 'react';
import { useInternalToast } from '../components/ToastProvider';

type ToastAPI = {
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
  showInfo: (msg: string) => void;
} | null;

export default function useToast() {
  const ctx = useInternalToast();
  // Provide a safe default so consumers don't crash if used outside provider
  if (!ctx) {
    return {
      showError: (m: string) => console.error('[toast]', m),
      showSuccess: (m: string) => console.log('[toast]', m),
      showInfo: (m: string) => console.log('[toast]', m),
    };
  }
  return ctx as NonNullable<ToastAPI>;
}
