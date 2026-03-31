import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAetherStore } from '../../../core/store';

// Función matemática para dibujar los gajos polares
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

export default function DashboardPage() {
  const { universes, updateScore } = useAetherStore();
  const navigate = useNavigate();
  
  const [hoveredUniverse, setHoveredUniverse] = useState<string | null>(null);

  const size = 1200; 
  const center = size / 2;
  const maxRadius = 260; 
  const anglePerSlice = 360 / universes.length;

  const activeUniverseData = universes.find(u => u.id === hoveredUniverse);
  const isHovering = hoveredUniverse !== null;
  
  const appBgColor = isHovering && activeUniverseData ? activeUniverseData.deepBg : '#FAF9F6';
  const appTextColor = isHovering ? '#FFFFFF' : '#2D2A26';
  const secondaryTextColor = isHovering ? 'rgba(255,255,255,0.7)' : '#8A8681';
  const panelBgColor = isHovering ? 'rgba(255,255,255,0.05)' : '#FFFFFF';
  const panelBorderColor = isHovering ? 'rgba(255,255,255,0.1)' : '#E8E6E1';

  return (
    <div 
      className="min-h-screen transition-colors duration-700 ease-in-out pb-24 flex flex-col items-center font-sans"
      style={{ backgroundColor: appBgColor, color: appTextColor }}
    >
      
      {/* HEADER PREMIUM */}
      <header className="w-full max-w-5xl flex justify-between items-center p-6 md:p-8 transition-colors duration-700">
        <div>
          <h1 className="text-3xl font-serif tracking-tight transition-colors duration-700">Aether OS</h1>
          <p className="text-xs uppercase tracking-[0.2em] mt-1 font-medium transition-colors duration-700" style={{ color: secondaryTextColor }}>
            Dashboard Central
          </p>
        </div>
        <div 
          className="px-4 py-2 rounded-full border shadow-sm flex items-center gap-2 transition-all duration-700 backdrop-blur-md"
          style={{ backgroundColor: panelBgColor, borderColor: panelBorderColor }}
        >
          <Sparkles className="w-4 h-4 transition-colors duration-700" style={{ color: isHovering && activeUniverseData ? activeUniverseData.color : '#E08C4A' }} />
          <span className="text-xs font-medium uppercase tracking-wider transition-colors duration-700 hidden md:inline">Buen día, Lucas</span>
          <span className="text-xs font-medium uppercase tracking-wider transition-colors duration-700 md:hidden">Lucas</span>
        </div>
      </header>

      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-start justify-center px-2 md:px-8 mt-4">
        
        {/* LA RUEDA VIVA */}
        <div className="relative w-full max-w-[750px] aspect-square flex items-center justify-center">
          
          <div className="w-full h-full relative z-10">
            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
              
              {/* Grilla sutil de fondo */}
              {[2, 4, 6, 8, 10].map((step) => (
                <circle 
                  key={step} 
                  cx={center} 
                  cy={center} 
                  r={(step / 10) * maxRadius} 
                  fill="none" 
                  stroke={isHovering ? 'rgba(255,255,255,0.1)' : '#E8E6E1'} 
                  strokeWidth="2" 
                  className="transition-colors duration-700"
                />
              ))}

              {/* Dibujo de Gajos y Etiquetas */}
              {universes.map((item, i) => {
                const startAngle = i * anglePerSlice;
                const endAngle = (i + 1) * anglePerSlice;
                const radius = (item.score / 10) * maxRadius;
                
                const p1 = polarToCartesian(center, center, radius, startAngle);
                const p2 = polarToCartesian(center, center, radius, endAngle);
                
                const d = [
                  "M", center, center,
                  "L", p1.x, p1.y,
                  "A", radius, radius, 0, 0, 1, p2.x, p2.y,
                  "Z"
                ].join(" ");

                const labelRadius = maxRadius + 160;
                const labelPos = polarToCartesian(center, center, labelRadius, startAngle + (anglePerSlice / 2));
                const Icon = item.icon;

                const isThisHovered = hoveredUniverse === item.id;
                const isAnotherHovered = isHovering && !isThisHovered;

                return (
                  <g 
                    key={item.id}
                    onMouseEnter={() => setHoveredUniverse(item.id)}
                    onMouseLeave={() => setHoveredUniverse(null)}
                    onClick={() => navigate(`/${item.id}`)} // Mantiene el clic si tocás el color
                    className="cursor-pointer group outline-none"
                  >
                    {/* El Gajo Sólido */}
                    <path 
                      d={d} 
                      fill={item.color} 
                      className={`transition-all duration-500 ease-out origin-center ${isThisHovered ? 'opacity-100 scale-105 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]' : isAnotherHovered ? 'opacity-30 scale-95' : 'opacity-90 scale-100'}`}
                    />
                    
                    {/* Líneas divisorias */}
                    <line 
                      x1={center} y1={center} 
                      x2={polarToCartesian(center, center, maxRadius, startAngle).x} 
                      y2={polarToCartesian(center, center, maxRadius, startAngle).y} 
                      stroke={appBgColor} 
                      strokeWidth="6"
                      className="transition-colors duration-700"
                    />

                    {/* DISEÑO ORBITAL (Ahora con soporte de clic sólido en ícono y texto) */}
                    <foreignObject 
                      x={labelPos.x - 170} 
                      y={labelPos.y - 80} 
                      width="340" 
                      height="160"
                      className="overflow-visible pointer-events-none"
                    >
                      <div className={`flex flex-col items-center justify-center h-full transition-all duration-500 ${isAnotherHovered ? 'opacity-50' : 'opacity-100'}`}>
                        {/* ESTE DIV AHORA ATRAPA LOS CLICS EXACTAMENTE EN EL TEXTO E ÍCONO */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation(); // Evita clics duplicados
                            navigate(`/${item.id}`);
                          }}
                          className="flex flex-col items-center pointer-events-auto cursor-pointer"
                        >
                          <div 
                            className="p-5 rounded-full transition-all duration-500 shadow-md"
                            style={{ 
                              backgroundColor: isThisHovered ? item.color : panelBgColor,
                              color: isThisHovered ? '#FFF' : item.color,
                              border: `2px solid ${isThisHovered ? item.color : panelBorderColor}`
                            }}
                          >
                            <Icon size={48} strokeWidth={isThisHovered ? 2.5 : 2} />
                          </div>
                          <span 
                            className="text-[32px] uppercase tracking-[0.15em] mt-5 font-bold text-center leading-tight transition-colors duration-500"
                            style={{ color: isThisHovered ? '#FFF' : appTextColor }}
                          >
                            {item.label}
                          </span>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
              
              {/* Núcleo Central */}
              <circle 
                cx={center} cy={center} r="14" 
                fill={isHovering ? '#FFFFFF' : '#FAF9F6'} 
                stroke={isHovering ? 'rgba(255,255,255,0.2)' : '#2D2A26'} 
                strokeWidth="4" 
                className="z-20 transition-all duration-700" 
              />
            </svg>
          </div>
        </div>

        {/* PANEL DE CONTROL (Sliders) */}
        <div 
          className="w-full lg:w-[400px] flex flex-col gap-6 p-6 md:p-8 rounded-3xl backdrop-blur-xl transition-all duration-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mx-4 md:mx-0"
          style={{ backgroundColor: panelBgColor, border: `1px solid ${panelBorderColor}` }}
        >
          <div className="border-b pb-4 mb-2 transition-colors duration-700" style={{ borderColor: panelBorderColor }}>
            <h2 className="text-xl font-serif tracking-wide">Ajuste de Frecuencias</h2>
            <p className="text-sm mt-1.5 transition-colors duration-700" style={{ color: secondaryTextColor }}>
              {isHovering && activeUniverseData ? `Modificando: ${activeUniverseData.label}` : 'Deslizá para calibrar tu estado actual'}
            </p>
          </div>
          
          <div className="flex flex-col gap-7 pb-2">
            {universes.map((item) => {
              const isThisHovered = hoveredUniverse === item.id;
              const isAnotherHovered = isHovering && !isThisHovered;

              return (
                <div 
                  key={item.id} 
                  className={`flex flex-col gap-3 transition-all duration-500 ${isAnotherHovered ? 'opacity-40' : 'opacity-100'}`}
                  onMouseEnter={() => setHoveredUniverse(item.id)}
                  onMouseLeave={() => setHoveredUniverse(null)}
                >
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: item.color }}>
                      {item.label}
                    </span>
                    <span 
                      className="text-lg font-serif font-bold px-4 py-1.5 rounded-xl transition-colors duration-500"
                      style={{ 
                        backgroundColor: isThisHovered ? item.color : (isHovering ? 'rgba(255,255,255,0.1)' : '#F3F1EC'),
                        color: isThisHovered ? '#FFFFFF' : appTextColor
                      }}
                    >
                      {item.score}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1" max="10" step="1"
                    value={item.score}
                    onChange={(e) => updateScore(item.id, parseInt(e.target.value))}
                    className="w-full h-2.5 rounded-full appearance-none cursor-pointer transition-colors duration-500 outline-none"
                    style={{ 
                      backgroundColor: isHovering ? 'rgba(255,255,255,0.1)' : '#E8E6E1',
                      accentColor: item.color 
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}