import React from 'react';
import { X } from 'lucide-react';

interface AetherModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string; // <--- LA MAGIA: Ahora el título es opcional (?)
  children: React.ReactNode;
  maxWidth?: string;
}

export default function AetherModal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: AetherModalProps) {
  if (!isOpen) return null;

  return (
    <div className="aether-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`aether-modal-panel w-full ${maxWidth}`}>
        
        {/* Renderizado condicional: Si hay título, justifica entre ambos. Si no, solo tira la X a la derecha */}
        <div className={`flex items-center ${title ? 'justify-between mb-8' : 'justify-end mb-2'}`}>
          {title && <h2 className="aether-title text-[#2D2A26]">{title}</h2>}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-[#8A8681] transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        
        {children}
      </div>
    </div>
  );
}