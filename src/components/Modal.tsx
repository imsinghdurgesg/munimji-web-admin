import type { FC, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      />

      {/* Modal */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className={cn(
            'relative rounded-t-2xl sm:rounded-lg shadow-2xl w-full z-50 max-h-[95vh] sm:max-h-[90vh] flex flex-col',
            sizes[size]
          )}
          onClick={(e) => e.stopPropagation()}
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0"
            style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}
          >
            <h2 className="text-lg sm:text-xl font-semibold" style={{ color: '#111827' }}>{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100"
              style={{ color: '#9ca3af' }}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1" style={{ backgroundColor: '#ffffff' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
