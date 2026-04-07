import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ children, className = '', interactive = false, onClick, ...props }: CardProps) {
  const baseClasses = "bg-white border border-gray-200/80 rounded-[16px] shadow-sm flex flex-col";
  const hoverClasses = interactive || onClick ? "cursor-pointer hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200" : "";
  
  return (
    <div 
      onClick={onClick} 
      className={`${baseClasses} ${hoverClasses} ${className}`} 
      style={{ fontFamily: "'Nunito', ui-sans-serif, system-ui, sans-serif" }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardLabel({ children, className = '', ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`text-[11px] font-bold uppercase tracking-wider text-gray-500 ${className}`} {...props}>
      {children}
    </span>
  );
}

export function CardValue({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={`text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight tabular-nums ${className}`} {...props}>
      {children}
    </h2>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'red' | 'blue' | 'gray' | 'warning' | 'teal' | 'purple';
}

export function Badge({ children, className = '', variant = 'gray', ...props }: BadgeProps) {
  // Estilos vibrantes pasteles inspirados en Expensify Tags
  const variants = {
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-rose-100 text-rose-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-800',
    warning: 'bg-orange-100 text-orange-800',
    teal: 'bg-teal-100 text-teal-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

// ==========================================
// CUSTOM DROPDOWN PREMIUM
// ==========================================
interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export function Dropdown({ value, options, onChange, icon }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef} style={{ fontFamily: "'Nunito', sans-serif" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white px-4 py-2 rounded-[12px] border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        {icon && icon}
        <span className="text-sm font-bold text-gray-700">{selectedOption?.label || 'Select...'}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div 
        className={`absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-[12px] shadow-xl overflow-hidden z-50 transition-all duration-200 origin-top-right ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="py-1 flex flex-col">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-sm text-left font-semibold transition-colors hover:bg-emerald-50 hover:text-emerald-700 ${
                value === option.value ? 'bg-emerald-50/50 text-emerald-700' : 'text-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}