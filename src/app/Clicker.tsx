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

  // БУСТ
  const [isBoostActive, setIsBoostActive] = useState<boolean>(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState<number>(0);
  const BOOST_PRICE = 5000;
  const BOOST_DURATION = 15;

  // МАКСИМАЛЬНЫЙ ДОСТИГНУТЫЙ РАНГ
  // 1 - Новичок, 2 - Опытный, 3 - Мастер клика, 4 - БОГ клика
  const [maxRankLevel, setMaxRankLevel] = useState<number>(1);

  const userEmail = user?.email || null;

  // Общее количество купленных улучшений (-1 от стартового клика)
  const totalUpgrades = autoclicks + (clickValue - 1) + superclick;

  // ФУНКЦИЯ: Отправка данных в облако (ИСПРАВЛЕНО: Теперь все 6 аргументов на своих местах)
  const saveToCloud = async (
    currentScore: number, 
    currentAuto: number, 
    currentValue: number, 
    currentSuper: number, 
    currentMaxRank: number, 
    email: string
  ) => {
    try {
      setCloudStatus('Сохранение в облако...');
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          email: email,
          score: currentScore,
          autoclicks: currentAuto,
          click_value: currentValue,
          superclicks: currentSuper,
          max_rank: currentMaxRank, // Поля синхронизированы!
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
      setCloudStatus('Облако синхронизировано ✓');
    } catch (err) {
      console.error('Ошибка синхронизации:', err);
      setCloudStatus('Ошибка сохранения ❌');
    }
  };

  // 1. ЗАГРУЗКА ДАННЫХ
  useEffect(() => {
    const loadProgressForUser = async (email: string | null) => {
      const prefix = email ? `sportik_${email}_` : 'sportik_guest_';
      let s = parseInt(localStorage.getItem(`${prefix}score`) || '0');
      let a = parseInt(localStorage.getItem(`${prefix}auto`) || '0');
      let v = parseInt(localStorage.getItem(`${prefix}value`) || '1');
      let sc = parseInt(localStorage.getItem(`${prefix}superclicks`) || '0');
      let mr = parseInt(localStorage.getItem(`${prefix}maxrank`) || '1');

      setScore(s);
      setAutoclicks(a);
      setClickValue(v);
      setSuperClicks(sc);
      setMaxRankLevel(mr);
      setIsAuthLoading(false);

      if (email) {
        setCloudStatus('Загрузка из облака...');
        const { data, error } = await supabase
          .from('user_progress')
          .select('*')
          .eq('email', email)
          .single();

        if (data && !error) {
          setScore(data.score);
          setAutoclicks(data.autoclicks);
          setClickValue(data.click_value);
          setSuperClicks(data.superclicks);
          if (data.max_rank) setMaxRankLevel(data.max_rank);
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

  // 2. ЛОКАЛЬНОЕ АВТОСОХРАНЕНИЕ
  useEffect(() => {
    if (isAuthLoading) return;
    const prefix = userEmail ? `sportik_${userEmail}_` : 'sportik_guest_';
    localStorage.setItem(`${prefix}score`, score.toString());
    localStorage.setItem(`${prefix}auto`, autoclicks.toString());
    localStorage.setItem(`${prefix}value`, clickValue.toString());
    localStorage.setItem(`${prefix}superclicks`, superclick.toString());
    localStorage.setItem(`${prefix}maxrank`, maxRankLevel.toString());
  }, [score, autoclicks, clickValue, superclick, maxRankLevel, userEmail, isAuthLoading]);

  // 3. ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ
  useEffect(() => {
    if (!userEmail || isAuthLoading) return;
    const cloudInterval = setInterval(() => {
      saveToCloud(score, autoclicks, clickValue, superclick, maxRankLevel, userEmail);
    }, 15000);
    return () => clearInterval(cloudInterval);
  }, [score, autoclicks, clickValue, superclick, maxRankLevel, userEmail, isAuthLoading]);

  // 4. ЛОГИКА РАСЧЕТА РАНГА (ИСПРАВЛЕНО: Убрали бесконечный цикл зависимостей)
  useEffect(() => {
    if (isAuthLoading) return;

    let calculatedLevel = 1;

    if (score >= 250000 && totalUpgrades >= 50) {
      calculatedLevel = 4;
    } else if (score >= 50000 && totalUpgrades >= 30) {
      calculatedLevel = 3;
    } else if (score >= 5000 && totalUpgrades >= 5) {
      calculatedLevel = 2;
    }

    // Изменение стейта происходит только если ранг ДЕЙСТВИТЕЛЬНО вырос
    setMaxRankLevel(prev => (calculatedLevel > prev ? calculatedLevel : prev));
  }, [score, totalUpgrades, isAuthLoading]);

  // АВТОКЛИКЕР
  useEffect(() => {
    if (autoclicks === 0) return;
    const interval = setInterval(() => {
      const finalAutoValue = isBoostActive ? autoclicks * 2 : autoclicks;
      setScore(prev => prev + finalAutoValue);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoclicks, isBoostActive]);

  // ТАЙМЕР БУСТА
  useEffect(() => {
    if (!isBoostActive) return;
    const timer = setInterval(() => {
      setBoostTimeLeft(prev => {
        if (prev <= 1) {
          setIsBoostActive(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBoostActive]);

  // ВХОД / ВЫХОД
  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    localStorage.removeItem('sportik_guest_score');
    localStorage.removeItem('sportik_guest_auto');
    localStorage.removeItem('sportik_guest_value');
    localStorage.removeItem('sportik_guest_superclicks');
    localStorage.removeItem('sportik_guest_maxrank');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' },
    });
    if (error) { alert("Ошибка входа: " + error.message); setIsAuthLoading(false); }
  };

  const handleLogout = async () => {
    setIsAuthLoading(true);
    if (userEmail) { await saveToCloud(score, autoclicks, clickValue, superclick, maxRankLevel, userEmail); }
    setScore(0); setAutoclicks(0); setClickValue(1); setSuperClicks(0); setMaxRankLevel(1); setUser(null);
    await supabase.auth.signOut();
    window.location.reload();
  };

  // КЛИК
  const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    let totalClickPower = clickValue + (superclick * 5);
    if (isBoostActive) { totalClickPower = totalClickPower * 2; }
    setScore(prev => prev + totalClickPower);
    
    const newParticle: Particle = { id: Date.now() + Math.random(), x: e.pageX, y: e.pageY, value: totalClickPower };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => { setParticles(prev => prev.filter(p => p.id !== newParticle.id)); }, 800);
  };

  const handleActivateBoost = () => {
    if (score >= BOOST_PRICE && !isBoostActive) {
      setScore(prev => prev - BOOST_PRICE);
      setBoostTimeLeft(BOOST_DURATION);
      setIsBoostActive(true);
    }
  };

  const autoClickPrice = 50 + (autoclicks * 25);
  const multiplyPrice = Math.round(100 * Math.pow(1.25, clickValue - 1));
  const superClicksPrice = 1000 + (superclick * 1000);

  const boostPercentage = isBoostActive 
    ? (boostTimeLeft / BOOST_DURATION) * 100 
    : Math.min((score / BOOST_PRICE) * 100, 100);

  const rankInfo = (() => {
    switch(maxRankLevel) {
      case 4:
        return { text: "БОГ клика", color: "#00ff00", nextInfo: "Ты достиг вершины эволюции! 👑" };
      case 3:
        return { text: "Мастер клика", color: "orange", nextInfo: `Для ранга "БОГ клика" нужно: 250 000 очков и 50 улучшений (У тебя: ${score} очков, ${totalUpgrades} улутш.)` };
      case 2:
        return { text: "Опытный", color: "yellow", nextInfo: `Для ранга "Мастер клика" нужно: 50 000 очков и 30 улучшений (У тебя: ${score} очков, ${totalUpgrades} улутш.)` };
      case 1:
      default:
        return { text: "Новичок", color: "white", nextInfo: `Для ранга "Опытный" нужно: 5 000 очков и 5 улучшений (У тебя: ${score} очков, ${totalUpgrades} улутш.)` };
    }
  })();

  return (
    <div className="min-h-screen bg-[#000064] text-white font-sans text-center m-0 overflow-hidden select-none">
    <style jsx global>{`
        .game-card { background: #001c69; border: 2px solid #0f3460; border-radius: 15px; padding: 20px; width: 200px; transition: 0.3s; }
        .game-card:hover { transform: translateY(-10px); border-color: #e94560; }
        .icon { font-size: 50px; margin-bottom: 10px; }
        
        .click-btn {
          width: 150px; height: 150px; border-radius: 50%; font-size: 20px;
          color: white; cursor: pointer; font-weight: bold; border: none;
          transition: transform 0.05s, background 0.3s, box-shadow 0.3s;
        }
        .click-btn:active { transform: scale(0.9); }
        .pulse-animation { animation: pulse 1s infinite alternate; border: 3px solid #fff !important; }
        @keyframes pulse { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }

        .action-btn { background: #e94560; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; display: block; margin: 10px auto; }
        .action-btn:disabled { background: gray; cursor: not-allowed; }
        .google-btn { background: white; color: #333; border: none; padding: 4px 12px; border-radius: 20px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-size: 12px; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
        .google-btn:hover { background: #f1f1f1; transform: scale(1.05); }
        
        .particle { position: absolute; pointer-events: none; font-weight: bold; font-size: 28px; text-shadow: 0 0 5px rgba(0,0,0,0.5); animation: floatUp 0.8s ease-out forwards; z-index: 9999; }
        @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-80px); } }

        .boost-container {
          width: 300px; height: 45px; background: #001242; border: 2px solid #0f3460;
          border-radius: 25px; margin: 20px auto; position: relative; overflow: hidden;
          transition: 0.3s;
        }
        .boost-bar { height: 100%; }
        .boost-text {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 14px; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); pointer-events: none;
        }
      `}</style>

      {particles.map(p => (
        <div 
          key={p.id} 
          className="particle" 
          style={{ left: p.x, top: p.y, color: isBoostActive ? '#ffeb3b' : '#e94560' }}
        >
          +{p.value}
        </div>
      ))}

      <div className="bg-[#001242] py-2 px-4 flex justify-between items-center text-sm border-b border-blue-900">
        <div className="flex items-center gap-3">
          <div>🚀 Sportik: <span className="font-bold text-yellow-400">{user ? user.name : "Гость"}</span></div>
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
          <button className="action-btn mb-6" onClick={() => setGameState('hub')}>⬅ В меню</button>
        
          <h2 className="text-3xl font-bold mb-4">Очки: {score}</h2>
          
          {/* ШКАЛА БУСТА */}
          <div 
            className="boost-container" 
            onClick={handleActivateBoost}
            style={{ 
              cursor: score >= BOOST_PRICE && !isBoostActive ? 'pointer' : 'not-allowed',
              boxShadow: score >= BOOST_PRICE && !isBoostActive ? '0 0 15px #00ffcc' : 'none'
            }}
          >
            <div 
              className="boost-bar" 
              style={{ 
                width: `${boostPercentage}%`,
                // ИСПРАВЛЕНО: Заменили ошибочную запятую на точку с запятой
                background: isBoostActive ? 'linear-gradient(90deg, #ff4b2b, #ff416c)' : 'linear-gradient(90deg, #00c6ff, #0072ff)',
                transition: isBoostActive ? 'width 1s linear' : 'width 1.5s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            ></div>
            <div className="boost-text">
              {isBoostActive 
                ? `🔥 БУСТ Х2 АКТИВЕН: ${boostTimeLeft}с` 
                : score >= BOOST_PRICE 
                  ? "ГОРЯЧАЯ ШКАЛА! ЖМИ ДЛЯ АКТИВАЦИИ (5000)" 
                  : `До буста X2: ${score} / ${BOOST_PRICE}`
              }
            </div>
          </div>

          <button
            className={`click-btn mt-4 ${isBoostActive ? 'pulse-animation' : ''}`}
            onClick={handleMainClick}
            style={{
              background: isBoostActive ? 'linear-gradient(45deg, #ff416c, #ff4b2b)' : 'radial-gradient(#e94560, #950740)',
              boxShadow: isBoostActive ? '0 0 35px #ff4b2b' : '0 0 20px rgba(233, 69, 96, 0.5)'
            }}
          >
            КЛИК!
          </button>
          
          <div className="mt-5">
            <button className="action-btn" disabled={score < autoClickPrice} onClick={() => { if (score >= autoClickPrice) { setScore(prev => prev - autoClickPrice); setAutoclicks(prev => prev + 1); } }}>
              ({autoclicks} шт) Купить Автоклик ({autoClickPrice})
            </button>
            
            <button className="action-btn" disabled={score < multiplyPrice} onClick={() => { if (score >= multiplyPrice) { setScore(prev => prev - multiplyPrice); setClickValue(prev => prev + 1); } }}>
              ({clickValue - 1} шт) Сильный палец ({multiplyPrice})
            </button>
            
            <button className="action-btn" disabled={score < superClicksPrice} onClick={() => { if (score >= superClicksPrice) { setScore(prev => prev - superClicksPrice); setSuperClicks(prev => prev + 1); } }}>
              ({superclick} шт) Супер клик +5 к клику ({superClicksPrice})
            </button>
            
            <div className="mt-5 p-4 bg-[#001242] rounded-xl border border-blue-900 inline-block min-w-[320px]">
              <p className="text-lg">Звание: <span style={{ color: rankInfo.color, fontWeight: 'bold' }}>{rankInfo.text}</span></p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto transition-all">{rankInfo.nextInfo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}