import React, { useEffect } from 'react';
import { ChatBot } from './ChatBot';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onExpandToFullView: () => void;
  customApiKey?: string;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onExpandToFullView,
  customApiKey,
  initialQuery,
  onClearInitialQuery,
}) => {
  // Listen for escape key to close popup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    /* Small popup modal positioned on the right with SOLID background and NO transparent backdrop */
    <div 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[480px] md:w-[520px] h-[600px] max-h-[86vh] bg-white rounded-2xl shadow-2xl border-2 border-slate-300 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="AI Finance Assistant Popup"
    >
      <div className="flex-1 overflow-hidden bg-white">
        <ChatBot
          isDrawer={true}
          customApiKey={customApiKey}
          initialQuery={initialQuery}
          onClearInitialQuery={onClearInitialQuery}
          onClose={onClose}
          onExpand={onExpandToFullView}
        />
      </div>
    </div>
  );
};
