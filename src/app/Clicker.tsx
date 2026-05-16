'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface Particle { id: number; x: number; y: number; value: number; }
interface UserProfile { name: string; email: string; avatar: string; }

export default function Clicker() {
  const [gameState, setGameState] = useState<'hub' | 'clicker'>('hub');
  
  // Игровые состояния
  const [score, setScore] = useState<number>(0);
  const [autoclicks, setAutoclicks] = useState<number>(0);
  const [clickValue, setClickValue] = useState<number>(1);
  const [superclick, setSuperClicks] = useState<number>(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [cloudStatus, setCloudStatus] = useState<string>('Синхронизировано');

  const userEmail = user?.email || null;

  // ФУНКЦИЯ: Отправка данных в облако Supabase
  const saveToCloud = async (currentScore: number, currentAuto: number, currentValue: number, currentSuper: number, email: string) => {
    try {
      setCloudStatus('Сохранение в облако...');
      
      // Метод upsert означает: "Если строка с таким email есть — обнови её, если нет — создай новую"
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          email: email,
          score: currentScore,
          autoclicks: currentAuto,
          click_value: currentValue,
          superclicks: currentSuper,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setCloudStatus('Облако синхронизировано ✓');
    } catch (err) {
      console.error('Ошибка синхронизации:', err);
      setCloudStatus('Ошибка сохранения ❌');
    }
  };

  // 1. ЗАГРУЗКА ДАННЫХ (Сначала локально, потом из облака)
  useEffect(() => {
    const loadProgressForUser = async (email: string | null) => {
      const prefix = email ? `sportik_${email}_` : 'sportik_guest_';
      
      // Сначала быстро берем локальные данные, чтобы игрок не смотрел на пустой экран
      let s = parseInt(localStorage.getItem(`${prefix}score`) || '0');
      let a = parseInt(localStorage.getItem(`${prefix}auto`) || '0');
      let v = parseInt(localStorage.getItem(`${prefix}value`) || '1');
      let sc = parseInt(localStorage.getItem(`${prefix}superclicks`) || '0');

      setScore(s);
      setAutoclicks(a);
      setClickValue(v);
      setSuperClicks(sc);
      setIsAuthLoading(false);

      // Если игрок авторизован — делаем запрос в облако Supabase и сверяем данные!
      if (email) {
        setCloudStatus('Загрузка из облака...');
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('email', email)
          .single();

        if (data && !error) {
          // Если в облаке очков больше, чем локально (например, вошли с другого устройства)
          // берем облачные данные!
          setScore(data.score);
          setAutoclicks(data.autoclicks);
          setClickValue(data.click_value);
          setSuperClicks(data.superclicks);
          setCloudStatus('Данные из облака загружены ✓');
        } else {
          setCloudStatus('Создан новый облачный профиль');
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile = { name: session.user.user_metadata.full_name || 'Игрок', email: session.user.email || '', avatar: '👤' };
        setUser(profile);
        loadProgressForUser(profile.email);
      } else {
        setUser(null);
        loadProgressForUser(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthLoading(true);
      if (session?.user) {
        const profile = { name: session.user.user_metadata.full_name || 'Игрок', email: session.user.email || '', avatar: '👤' };
        setUser(profile);
        loadProgressForUser(profile.email);
      } else {
        setUser(null);
        loadProgressForUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. МГНОВЕННОЕ ЛОКАЛЬНОЕ АВТОСОХРАНЕНИЕ
  useEffect(() => {
    if (isAuthLoading) return;
    const prefix = userEmail ? `sportik_${userEmail}_` : 'sportik_guest_';
    
    localStorage.setItem(`${prefix}score`, score.toString());
    localStorage.setItem(`${prefix}auto`, autoclicks.toString());
    localStorage.setItem(`${prefix}value`, clickValue.toString());
    localStorage.setItem(`${prefix}superclicks`, superclick.toString());
  }, [score, autoclicks, clickValue, superclick, userEmail, isAuthLoading]);

  // 4. ТАЙМЕР ОБЛАЧНОЙ СИНХРОНИЗАЦИИ (Каждые 15 секунд)
  useEffect(() => {
    if (!userEmail || isAuthLoading) return;

    // Запускаем тиканье
    const cloudInterval = setInterval(() => {
      // Передаем самые актуальные состояния из стейта прямо в функцию сохранения
      saveToCloud(score, autoclicks, clickValue, superclick, userEmail);
    }, 15000); // 15000 миллисекунд = 15 секунд

    return () => clearInterval(cloudInterval);
  }, [score, autoclicks, clickValue, superclick, userEmail, isAuthLoading]);


  // 3. АВТОКЛИКЕР
  useEffect(() => {
    if (autoclicks === 0) return;
    const interval = setInterval(() => { setScore(prev => prev + autoclicks); }, 1000);
    return () => clearInterval(interval);
  }, [autoclicks]);

  // ВХОД
  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    localStorage.removeItem('sportik_guest_score');
    localStorage.removeItem('sportik_guest_auto');
    localStorage.removeItem('sportik_guest_value');
    localStorage.removeItem('sportik_guest_superclicks');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' },
    });
    if (error) { alert("Ошибка входа: " + error.message); setIsAuthLoading(false); }
  };

  // ВЫХОД
  const handleLogout = async () => {
    setIsAuthLoading(true);
    
    // ПЕРЕД ВЫХОДОМ: Сначала принудительно сохраняем остатки очков в облако!
    if (userEmail) {
      await saveToCloud(score, autoclicks, clickValue, superclick, userEmail);
    }

    setScore(0);
    setAutoclicks(0);
    setClickValue(1);
    setSuperClicks(0);
    setUser(null);

    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const totalClickPower = clickValue + (superclick * 5);
    setScore(prev => prev + totalClickPower);
    
    const newParticle: Particle = { id: Date.now() + Math.random(), x: e.pageX, y: e.pageY, value: totalClickPower };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => { setParticles(prev => prev.filter(p => p.id !== newParticle.id)); }, 800);
  };

  const autoClickPrice = 50 + (autoclicks * 25);
  const multiplyPrice = Math.round(100 * Math.pow(1.25, clickValue - 1));
  const superClicksPrice = 1000 + (superclick * 1000);

  const rank = (() => {
    if (score < 100) return { text: "Новичок", color: "white" };
    if (score < 500) return { text: "Опытный", color: "yellow" };
    if (score < 2500) return { text: "Мастер клика", color: "orange" };
    return { text: "БОГ клика", color: "green" };
  })();

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
        .google-btn { background: white; color: #333; border: none; padding: 4px 12px; border-radius: 20px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 12px; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
        .google-btn:hover { background: #f1f1f1; transform: scale(1.05); }
        .particle { position: absolute; pointer-events: none; font-weight: bold; font-size: 28px; color: #e94560; text-shadow: 0 0 5px rgba(0,0,0,0.5); animation: floatUp 0.8s ease-out forwards; z-index: 9999; }
        @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-80px); } }
      `}</style>

      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.x, top: p.y }}>+{p.value}</div>
      ))}

      <div className="bg-[#001242] py-2 px-4 flex justify-between items-center text-sm border-b border-blue-900">
        <div className="flex items-center gap-3">
          <div>🚀 Sportik Игрок: <span className="font-bold text-yellow-400">{user ? user.name : "Гость"}</span></div>
          {/* Плашка статуса синхронизации для контроля разработчика */}
          {user && <span className="text-xs px-2 py-0.5 bg-blue-900 rounded text-gray-300">{cloudStatus}</span>}
        </div>
        <div>
          {isAuthLoading ? (
            <span className="text-xs text-gray-400">Сессия...</span>
          ) : user ? (
            <button onClick={handleLogout} className="bg-red-700 px-3 py-1 rounded text-xs hover:bg-red-600 transition">Выйти</button>
          ) : (
            <button onClick={handleGoogleLogin} className="google-btn">🌐 Войти через Google</button>
          )}
        </div>
      </div>

      {gameState === 'hub' ? (
        <div>
          <header className="py-10"><h1 className="text-4xl font-bold">🎮 Sportik Game Hub</h1><p>Выбери игру и стань легендой!</p></header>
          <main className="flex justify-center gap-5 p-12 flex-wrap">
            <div className="game-card">
              <div className="icon">🖱️</div><h3 className="text-xl font-bold">Super Clicker</h3><p className="text-sm my-2">Кликай и побеждай!</p>
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
            <button className="action-btn" disabled={score < autoClickPrice} onClick={() => { if (score >= autoClickPrice) { setScore(prev => prev - autoClickPrice); setAutoclicks(prev => prev + 1); } }}>Купить Автоклик ({autoClickPrice})</button>
            <button className="action-btn" disabled={score < multiplyPrice} onClick={() => { if (score >= multiplyPrice) { setScore(prev => prev - multiplyPrice); setClickValue(prev => prev + 1); } }}>Сильный палец ({multiplyPrice})</button>
            <button className="action-btn" disabled={score < superClicksPrice} onClick={() => { if (score >= superClicksPrice) { setScore(prev => prev - superClicksPrice); setSuperClicks(prev => prev + 1); } }}>Супер клик +5 к клику ({superClicksPrice})</button>
            <p className="mt-3">Звание: <span style={{ color: rank.color }}>{rank.text}</span></p>
          </div>
        </div>
      )}
    </div>
  );
}