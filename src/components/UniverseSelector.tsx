import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export function UniverseSelector() {
  const navigate = useNavigate();
  const location = useLocation();

  // Esto detecta la URL actual para que el menú muestre el universo correcto automáticamente
  const currentPath = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`;

  return (
    <Select value={currentPath} onValueChange={(val) => navigate(val)}>
      <SelectTrigger className="w-[210px] bg-white/5 border-white/10 text-white font-extrabold hover:bg-white/10 transition-colors focus:ring-mint-DEFAULT rounded-xl h-10 shadow-none">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-mint-DEFAULT" />
          <SelectValue placeholder="Seleccionar Universo" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-[#0B2118] border border-white/10 text-white rounded-xl shadow-2xl">
        <SelectItem value="/" className="font-bold focus:bg-white/10 focus:text-mint-DEFAULT cursor-pointer py-2">
          Aether OS (Home)
        </SelectItem>
        <SelectItem value="/dinero" className="font-bold focus:bg-white/10 focus:text-mint-DEFAULT cursor-pointer py-2">
          Universo: Dinero
        </SelectItem>
        <SelectItem value="/salud" className="font-bold focus:bg-white/10 focus:text-mint-DEFAULT cursor-pointer py-2">
          Universo: Salud
        </SelectItem>
        <SelectItem value="/desarrollopersonal" className="font-bold focus:bg-white/10 focus:text-mint-DEFAULT cursor-pointer py-2">
          Desarrollo Personal
        </SelectItem>
      </SelectContent>
    </Select>
  );
}