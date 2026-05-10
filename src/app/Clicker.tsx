'use client';

import React, { useState, useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  value: number;
}

export default function Clicker() {
  const [gameState, setGameState] = useState<'hub' | 'clicker'>('hub');
  const [score, setScore] = useState(0);
  const [autoclicks, setAutoclicks] = useState(0);
  const [clickValue, setClickValue] = useState(1);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const savedScore = localStorage.getItem('clickScore');
    const savedAuto = localStorage.getItem('clickAuto');
    const savedValue = localStorage.getItem('clickValue');
    if (savedScore) setScore(parseInt(savedScore));
    if (savedAuto) setAutoclicks(parseInt(savedAuto));
    if (savedValue) setClickValue(parseInt(savedValue));
  }, []);

  useEffect(() => {
    localStorage.setItem('clickScore', score.toString());
    localStorage.setItem('clickAuto', autoclicks.toString());
    localStorage.setItem('clickValue', clickValue.toString());
  }, [score, autoclicks, clickValue]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (autoclicks > 0) setScore(prev => prev + autoclicks);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoclicks]);

  const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setScore(score + clickValue);
    const newParticle: Particle = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
      value: clickValue
    };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);
  };

  const autoClickPrice = 50 + (autoclicks * 25);
  const multiplyPrice = Math.round(100 * Math.pow(1.25, clickValue - 1));

  const getRank = () => {
    if (score < 100) return { text: "Новичок", color: "white" };
    if (score < 500) return { text: "Опытный", color: "yellow" };
    if (score < 2500) return { text: "Мастер клика", color: "orange" };
    return { text: "БОГ клика", color: "green" };
  };

  const rank = getRank();

  return (
    <div className="min-h-screen bg-[#000064] text-white font-sans text-center m-0 overflow-hidden">
      <style jsx global>{`
        .game-card { background: #001c69; border: 2px solid #0f3460; border-radius: 15px; padding: 20px; width: 200px; transition: 0.3s; cursor: pointer; }
        .game-card:hover { transform: translateY(-10px); border-color: #e94560; }
        .icon { font-size: 50px; margin-bottom: 10px; }
        .click-btn {
          width: 150px; height: 150px; border-radius: 50%; font-size: 20px;
          background: radial-gradient(#e94560, #950740);
          box-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
          border: none; color: white; cursor: pointer; font-weight: bold; transition: transform 0.05s;
        }
        .click-btn:active { transform: scale(0.9); }
        .action-btn { background: #e94560; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; display: block; margin: 10px auto; }
        .action-btn:disabled { background: gray; cursor: not-allowed; }
        .particle {
          position: fixed; pointer-events: none; font-weight: bold; font-size: 24px; color: #e94560;
          animation: floatUp 1s ease-out forwards; z-index: 100;
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-100px); }
        }
      `}</style>

      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.x, top: p.y }}>
          +{p.value}
        </div>
      ))}

      {gameState === 'hub' ? (
        <div>
          <header className="py-10">
            <h1 className="text-4xl font-bold">🎮 Sportik Game Hub</h1>
            <p>Выбери игру и стань легендой!</p>
          </header>
          <main className="flex justify-center gap-5 p-12 flex-wrap">
            <div className="game-card" onClick={() => setGameState('clicker')}>
              <div className="icon">🖱️</div>
              <h3 className="text-xl font-bold">Super Clicker</h3>
              <p className="text-sm my-2">Кликай и побеждай!</p>
              <button className="action-btn">Играть</button>
            </div>
          </main>
        </div>
      ) : (
        <div className="py-10">
          <button className="action-btn mb-10" onClick={() => setGameState('hub')}>⬅ В меню</button>
          <h2 className="text-3xl font-bold mb-4">Очки: {score}</h2>
          <button className="click-btn" onClick={handleMainClick}>КЛИК!</button>
          <div className="mt-5">
            <button className="action-btn" disabled={score < autoClickPrice} onClick={() => {
              if (score >= autoClickPrice) { setScore(score - autoClickPrice); setAutoclicks(autoclicks + 1); }
            }}>Купить Автоклик ({autoClickPrice})</button>
            <button className="action-btn" disabled={score < multiplyPrice} onClick={() => {
              if (score >= multiplyPrice) { setScore(score - multiplyPrice); setClickValue(clickValue + 1); }
            }}>Сильный палец ({multiplyPrice})</button>
            <p>Звание: <span style={{ color: rank.color }}>{rank.text}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}