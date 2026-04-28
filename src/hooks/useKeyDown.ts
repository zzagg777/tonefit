import { useEffect } from 'react';

// 어떤 키든 받아서 처리할 수 있는 범용 훅
function useKeyDown(key: string, callback: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === key) {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, callback]);
}

export { useKeyDown };
