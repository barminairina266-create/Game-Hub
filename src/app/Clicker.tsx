'use client';

import React, { useState, useEffect } from 'react';

// Структура для вылетающих цифр
interface Particle {
  id: number;
  x: number;
  y: number;
  value: number;
}

// Структура для данных пользователя
interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export default function Clicker() {
  // Экраны приложения
  const [gameState, setGameState] = useState<'hub' | 'clicker'>('hub');
  
  // Игровые состояния
  const [score, setScore] = useState(0);
  const [autoclicks, setAutoclicks] = useState(0);
  const [clickValue, setClickValue] = useState(1);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Состояние авторизации (null - гость, объект - вошел через Google)
  const [user, setUser] = useState<UserProfile | null>(null);

  // 1. ЗАГРУЗКА ДАННЫХ ПРИ СТАРТЕ
  useEffect(() => {
    // Проверяем, вошел ли пользователь ранее (имитация сессии Google)
    const savedUser = localStorage.getItem('Saved_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedScore = localStorage.getItem('clickScore');
    const savedAuto = localStorage.getItem('clickAuto');
    const savedValue = localStorage.getItem('clickValue');
    
    if (savedScore) setScore(parseInt(savedScore));
    if (savedAuto) setAutoclicks(parseInt(savedAuto));
    if (savedValue) setClickValue(parseInt(savedValue));
  }, []);

  // 2. АВТОСОХРАНЕНИЕ ПРОГРЕССА
  useEffect(() => {
    localStorage.setItem('clickScore', score.toString());
    localStorage.setItem('clickAuto', autoclicks.toString());
    localStorage.setItem('clickValue', clickValue.toString());
  }, [score, autoclicks, clickValue]);

  // 3. РАБОТА АВТОКЛИКЕРА
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoclicks > 0) setScore(prev => prev + autoclicks);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoclicks]);

  // ИМИТАЦИЯ ВХОДА ЧЕРЕЗ GOOGLE (Для работы прямо сейчас без настройки серверов)
  const handleGoogleLogin = () => {
    // Создаем профиль, как будто Google вернул нам данные игрока
    const mockUser: UserProfile = {
      name: "Andrey Sportik",
      email: "andrey@gmail.com",
      avatar: "👤"
    };
    setUser(mockUser);
    localStorage.setItem('Saved_user', JSON.stringify(mockUser));
    alert("Успешный вход через Google! Ваш прогресс теперь привязан к облаку.");
  };

  // ВЫХОД ИЗ АККАУНТА
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('Saved_user');
  };

  // ЛОГИКА КЛИКА С ЦИФРАМИ
  const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setScore(score + clickValue);
    const newParticle: Particle = {
      id: Date.now(),
      x: e.pageX,
      y: e.pageY,
      value: clickValue
    };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);
  };

  // ЦЕНЫ
  const autoClickPrice = 50 + (autoclicks * 25);
  const multiplyPrice = Math.round(100 * Math.pow(1.25, clickValue - 1));

  // ЗВАНИЯ
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
        .game-card { background: #001c69; border: 2px solid #0f3460; border-radius: 15px; padding: 20px; width: 200px; transition: 0.3s; }
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
        
        /* Кнопка Google */
        .google-btn {
          background: white; color: #333; border: none; padding: 8px 16px; border-radius: 20px;
          font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
          margin-top: 15px; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        .google-btn:hover { background: #f1f1f1; transform: scale(1.05); }
        
        .particle {
          position: absolute; pointer-events: none; font-weight: bold; font-size: 28px; color: #e94560;
          text-shadow: 0 0 5px rgba(0,0,0,0.5); animation: floatUp 1s ease-out forwards; z-index: 9999;
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-100px); }
        }
      `}</style>

      {/* Вылетающие цифры */}
      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.x, top: p.y }}>
          +{p.value}
        </div>
      ))}

      {/* ШАПКА АВТОРИЗАЦИИ */}
      <div className="bg-[#001242] py-2 px-4 flex justify-between items-center text-sm border-b border-blue-900">
        <div>🚀 Игрок: <span className="font-bold text-yellow-400">{user ? user.name : "Гость"}</span></div>
        <div>
          {user ? (
            <button onClick={handleLogout} className="bg-red-700 px-3 py-1 rounded text-xs hover:bg-red-600 transition">Выйти</button>
          ) : (
            <button onClick={handleGoogleLogin} className="google-btn" style={{margin: 0, padding: '4px 12px', fontSize: '12px'}}>
              🌐 Войти через Google
            </button>
          )}
        </div>
      </div>

      {gameState === 'hub' ? (
        /* ЭКРАН ХАБА */
        <div>
          <header className="py-10">
            <h1 className="text-4xl font-bold">🎮 Sportik Game Hub</h1>
            <p>Выбери игру и стань легендой!</p>
            {!user && <p className="text-xs text-red-400 mt-2">⚠️ Войдите в Google, чтобы прогресс не удалился при очистке кэша!</p>}
          </header>
          <main className="flex justify-center gap-5 p-12 flex-wrap">
            <div className="game-card">
              <div className="icon">🖱️</div>
              <h3 className="text-xl font-bold">Super Clicker</h3>
              <p className="text-sm my-2">Кликай и побеждай!</p>
              <button className="action-btn" onClick={() => setGameState('clicker')}>Играть</button>
            </div>
            
            <div className="game-card opacity-50">
              <div className="icon">🐍</div>
              <h3>Snake</h3>
              <p>Скоро...</p>
            </div>
          </main>
        </div>
      ) : (
        /* ЭКРАН ИГРЫ */
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
            <p className="mt-3">Звание: <span style={{ color: rank.color }}>{rank.text}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}