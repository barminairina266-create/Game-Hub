'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  // Состояния для переключения экранов и данных игры
  const [gameState, setGameState] = useState<'hub' | 'clicker'>('hub');
  const [score, setScore] = useState(0);
  const [autoclicks, setAutoclicks] = useState(0);
  const [clickValue, setClickValue] = useState(1);

  // Загрузка данных при старте
  useEffect(() => {
    const savedScore = localStorage.getItem('clickScore');
    const savedAuto = localStorage.getItem('clickAuto');
    const savedValue = localStorage.getItem('clickValue');
    
    if (savedScore) setScore(parseInt(savedScore));
    if (savedAuto) setAutoclicks(parseInt(savedAuto));
    if (savedValue) setClickValue(parseInt(savedValue));
  }, []);

  // Сохранение данных при изменении
  useEffect(() => {
    localStorage.setItem('clickScore', score.toString());
    localStorage.setItem('clickAuto', autoclicks.toString());
    localStorage.setItem('clickValue', clickValue.toString());
  }, [score, autoclicks, clickValue]);

  // Логика автокликера
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoclicks > 0) {
        setScore(prev => prev + autoclicks);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [autoclicks]);

  // Расчет цен
  const autoClickPrice = 50 + (autoclicks * 25);
  const multiplyPrice = Math.round(100 * Math.pow(1.25, clickValue - 1));

  // Определение звания
  const getRank = () => {
    if (score < 100) return { text: "Новичок", color: "white" };
    if (score < 500) return { text: "Опытный", color: "yellow" };
    if (score < 2500) return { text: "Мастер клика", color: "orange" };
    return { text: "БОГ клика", color: "green" };
  };

  const rank = getRank();

  return (
    <div className="min-h-screen bg-[#000064] text-white font-sans text-center m-0">
      <style jsx global>{`
        .game-card {
          background: #001c69;
          border: 2px solid #0f3460;
          border-radius: 15px;
          padding: 20px;
          width: 200px;
          transition: 0.3s;
        }
        .game-card:hover {
          transform: translateY(-10px);
          border-color: #e94560;
        }
        .icon { font-size: 50px; margin-bottom: 10px; }
        .click-btn {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          font-size: 20px;
          background: radial-gradient(#e94560, #950740);
          box-shadow: 0 0 20px rgba(233, 69, 96, 0.5);
          border: none;
          color: white;
          cursor: pointer;
          font-weight: bold;
          transition: transform 0.05s;
        }
        .click-btn:active { transform: scale(0.95); }
        .action-btn {
          background: #e94560;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          display: block;
          margin: 10px auto;
        }
        .action-btn:disabled { background: gray; cursor: not-allowed; }
      `}</style>

      {gameState === 'hub' ? (
        /* ХАБ (МЕНЮ) */
        <div>
          <header className="py-10">
            <h1 className="text-4xl font-bold">🎮 Game Arcade 2026</h1>
            <p>Выбери игру и поставь новый рекорд!</p>
          </header>

          <main className="flex justify-center gap-5 p-12 flex-wrap">
            <div className="game-card">
              <div className="icon">🖱️</div>
              <h3 className="text-xl font-bold">Super Clicker</h3>
              <p className="text-sm my-2">Кликай как бешеный, чтобы разбогатеть!</p>
              <button className="action-btn" onClick={() => setGameState('clicker')}>Играть</button>
            </div>

            <div className="game-card opacity-50">
              <div className="icon">🐍</div>
              <h3>Snake</h3>
              <p>Скоро появится...</p>
            </div>
            
            <div className="game-card opacity-50">
              <div className="icon">🧩</div>
              <h3>2048</h3>
              <p>В разработке...</p>
            </div>
          </main>
        </div>
      ) : (
        /* ЭКРАН ИГРЫ */
        <div className="py-10">
          <button className="action-btn mb-10" onClick={() => setGameState('hub')}>⬅ Назад в меню</button>
          
          <div id="game-content">
            <h2 className="text-3xl font-bold mb-4">Очки: <span>{score}</span></h2>
            <button className="click-btn" onClick={() => setScore(score + clickValue)}>КЛИК!</button>
            <hr className="my-5 border-blue-900" />
            
            <button 
              className="action-btn"
              disabled={score < autoClickPrice}
              onClick={() => {
                if (score >= autoClickPrice) {
                  setScore(score - autoClickPrice);
                  setAutoclicks(autoclicks + 1);
                }
              }}
            >
              Купить Автоклик (Цена: {autoClickPrice})
            </button>
            <p>Куплено автокликов: {autoclicks}</p>
            
            <h3 className="mt-5">Звание: <span style={{ color: rank.color }}>{rank.text}</span></h3>
            
            <button 
              className="action-btn"
              disabled={score < multiplyPrice}
              onClick={() => {
                if (score >= multiplyPrice) {
                  setScore(score - multiplyPrice);
                  setClickValue(clickValue + 1);
                }
              }}
            >
              Сильный палец (Цена: {multiplyPrice})
            </button>
            <p>Сила клика: x{clickValue}</p>
            <p className="text-xs text-gray-400 mt-4">Прогресс сохраняется автоматически!</p>
          </div>
        </div>
      )}
    </div>
  );
}