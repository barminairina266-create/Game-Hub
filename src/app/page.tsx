'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Clicker from './components/Clicker';
import Snake from './components/Snake';

export type ThemeId = 'purple' | 'red' | 'blue' | 'green';
export interface ThemeConfig {
  name: string;
  bgGradient: string;
  cardBg: string;
  borderColor: string;
  shadowColor: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  purple: { name: '🔮 Фиолет', bgGradient: 'linear-gradient(135deg, #1f003a, #0d001a, #000040)', cardBg: '#2d0054', borderColor: '#5e00b3', shadowColor: '#1a0033' },
  red: { name: '🩸 Красный', bgGradient: 'linear-gradient(135deg, #3a0000, #1a0000, #000040)', cardBg: '#540000', borderColor: '#b30000', shadowColor: '#330000' },
  blue: { name: '💎 Синий', bgGradient: 'linear-gradient(135deg, #001f4d, #000d1a, #000033)', cardBg: '#002b66', borderColor: '#0055cc', shadowColor: '#001a33' },
  green: { name: '🧪 Зеленый', bgGradient: 'linear-gradient(135deg, #002e17, #00140a, #000022)', cardBg: '#004221', borderColor: '#008f47', shadowColor: '#002411' }
};

export interface UserProfile { name: string; email: string; avatar: string; }

export default function Home() {
  const [gameState, setGameState] = useState<'hub' | 'clicker' | 'snake'>('hub');
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('purple');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [cloudStatus, setCloudStatus] = useState<string>('Синхронизировано');

  // Глобальные валюты
  const [score, setScore] = useState<number>(0);
  const [multiTokens, setMultiTokens] = useState<number>(0);
  const [apples, setApples] = useState<number>(0);

  // Состояние кликера
  const [autoclicks, setAutoclicks] = useState<number>(0);
  const [clickValue, setClickValue] = useState<number>(1);
  const [superclick, setSuperClicks] = useState<number>(0);
  const [maxRankLevel, setMaxRankLevel] = useState<number>(1);
  const [clickCount, setClickCount] = useState<number>(0);

  // Состояние змейки
  const [purchasedSkins, setPurchasedSkins] = useState<string[]>(['snake_default', 'apple_default']);
  const [activeSnakeSkin, setActiveSnakeSkin] = useState<string>('snake_default');
  const [activeAppleSkin, setActiveAppleSkin] = useState<string>('apple_default');
  const [map15x15Unlocked, setMap15x15Unlocked] = useState<boolean>(false);

  const activeTheme = THEMES[currentTheme];
  const userEmail = user?.email || null;

  // Загрузка прогресса (Local + Supabase)
  useEffect(() => {
    const loadAllProgress = async (email: string | null) => {
      const prefix = email ? `sportik_${email}_` : 'sportik_guest_';
      
      setScore(parseInt(localStorage.getItem(`${prefix}score`) || '0'));
      setMultiTokens(parseInt(localStorage.getItem(`${prefix}multitokens`) || '0'));
      setApples(parseInt(localStorage.getItem(`${prefix}apples`) || '0'));
      setAutoclicks(parseInt(localStorage.getItem(`${prefix}auto`) || '0'));
      setClickValue(parseInt(localStorage.getItem(`${prefix}value`) || '1'));
      setSuperClicks(parseInt(localStorage.getItem(`${prefix}superclicks`) || '0'));
      setMaxRankLevel(parseInt(localStorage.getItem(`${prefix}maxrank`) || '1'));
      setClickCount(parseInt(localStorage.getItem(`${prefix}clickcount`) || '0'));
      setCurrentTheme((localStorage.getItem('sportik_theme') as ThemeId) || 'purple');
      
      const skins = localStorage.getItem(`${prefix}skins`);
      if (skins) setPurchasedSkins(JSON.parse(skins));
      setActiveSnakeSkin(localStorage.getItem(`${prefix}active_snake`) || 'snake_default');
      setActiveAppleSkin(localStorage.getItem(`${prefix}active_apple`) || 'apple_default');
      setMap15x15Unlocked(localStorage.getItem(`${prefix}map15_unlocked`) === 'true');

      setIsAuthLoading(false);

      if (email) {
        setCloudStatus('Загрузка из облака...');
        const { data, error } = await supabase.from('user_progress').select('*').eq('email', email).single();
        if (data && !error) {
          setScore(data.score);
          setMultiTokens(data.multi_tokens || 0);
          setApples(data.apples || 0);
          setAutoclicks(data.autoclicks);
          setClickValue(data.click_value);
          setSuperClicks(data.superclicks);
          if (data.max_rank) setMaxRankLevel(data.max_rank);
          if (data.purchased_skins) setPurchasedSkins(data.purchased_skins.split(','));
          if (data.active_snake_skin) setActiveSnakeSkin(data.active_snake_skin);
          if (data.active_apple_skin) setActiveAppleSkin(data.active_apple_skin);
          if (data.map_15x15_unlocked) setMap15x15Unlocked(data.map_15x15_unlocked);
          setCloudStatus('Данные загружены ✓');
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const profile = { name: session.user.user_metadata.full_name || 'Игрок', email: session.user.email || '', avatar: '👤' };
        setUser(profile); loadAllProgress(profile.email);
      } else { setUser(null); loadAllProgress(null); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthLoading(true);
      if (session?.user) {
        const profile = { name: session.user.user_metadata.full_name || 'Игрок', email: session.user.email || '', avatar: '👤' };
        setUser(profile); loadAllProgress(profile.email);
      } else { setUser(null); loadAllProgress(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Локальное сохранение при мутациях стейта
  useEffect(() => {
    if (isAuthLoading) return;
    const prefix = userEmail ? `sportik_${userEmail}_` : 'sportik_guest_';
    localStorage.setItem(`${prefix}score`, score.toString());
    localStorage.setItem(`${prefix}multitokens`, multiTokens.toString());
    localStorage.setItem(`${prefix}apples`, apples.toString());
    localStorage.setItem(`${prefix}auto`, autoclicks.toString());
    localStorage.setItem(`${prefix}value`, clickValue.toString());
    localStorage.setItem(`${prefix}superclicks`, superclick.toString());
    localStorage.setItem(`${prefix}maxrank`, maxRankLevel.toString());
    localStorage.setItem(`${prefix}clickcount`, clickCount.toString());
    localStorage.setItem(`${prefix}skins`, JSON.stringify(purchasedSkins));
    localStorage.setItem(`${prefix}active_snake`, activeSnakeSkin);
    localStorage.setItem(`${prefix}active_apple`, activeAppleSkin);
    localStorage.setItem(`${prefix}map15_unlocked`, map15x15Unlocked.toString());
    localStorage.setItem('sportik_theme', currentTheme);
  }, [score, multiTokens, apples, autoclicks, clickValue, superclick, maxRankLevel, clickCount, purchasedSkins, activeSnakeSkin, activeAppleSkin, map15x15Unlocked, currentTheme, userEmail, isAuthLoading]);

  // Облачное сохранение (Supabase)
  const saveToCloud = async () => {
    if (!userEmail) return;
    try {
      setCloudStatus('Сохранение...');
      await supabase.from('user_progress').upsert({
        email: userEmail, score, autoclicks, click_value: clickValue, superclicks: superclick, max_rank: maxRankLevel,
        multi_tokens: multiTokens, apples, purchased_skins: purchasedSkins.join(','),
        active_snake_skin: activeSnakeSkin, active_apple_skin: activeAppleSkin, map_15x15_unlocked: map15x15Unlocked,
        updated_at: new Date().toISOString()
      });
      setCloudStatus('Облако синхронизировано ✓');
    } catch { setCloudStatus('Ошибка ❌'); }
  };

  useEffect(() => {
    if (!userEmail || isAuthLoading) return;
    const interval = setInterval(saveToCloud, 15000);
    return () => clearInterval(interval);
  }, [score, multiTokens, apples, autoclicks, clickValue, superclick, maxRankLevel, userEmail, isAuthLoading]);

  return (
    <div className="min-h-screen text-white font-sans text-center m-0 overflow-x-hidden select-none transition-all duration-500" style={{ background: activeTheme.bgGradient }}>
      <style jsx global>{`
        .retro-btn { background: #e94560; color: white; border: 3px solid #fff; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: bold; display: block; margin: 12px auto; position: relative; box-shadow: 4px 4px 0px #4a4a4a; transition: all 0.1s ease; }
        .retro-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0px #4a4a4a; }
        .retro-btn:active { transform: translate(4px, 4px); box-shadow: 0px 0px 0px #4a4a4a; }
        .retro-btn:disabled { background: #4a4a4a !important; border-color: #666; box-shadow: 2px 2px 0px #222; cursor: not-allowed; transform: none !important; }
        .game-card { background: ${activeTheme.cardBg}; border: 3px solid ${activeTheme.borderColor}; border-radius: 18px; padding: 25px; width: 240px; box-shadow: 6px 6px 0px ${activeTheme.shadowColor}; transition: 0.3s; }
        .game-card:hover { transform: translateY(-5px) scale(1.02); }
      `}</style>

      {/* ВЕРХНЯЯ ШАПКА */}
      <div className="bg-black/40 backdrop-blur-md py-3 px-6 flex justify-between items-center text-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <div>🚀 Игрок: <span className="font-bold text-yellow-400">{user ? user.name : "Гость"}</span></div>
          {user && <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-gray-300">{cloudStatus}</span>}
          <div className="flex bg-black/50 p-1 rounded-lg border border-white/20 gap-1">
            {(Object.keys(THEMES) as ThemeId[]).map((k) => (
              <button key={k} onClick={() => setCurrentTheme(k)} className={`px-2 py-0.5 rounded text-xs ${currentTheme === k ? 'bg-white text-black font-bold' : 'text-gray-400'}`}>{THEMES[k].name.split(' ')[0]}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-cyan-300">🪙 Мульти-токены: {multiTokens}</div>
          {user ? (
            <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="bg-red-700 px-3 py-1 rounded text-xs">Выйти</button>
          ) : (
            <button onClick={async () => { await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '' } }); }} className="bg-blue-600 px-3 py-1 rounded text-xs">Google Вход</button>
          )}
        </div>
      </div>

      {/* ОТОБРАЖЕНИЕ СОСТОЯНИЙ */}
      {gameState === 'hub' && (
        <div className="p-8">
          <header className="py-8">
            <h1 className="text-5xl font-extrabold tracking-wider">🎮 Sportik Game Hub</h1>
            <p className="text-gray-300 mt-2">Копите Мульти-токены и развивайте обе игры одновременно!</p>
          </header>
          <div className="flex justify-center gap-8 p-6 flex-wrap">
            <div className="game-card">
              <div className="text-5xl mb-2">🖱️</div>
              <h3 className="text-xl font-bold">Super Clicker</h3>
              <p className="text-xs my-2 text-gray-300">Очки: {score}</p>
              <button className="retro-btn w-full mt-4" style={{ background: '#00aa55' }} onClick={() => setGameState('clicker')}>Играть</button>
            </div>
            <div className="game-card">
              <div className="text-5xl mb-2">🐍</div>
              <h3 className="text-xl font-bold">Snake Arena</h3>
              <p className="text-xs my-2 text-gray-300">Яблоки: {apples}</p>
              <button className="retro-btn w-full mt-4" style={{ background: '#0088cc' }} onClick={() => setGameState('snake')}>Играть</button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'clicker' && (
        <Clicker 
          score={score} setScore={setScore} multiTokens={multiTokens} setMultiTokens={setMultiTokens}
          autoclicks={autoclicks} setAutoclicks={setAutoclicks} clickValue={clickValue} setClickValue={setClickValue}
          superclick={superclick} setSuperClicks={setSuperClicks} maxRankLevel={maxRankLevel} setMaxRankLevel={setMaxRankLevel}
          clickCount={clickCount} setClickCount={setClickCount} activeTheme={activeTheme} goBack={() => { setGameState('hub'); saveToCloud(); }}
        />
      )}

      {gameState === 'snake' && (
        <Snake 
          apples={apples} setApples={setApples} multiTokens={multiTokens} setMultiTokens={setMultiTokens}
          purchasedSkins={purchasedSkins} setPurchasedSkins={setPurchasedSkins} activeSnakeSkin={activeSnakeSkin}
          setActiveSnakeSkin={setActiveSnakeSkin} activeAppleSkin={activeAppleSkin} setActiveAppleSkin={setActiveAppleSkin}
          map15x15Unlocked={map15x15Unlocked} setMap15x15Unlocked={setMap15x15Unlocked} activeTheme={activeTheme} goBack={() => { setGameState('hub'); saveToCloud(); }}
        />
      )}
    </div>
  );
}