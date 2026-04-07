import React from 'react';

export function DineroCalendar() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/10 rounded-[20px] shadow-sm flex flex-col justify-center items-center py-16 border border-white/10">
         <h3 className="text-xl font-bold text-white mb-2">Calendar</h3>
         <p className="text-sm text-white/60 max-w-md text-center">Your financial calendar events will be here.</p>
      </div>
    </div>
  );
}