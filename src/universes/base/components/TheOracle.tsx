import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TheOracleProps {
  insight?: string;
}

const TheOracle: React.FC<TheOracleProps> = ({ 
  insight = "The mind is the architect of reality." 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center justify-center">
      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            layoutId="oracle-container"
            onClick={() => setIsOpen(true)}
            className="w-4 h-4 rounded-full cursor-pointer"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              boxShadow: '0 0 20px 4px rgba(255,255,255,0.3)',
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            whileHover={{ scale: 1.8, filter: 'brightness(1.5)' }}
            whileTap={{ scale: 0.9 }}
          />
        ) : (
          <motion.div
            layoutId="oracle-container"
            className="liquid-glass rounded-2xl p-6 max-w-sm w-full mx-4 cursor-pointer flex flex-col items-center justify-center"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3 font-bold">
                The Oracle
              </div>
              <div className="text-lg font-serif italic engraved-text">
                "{insight}"
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TheOracle;
