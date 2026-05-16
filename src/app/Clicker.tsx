'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface Particle {
  id: number;
  x: number;
  y: number;
  value: number;
}

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

export default function Clicker() {
  const [gameState, setGameState] = useState<'hub' | 'clicker'>('hub');
  
  // Игровые состояния
  const [score, setScore] = useState<number>(0);
  const [autoclicks, setAutoclicks] = useState<number>(0);
  const [clickValue, setClickValue] = useState<number>(1);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  // 1. КОНТРОЛЬ СЕССИИ И ОЧКОВ ПРИ ЗАГРУЗКЕ
  useEffect(() => {
    // Функция загрузки прогресса из памяти для конкретного режима (гость или юзер)
    const loadProgressForUser = (userEmail: string | null) => {
      // Создаем уникальный ключ для сохранения в зависимости от того, вошел ли игрок
      const prefix = userEmail ? `sportik_${userEmail}_` : 'sportik_guest_';
      
      const savedScore = localStorage.getItem(`${prefix}score`);
      const savedAuto = localStorage.getItem(`${prefix}auto`);
      const savedValue = localStorage.getItem(`${prefix}value`);
      
      setScore(savedScore ? parseInt(savedScore) : 0);
      setAutoclicks(savedAuto ? parseInt(savedAuto) : 0);
      setClickValue(savedValue ? parseInt(savedValue) : 1);
    };

    // Проверяем, авторизован ли пользователь в Supabase прямо сейчас
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile = {
          name: session.user.user_metadata.full_name || 'Игрок',
          email: session.user.email || '',
          avatar: '👤'
        };
        setUser(profile);
        loadProgressForUser(profile.email);
      } else {
        setUser(null);
        loadProgressForUser(null);
      }
    });

    // Слушаем глобальные изменения (вход/выход)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const profile = {
          name: session.user.user_metadata.full_name || 'Игрок',
          email: session.user.email || '',
          avatar: '👤'
        };
        setUser(profile);
        loadProgressForUser(profile.email);
      } else {
        setUser(null);
        loadProgressForUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. АВТОСОХРАНЕНИЕ ПРОГРЕССА С УЧЕТОМ ТЕКУЩЕГО АККАУНТА
  useEffect(() => {
    // Определяем, под каким ключом сохранять
    const prefix = user ? `sportik_${user.email}_` : 'sportik_guest_';
    
    localStorage.setItem(`${prefix}score`, score.toString());
    localStorage.setItem(`${prefix}auto`, autoclicks.toString());
    localStorage.setItem(`${prefix}value`, clickValue.toString());
  }, [score, autoclicks, clickValue, user]);

  // 3. АВТОКЛИКЕРА РАБОТА С ПРИНУДИТЕЛЬНЫМ ОБНОВЛЕНИЕМ ЭКРАНА
  useEffect(() => {
    if (autoclicks === 0) return;
    
    const interval = setInterval(() => {
      setScore(prev => prev + autoclicks);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [autoclicks]);

  // НАСТОЯЩИЙ ВХОД ЧЕРЕЗ GOOGLE
  const handleGoogleLogin = async () => {
    // ПРАВИЛО: Очки гостя перед входом стираем, чтобы они не переносились
    localStorage.removeItem('sportik_guest_score');
    localStorage.removeItem('sportik_guest_auto');
    localStorage.removeItem('sportik_guest_value');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : '',
      },
    });
    if (error) alert("Ошибка входа: " + error.message);
  };

  // НАСТОЯЩИЙ ВЫХОД
  const handleLogout = async () => {
    // Сначала обнуляем состояние в коде, чтобы экран мгновенно перерисовал 0
    setScore(0);
    setAutoclicks(0);
    setClickValue(1);
    setUser(null);

    // Выходим из базы данных
    await supabase.auth.signOut();
    
    // Перезагружаем интерфейс для чистоты данных
    window.location.reload();
  };

  // ЛОГИКА КЛИКА
  const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setScore(prev => prev + clickValue);
    
    const newParticle: Particle = {
      id: Date.now() + Math.random(),
      x: e.pageX,
      y: e.pageY,
      value: clickValue
    };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 800);
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
    <div className="min-h-screen bg-[#000064] text-white font-sans text-center m-0 overflow-hidden select-none">
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
        
        .google-btn {
          background: white; color: #333; border: none; padding: 4px 12px; border-radius: 20px;
          font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.2);
        }
        .google-btn:hover { background: #f1f1f1; transform: scale(1.05); }
        
        .particle {
          position: absolute; pointer-events: none; font-weight: bold; font-size: 28px; color: #e94560;
          text-shadow: 0 0 5px rgba(0,0,0,0.5); animation: floatUp 0.8s ease-out forwards; z-index: 9999;
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-80px); }
        }
      `}</style>

      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.x, top: p.y }}>
          +{p.value}
        </div>
      ))}

      <div className="bg-[#001242] py-2 px-4 flex justify-between items-center text-sm border-b border-blue-900">
        <div>🚀 Sportik Игрок: <span className="font-bold text-yellow-400">{user ? user.name : "Гость"}</span></div>
        <div>
          {user ? (
            <button onClick={handleLogout} className="bg-red-700 px-3 py-1 rounded text-xs hover:bg-red-600 transition">Выйти</button>
          ) : (
            <button onClick={handleGoogleLogin} className="google-btn">
              🌐 Войти через Google
            </button>
          )}
        </div>
      </div>

      {gameState === 'hub' ? (
        <div>
          <header className="py-10">
            <h1 className="text-4xl font-bold">🎮 Sportik Game Hub</h1>
            <p>Выбери игру и стань легендой!</p>
          </header>
          <main className="flex justify-center gap-5 p-12 flex-wrap">
            <div className="game-card">
              <div className="icon">🖱️</div>
              <h3 className="text-xl font-bold">Super Clicker</h3>
              <p className="text-sm my-2">Кликай и побеждай!</p>
              <button className="action-btn" onClick={() => setGameState('clicker')}>Играть</button>
            </div>
            <div className="game-card opacity-50"><div className="icon">🐍</div><h3>Snake</h3><p>Скоро...</p></div>
          </main>
        </div>
      ) : (
        <div className="py-10">
          <button className="action-btn mb-10" onClick={() => setGameState('hub')}>⬅ В меню</button>
          <h2 className="text-3xl font-bold mb-4">Очки: {score}</h2>
          <button className="click-btn" onClick={handleMainClick}>КЛИК!</button>
          <div className="mt-5">
            <button className="action-btn" disabled={score < autoClickPrice} onClick={() => {
              if (score >= autoClickPrice) { setScore(prev => prev - autoClickPrice); setAutoclicks(prev => prev + 1); }
            }}>Купить Автоклик ({autoClickPrice})</button>
            <button className="action-btn" disabled={score < multiplyPrice} onClick={() => {
              if (score >= multiplyPrice) { setScore(prev => prev - multiplyPrice); setClickValue(prev => prev + 1); }
            }}>Сильный палец ({multiplyPrice})</button>
            <p className="mt-3">Звание: <span style={{ color: rank.color }}>{rank.text}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}