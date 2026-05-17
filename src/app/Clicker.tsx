'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

interface Particle { id: number; x: number; y: number; value: number; }
interface UserProfile { name: string; email: string; avatar: string; }

// Доступные цветовые темы
type ThemeId = 'purple' | 'red' | 'blue' | 'green';
interface ThemeConfig {
  name: string;
  bgGradient: string;
  cardBg: string;
  borderColor: string;
  shadowColor: string;
}

const THEMES: Record<ThemeId, ThemeConfig> = {
  purple: {
    name: '🔮 Фиолет',
    bgGradient: 'linear-gradient(135deg, #1f003a, #0d001a, #000040)',
    cardBg: '#2d0054',
    borderColor: '#5e00b3',
    shadowColor: '#1a0033'
  },
  red: {
    name: '🩸 Красный',
    bgGradient: 'linear-gradient(135deg, #3a0000, #1a0000, #000040)',
    cardBg: '#540000',
    borderColor: '#b30000',
    shadowColor: '#330000'
  },
  blue: {
    name: '💎 Синий',
    bgGradient: 'linear-gradient(135deg, #001f4d, #000d1a, #000033)',
    cardBg: '#002b66',
    borderColor: '#0055cc',
    shadowColor: '#001a33'
  },
  green: {
    name: '🧪 Зеленый',
    bgGradient: 'linear-gradient(135deg, #002e17, #00140a, #000022)',
    cardBg: '#004221',
    borderColor: '#008f47',
    shadowColor: '#002411'
  }
};

export default function Clicker() {
  const [gameState, setGameState] = useState<'hub' | 'clicker'>('hub');
  
  // Кастомизация интерфейса
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('purple');

  // Игровые состояния
  const [score, setScore] = useState<number>(0);
  const [autoclicks, setAutoclicks] = useState<number>(0);
  const [clickValue, setClickValue] = useState<number>(1);
  const [superclick, setSuperClicks] = useState<number>(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [cloudStatus, setCloudStatus] = useState<string>('Синхронизировано');

  // БУСТ Х2 (За очки)
  const [isBoostActive, setIsBoostActive] = useState<boolean>(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState<number>(0);
  const BOOST_PRICE = 5000;
  const BOOST_DURATION = 15;

  // БУСТ Х3 (За клики)
  const [clickCount, setClickCount] = useState<number>(0);
  const [isBoost3xActive, setIsBoost3xActive] = useState<boolean>(false);
  const [boost3xTimeLeft, setBoost3xTimeLeft] = useState<number>(0);
  const BOOST3X_GOAL = 1000;
  const BOOST3X_DURATION = 10;

  // МАКСИМАЛЬНЫЙ ДОСТИГНУТЫЙ РАНГ
const [maxRankLevel, setMaxRankLevel] = useState<number>(1);

  const userEmail = user?.email || null;
const totalUpgrades = autoclicks + (clickValue - 1) + superclick;
  const activeTheme = THEMES[currentTheme];

  // ФУНКЦИЯ: Отправка данных в облако
  const saveToCloud = async (currentScore: number, currentAuto: number, currentValue: number, currentSuper: number, currentMaxRank: number, email: string) => {
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
          max_rank: currentMaxRank,
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
      let cc = parseInt(localStorage.getItem(`${prefix}clickcount`) || '0');
      let th = (localStorage.getItem('sportik_theme') as ThemeId) || 'purple';

      setScore(s);
      setAutoclicks(a);
      setClickValue(v);
      setSuperClicks(sc);
      setMaxRankLevel(mr);
      setClickCount(cc);
      setCurrentTheme(th);
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
    localStorage.setItem(`${prefix}clickcount`, clickCount.toString());
    localStorage.setItem('sportik_theme', currentTheme);
  }, [score, autoclicks, clickValue, superclick, maxRankLevel, clickCount, currentTheme, userEmail, isAuthLoading]);

  // 3. ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ
  useEffect(() => {
    if (!userEmail || isAuthLoading) return;
    const cloudInterval = setInterval(() => {
      saveToCloud(score, autoclicks, clickValue, superclick, maxRankLevel, userEmail);
    }, 15000);
    return () => clearInterval(cloudInterval);
  }, [score, autoclicks, clickValue, superclick, maxRankLevel, userEmail, isAuthLoading]);

  // 4. ЛОГИКА РАСЧЕТА РАНГА
  useEffect(() => {
    if (isAuthLoading) return;
  let calculatedLevel = 1;
    if (score >= 250000 && totalUpgrades >= 50) calculatedLevel = 4;
    else if (score >= 50000 && totalUpgrades >= 30) calculatedLevel = 3;
    else if (score >= 5000 && totalUpgrades >= 5) calculatedLevel = 2;

    setMaxRankLevel(prev => (calculatedLevel > prev ? calculatedLevel : prev));
  }, [score, totalUpgrades, isAuthLoading]);

  // АВТОКЛИКЕР
  useEffect(() => {
    if (autoclicks === 0) return;
    const interval = setInterval(() => {
      let finalAutoValue = autoclicks;
      if (isBoost3xActive) finalAutoValue = autoclicks * 3;
      else if (isBoostActive) finalAutoValue = autoclicks * 2;
      setScore(prev => prev + finalAutoValue);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoclicks, isBoostActive, isBoost3xActive]);

  // ТАЙМЕРЫ БУСТОВ
  useEffect(() => {
    if (!isBoostActive) return;
    const timer = setInterval(() => {
      setBoostTimeLeft(prev => {
        if (prev <= 1) { setIsBoostActive(false); clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBoostActive]);

  useEffect(() => {
    if (!isBoost3xActive) return;
    const timer = setInterval(() => {
      setBoost3xTimeLeft(prev => {
        if (prev <= 1) { setIsBoost3xActive(false); clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBoost3xActive]);

  // ВХОД / ВЫХОД
  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    localStorage.removeItem('sportik_guest_score');
    localStorage.removeItem('sportik_guest_auto');
    localStorage.removeItem('sportik_guest_value');
    localStorage.removeItem('sportik_guest_superclicks');
    localStorage.removeItem('sportik_guest_maxrank');
    localStorage.removeItem('sportik_guest_clickcount');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' },
    });
    if (error) { alert("Ошибка входа: " + error.message); setIsAuthLoading(false); }
  };

  const handleLogout = async () => {
    setIsAuthLoading(true);
    if (userEmail) { await saveToCloud(score, autoclicks, clickValue, superclick, maxRankLevel, userEmail); }
    setScore(0); setAutoclicks(0); setClickValue(1); setSuperClicks(0); setMaxRankLevel(1); setClickCount(0); setUser(null);
    await supabase.auth.signOut();
    window.location.reload();
  };

  // КЛИК
  const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    let totalClickPower = clickValue + (superclick * 5);
    if (isBoost3xActive) totalClickPower = totalClickPower * 3;
    else if (isBoostActive) totalClickPower = totalClickPower * 2;

    setScore(prev => prev + totalClickPower);
    if (!isBoost3xActive && clickCount < BOOST3X_GOAL) {
      setClickCount(prev => Math.min(prev + 1, BOOST3X_GOAL));
    }
    
    let particleColor = '#e94560';
    if (isBoost3xActive) particleColor = '#00ff66';
    else if (isBoostActive) particleColor = '#ffeb3b';

    const newParticle: Particle = { id: Date.now() + Math.random(), x: e.pageX, y: e.pageY, value: totalClickPower };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => { setParticles(prev => prev.filter(p => p.id !== newParticle.id)); }, 800);
  };

  const handleActivateBoost = () => {
    if (isBoost3xActive) return;
    if (score >= BOOST_PRICE && !isBoostActive) {
      setScore(prev => prev - BOOST_PRICE);
      setBoostTimeLeft(BOOST_DURATION);
      setIsBoostActive(true);
    }
  };

  const handleActivateBoost3x = () => {
    if (isBoostActive) return;
    if (clickCount >= BOOST3X_GOAL && !isBoost3xActive) {
      setClickCount(0);
      setBoost3xTimeLeft(BOOST3X_DURATION);
      setIsBoost3xActive(true);
    }
  };

  const autoClickPrice = 50 + (autoclicks * 25);
  const multiplyPrice = Math.round(100 * Math.pow(1.25, clickValue - 1));
  const superClicksPrice = 1000 + (superclick * 1000);

  const boostPercentage = isBoostActive ? (boostTimeLeft / BOOST_DURATION) * 100 : Math.min((score / BOOST_PRICE) * 100, 100);
  const boost3xPercentage = isBoost3xActive ? (boost3xTimeLeft / BOOST3X_DURATION) * 100 : Math.min((clickCount / BOOST3X_GOAL) * 100, 100);

  const rankInfo = (() => {
    switch(maxRankLevel) {
      case 4: return { text: "БОГ клика", color: "#00ff00", nextInfo: "Ты достиг вершины эволюции! 👑" };
      case 3: return { text: "Мастер клика", color: "orange", nextInfo: `Для ранга "БОГ клика" нужно: 250 000 очков и 50 улучшений` };
      case 2: return { text: "Опытный", color: "yellow", nextInfo: `Для ранга "Мастер клика" нужно: 50 000 очков и 30 улучшений` };
      case 1:
      default: return { text: "Новичок", color: "white", nextInfo: `Для ранга "Опытный" нужно: 5 000 очков и 5 улучшений` };
    }
  })();

  return (
    <div 
      className="min-h-screen text-white font-sans text-center m-0 overflow-hidden select-none transition-all duration-500"
      style={{ background: activeTheme.bgGradient, backgroundSize: '400% 400%', animation: 'gradientBG 15s ease infinite' }}
    >
      <style jsx global>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ЭФФЕКТ СЕНЬОРА: 3D Необрутализм кнопки с жесткой серой/темной тенью */
        .retro-btn {
          background: #e94560;
          color: white;
          border: 3px solid #fff;
          padding: 12px 24px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
          display: block;
          margin: 12px auto;
          position: relative;
          /* Имитация серой подложки без раздувания HTML */
          box-shadow: 4px 4px 0px #4a4a4a; 
          transition: all 0.1s ease;
        }
        .retro-btn:hover {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #4a4a4a;
        }
        .retro-btn:active {
          transform: translate(4px, 4px); /* Смещаем кнопку прямо на место тени! */
          box-shadow: 0px 0px 0px #4a4a4a;
        }
        .retro-btn:disabled {
          background: #4a4a4a !important;
          border-color: #666;
          box-shadow: 2px 2px 0px #222;
          cursor: not-allowed;
          transform: none !important;
        }

        /* Кастомизируемые карточки хаба под текущую тему */
        .game-card { 
          background: ${activeTheme.cardBg}; 
          border: 3px solid ${activeTheme.borderColor}; 
          border-radius: 18px; 
          padding: 25px; 
          width: 220px; 
          box-shadow: 6px 6px 0px ${activeTheme.shadowColor};
          transition: 0.3s; 
        }
        .game-card:hover { transform: translateY(-5px) scale(1.02); }
        .icon { font-size: 50px; margin-bottom: 10px; }
        
        /* Главная тапалка */
        .click-btn {
          width: 160px; height: 160px; border-radius: 50%; font-size: 22px;
          color: white; cursor: pointer; font-weight: bold; border: 4px solid #fff;
          box-shadow: 0px 8px 0px #333, 0 0 20px rgba(253, 253, 253, 0.2);
          transition: transform 0.05s, background 0.3s, box-shadow 0.3s;
        }
        .click-btn:active { transform: translateY(6px); box-shadow: 0px 2px 0px #333; }
        .pulse-animation { animation: pulse 1s infinite alternate; }
        @keyframes pulse { 0% { transform: scale(1); } 100% { transform: scale(1.06); } }
        
        .particle { position: absolute; pointer-events: none; font-weight: bold; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); animation: floatUp 0.8s ease-out forwards; z-index: 9999; }
        @keyframes floatUp { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-100px) scale(0.8); } }

        .boost-container {
          width: 320px; height: 48px; background: rgba(0, 0, 0, 0.4); border: 3px solid ${activeTheme.borderColor};
          border-radius: 25px; margin: 20px auto; position: relative; overflow: hidden;
          box-shadow: 4px 4px 0px ${activeTheme.shadowColor};
        }
        .boost-bar { height: 100%; }
        .boost-text {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-weight: bold; font-size: 13px; text-shadow: 1px 1px 3px rgba(0,0,0,0.9); pointer-events: none;
        }
      `}</style>

      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.x, top: p.y, color: isBoost3xActive ? '#00ff66' : isBoostActive ? '#ffeb3b' : '#e94560' }}>
          +{p.value}
        </div>
      ))}

      {/* ШАПКА С СУПЕР-ПЕРЕКЛЮЧАТЕЛЕМ СКИНОВ */}
      <div className="bg-black/40 backdrop-blur-md py-3 px-6 flex justify-between items-center text-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <div>🚀 Sportik: <span className="font-bold text-yellow-400">{user ? user.name : "Гость"}</span></div>
          {user && <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-300">{cloudStatus}</span>}
          
          {/* СЕЛЕКТОР ТЕМ */}
          <div className="flex bg-black/50 p-1 rounded-lg border border-white/20 gap-1 ml-2">
            {(Object.keys(THEMES) as ThemeId[]).map((themeKey) => (
              <button 
                key={themeKey}
                onClick={() => setCurrentTheme(themeKey)}
                className={`px-2 py-0.5 rounded text-xs transition-all ${currentTheme === themeKey ? 'bg-white text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                {THEMES[themeKey].name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          {isAuthLoading ? (
            <span className="text-xs text-gray-400">Сессия...</span>
          ) : user ? (
            <button onClick={handleLogout} className="bg-red-700 border border-white/20 px-3 py-1 rounded-md text-xs hover:bg-red-600 transition shadow-md">Выйти</button>
          ) : (
            <button onClick={handleGoogleLogin} className="google-btn">🌐 Войти через Google</button>
          )}
        </div>
      </div>

      {gameState === 'hub' ? (
        <div className="animate-fade-in">
          <header className="py-12">
            <h1 className="text-5xl font-extrabold tracking-wider drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">🎮 Sportik Game Hub</h1>
            <p className="text-gray-300 mt-2">Выбери свою арену и поставь абсолютный рекорд!</p>
          </header>
          <main className="flex justify-center gap-8 p-12 flex-wrap">
            <div className="game-card">
              <div className="icon">🖱️</div>
              <h3 className="text-xl font-bold">Super Clicker</h3>
              <p className="text-sm my-2 text-gray-300">Кликай, копи бусты, доминируй!</p>
              <button className="retro-btn w-full mt-4" style={{ background: '#00aa55' }} onClick={() => setGameState('clicker')}>Играть</button>
            </div>
            <div className="game-card opacity-40">
              <div className="icon">🐍</div>
              <h3 className="text-xl font-bold text-gray-400">Snake Arena</h3>
              <p className="text-sm my-2 text-gray-400">Классическая змейка. Скоро релиз!</p>
          </div>
          </main>
        </div>
      ) : (
        <div className="py-8 max-w-md mx-auto px-4">
          <button className="retro-btn !inline-block mb-6" style={{ background: '#333' }} onClick={() => setGameState('hub')}>⬅ В меню</button>
          
          <h2 className="text-4xl font-black mb-4 tracking-wide drop-shadow-md">Очки: {score}</h2>
          
          {/* ШКАЛА 1: БУСТ Х2 */}
          <div 
            className="boost-container" 
            onClick={handleActivateBoost}
            style={{ 
              cursor: score >= BOOST_PRICE && !isBoostActive && !isBoost3xActive ? 'pointer' : 'not-allowed',
              boxShadow: score >= BOOST_PRICE && !isBoostActive && !isBoost3xActive ? `4px 4px 0px ${activeTheme.shadowColor}` : 'none',
              opacity: isBoost3xActive ? 0.3 : 1
            }}
          >
            <div 
              className="boost-bar" 
              style={{ 
              width: `${boostPercentage}%`,
                background: isBoostActive ? 'linear-gradient(90deg, #ff4b2b, #ff416c)' : 'linear-gradient(90deg, #00c6ff, #0072ff)',
                transition: isBoostActive ? 'width 1s linear' : 'width 1.5s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            ></div>
            <div className="boost-text">
              {isBoost3xActive ? "БЛОКИРОВКА: РАБОТАЕТ Х3" : isBoostActive ? `🔥 БУСТ Х2 АКТИВЕН: ${boostTimeLeft}с` : score >= BOOST_PRICE ? "ГОРЯЧАЯ ШКАЛА! ЖМИ (5000)" : `До буста X2: ${score} / ${BOOST_PRICE}`}
            </div>
          </div>

          {/* ШКАЛА 2: БУСТ Х3 */}
          <div 
            className="boost-container" 
            onClick={handleActivateBoost3x}
            style={{ 
              cursor: clickCount >= BOOST3X_GOAL && !isBoost3xActive && !isBoostActive ? 'pointer' : 'not-allowed',
              boxShadow: clickCount >= BOOST3X_GOAL && !isBoost3xActive && !isBoostActive ? `4px 4px 0px ${activeTheme.shadowColor}` : 'none',
              opacity: isBoostActive ? 0.3 : 1
            }}
          >
            <div 
              className="boost-bar" 
              style={{ 
                width: `${boost3xPercentage}%`,
                background: isBoost3xActive ? 'linear-gradient(90deg, #009933, #00ff66)' : 'linear-gradient(90deg, #8a2387, #e94057)',
                transition: isBoost3xActive ? 'width 1s linear' : 'width 1.5s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            ></div>
            <div className="boost-text">
              {isBoostActive ? "БЛОКИРОВКА: РАБОТАЕТ Х2" : isBoost3xActive ? `⚡ БУСТ Х3 АКТИВЕН: ${boost3xTimeLeft}с` : clickCount >= BOOST3X_GOAL ? "ЗАРЯЖЕНО! ЖМИ НА Х3!" : `Клики для Х3: ${clickCount} / ${BOOST3X_GOAL}`}
            </div>
          </div>

          {/* ГЛАВНАЯ КНОПКА ТАПА */}
          <button 
            className={`click-btn mt-6 ${isBoostActive || isBoost3xActive ? 'pulse-animation' : ''}`}
            onClick={handleMainClick}
            style={{
              background: isBoost3xActive ? 'linear-gradient(45deg, #009933, #00ff66)' : isBoostActive ? 'linear-gradient(45deg, #ff416c, #ff4b2b)' : 'radial-gradient(#e94560, #950740)',
              boxShadow: isBoost3xActive ? '0px 8px 0px #004d1a, 0 0 35px #00ff66' : isBoostActive ? '0px 8px 0px #80001a, 0 0 35px #ff4b2b' : '0px 8px 0px #5c001a, 0 0 20px rgba(0,0,0,0.4)'
            }}
          >
            КЛИК!
          </button>
          
          {/* МАГАЗИН АПГРЕЙДОВ */}
          <div className="mt-8 space-y-1">
            <button className="retro-btn w-full" style={{ background: '#3b5998' }} disabled={score < autoClickPrice} onClick={() => { if (score >= autoClickPrice) { setScore(prev => prev - autoClickPrice); setAutoclicks(prev => prev + 1); } }}>
              ({autoclicks} шт) Купить Автоклик ({autoClickPrice})
            </button>
            
            <button className="retro-btn w-full" style={{ background: '#8b9dc3' }} disabled={score < multiplyPrice} onClick={() => { if (score >= multiplyPrice) { setScore(prev => prev - multiplyPrice); setClickValue(prev => prev + 1); } }}>
              ({clickValue - 1} шт) Сильный палец ({multiplyPrice})
            </button>
            
            <button className="retro-btn w-full" style={{ background: '#4b0082' }} disabled={score < superClicksPrice} onClick={() => { if (score >= superClicksPrice) { setScore(prev => prev - superClicksPrice); setSuperClicks(prev => prev + 1); } }}>
              ({superclick} шт) Супер клик +5 ({superClicksPrice})
            </button>
            
            {/* РАНГОВАЯ ПАНЕЛЬ С 3D ЭФФЕКТОМ ПОД ТЕМУ */}
            <div 
              className="mt-6 p-4 rounded-xl border inline-block min-w-full text-center transition-all duration-300"
              style={{ background: 'rgba(0,0,0,0.5)', borderColor: activeTheme.borderColor, boxShadow: `4px 4px 0px ${activeTheme.shadowColor}` }}
            >
              <p className="text-lg font-bold">Звание: <span style={{ color: rankInfo.color }}>{rankInfo.text}</span></p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{rankInfo.nextInfo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}