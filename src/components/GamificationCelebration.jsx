import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Award, Zap, X, ChevronRight } from 'lucide-react';
import RankShield2D from './RankShield2D';

export default function GamificationCelebration() {
  const [xpToasts, setXpToasts] = useState([]);
  const [rankUpData, setRankUpData] = useState(null);

  useEffect(() => {
    const handleTaskCompleted = (e) => {
      const detail = e.detail || {};
      const { xpGained, isRankUp, newRank, level } = detail;

      // 1. Trigger Floating XP Toast
      if (xpGained) {
        const id = 'toast-' + Date.now() + Math.random();
        setXpToasts(prev => [...prev, { id, xpGained }]);

        // Auto remove after 2.2 seconds
        setTimeout(() => {
          setXpToasts(prev => prev.filter(t => t.id !== id));
        }, 2200);

        // Subtle haptic vibration
        if ('vibrate' in navigator) {
          try { navigator.vibrate(35); } catch (e) {}
        }
      }

      // 2. Trigger Full-screen Epic Rank Up Celebration Modal
      if (isRankUp && newRank) {
        // Dramatic haptic fanfare
        if ('vibrate' in navigator) {
          try { navigator.vibrate([60, 80, 100, 120, 200]); } catch (e) {}
        }
        setRankUpData({
          newRank,
          level
        });
      }
    };

    window.addEventListener('opentickTaskCompleted', handleTaskCompleted);
    return () => window.removeEventListener('opentickTaskCompleted', handleTaskCompleted);
  }, []);

  return (
    <>
      {/* Floating XP Gain Badges (+10 XP ⭐) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] pointer-events-none flex flex-col items-center gap-2">
        {xpToasts.map(toast => (
          <div
            key={toast.id}
            className="animate-float-xp bg-white text-black font-black text-sm px-4 py-1.5 rounded-full shadow-2xl shadow-black/50 flex items-center gap-1.5 border border-white/80 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>+{toast.xpGained} XP</span>
          </div>
        ))}
      </div>

      {/* Epic Rank Up Modal */}
      {rankUpData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
          {/* Radial Neon Flare Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div 
              className="w-[450px] h-[450px] rounded-full blur-[90px] opacity-30 animate-pulse"
              style={{ background: rankUpData.newRank.color || '#ffffff' }}
            />
          </div>

          <div className="bg-[#121214] border border-white/20 rounded-3xl w-full max-w-sm p-6 text-center text-white shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Top Close Button */}
            <button
              onClick={() => setRankUpData(null)}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800/60 hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Crown Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold mb-4">
              <Crown className="w-3.5 h-3.5 text-white" />
              <span>NOVO RANK CONQUISTADO!</span>
            </div>

            {/* Giant 3D Rank Shield with Glow */}
            <div className="relative my-2 py-4 flex items-center justify-center w-full">
              <div 
                className="absolute inset-0 m-auto w-36 h-36 rounded-full blur-2xl opacity-40"
                style={{ background: rankUpData.newRank.color || '#ffffff' }}
              />
              <div className="relative animate-bounce-gentle">
                <RankShield2D tier={rankUpData.newRank.tier} size={150} />
              </div>
            </div>

            {/* Rank Title & Description */}
            <h2 className="text-2xl font-black text-white tracking-tight mt-2 mb-1">
              {rankUpData.newRank.name}
            </h2>
            <div className="inline-block px-2.5 py-0.5 rounded-lg bg-[#1c1c22] border border-neutral-700 font-mono text-xs text-white font-bold mb-3">
              Nível {rankUpData.level}
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed max-w-[280px] mb-6">
              {rankUpData.newRank.description || 'Sua consistência e dedicação forjaram um novo escudo de poder!'}
            </p>

            {/* Action Button */}
            <button
              onClick={() => setRankUpData(null)}
              className="w-full py-3.5 px-4 bg-white hover:bg-neutral-200 text-black font-black text-sm rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Continuar Dominando! ⚔️</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
