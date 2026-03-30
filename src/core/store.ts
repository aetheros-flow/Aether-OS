import { create } from 'zustand';
import React from 'react'; // Importamos React para usar sus tipos
import { Heart, Users, Home, Smile, BookOpen, Briefcase, DollarSign, Coffee } from 'lucide-react'; // Eliminamos LucideIcon de la importación

export interface Universe {
  id: string;
  label: string;
  // Usamos React.ElementType, que es la forma estándar de tipar componentes como los iconos de Lucide
  icon: React.ElementType; 
  color: string;
  deepBg: string;
  score: number;
}

interface AetherState {
  universes: Universe[];
  updateScore: (id: string, newScore: number) => void;
}

export const useAetherStore = create<AetherState>((set) => ({
  universes: [
    { id: 'salud', label: 'Salud Física', icon: Heart, color: '#E5BB53', deepBg: '#30250A', score: 8 },
    { id: 'pareja', label: 'Vida Amorosa', icon: Users, color: '#C2534C', deepBg: '#2E1110', score: 7 },
    { id: 'familia', label: 'Familia y Hogar', icon: Home, color: '#929747', deepBg: '#21230D', score: 8 },
    { id: 'social', label: 'Vida Social', icon: Smile, color: '#84718A', deepBg: '#1B151D', score: 6 },
    { id: 'personal', label: 'Desarrollo Pers.', icon: BookOpen, color: '#E08C4A', deepBg: '#361D0A', score: 9 },
    { id: 'trabajo', label: 'Desarrollo Prof.', icon: Briefcase, color: '#688E9F', deepBg: '#131D22', score: 8 },
    { id: 'dinero', label: 'Situación Económica', icon: DollarSign, color: '#487D4B', deepBg: '#0F1D10', score: 7 },
    { id: 'ocio', label: 'Ocio y Tiempo', icon: Coffee, color: '#1F8A9E', deepBg: '#082126', score: 5 },
  ],
  updateScore: (id, newScore) => set((state) => ({
    universes: state.universes.map(u => u.id === id ? { ...u, score: newScore } : u)
  }))
}));