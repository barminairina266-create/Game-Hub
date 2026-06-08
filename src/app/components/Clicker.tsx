'use client';

import React, { useState, useEffect } from 'react';
import { ThemeConfig } from '../page';

interface Particle { id: number; x: number; y: number; value: number; }

interface ClickerProps {
  score: number; setScore: React.Dispatch<React.SetStateAction<number>>;
  multiTokens: number; setMultiTokens: React.Dispatch<React.SetStateAction<number>>;
  autoclicks: number; setAutoclicks: React.Dispatch<React.SetStateAction<number>>;
  clickValue: number; setClickValue: React.Dispatch<React.SetStateAction<number>>;
  superclick: number; setSuperClicks: React.Dispatch<React.SetStateAction<number>>;
  maxRankLevel: number; setMaxRankLevel: React.Dispatch<React.SetStateAction<number>>;
  clickCount: number; setClickCount: React.Dispatch<React.SetStateAction<number>>;
  activeTheme: ThemeConfig; goBack: () => void;
}

export default function Clicker({
  score, setScore, multiTokens, setMultiTokens, autoclicks, setAutoclicks, clickValue, setClickValue,
  superclick, setSuperClicks, maxRankLevel, setMaxRankLevel, clickCount, setClickCount,
  activeTheme, goBack
}: ClickerProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isBoostActive, setIsBoostActive] = useState<boolean>(false);
  const [boostTimeLeft, setBoostTimeLeft] = useState<number>(0);
  const [isBoost3xActive, setIsBoost3xActive] = useState<boolean>(false);
  const [boost3xTimeLeft, setBoost3xTimeLeft] = useState<number>(0);

  const BOOST_PRICE = 5000;
  const BOOST_DURATION = 15;
  const BOOST3X_GOAL = 1000;
  const BOOST3X_DURATION = 10;

  const totalUpgrades = autoclicks + (clickValue - 1) + superclick;

  // Логика автоматического расчёта званий
  useEffect(() => {
    let calculatedLevel = 1;
    if (score >= 250000 && totalUpgrades >= 50) calculatedLevel = 4;
    else if (score >= 50000 && totalUpgrades >= 30) calculatedLevel = 3;
    else if (score >= 5000 && totalUpgrades >= 5) calculatedLevel = 2;
    setMaxRankLevel(prev => (calculatedLevel > prev ? calculatedLevel : prev));
  }, [score, totalUpgrades, setMaxRankLevel]);

  // Логика работы автокликов каждую секунду с учётом активных бустов
  useEffect(() => {
    if (autoclicks === 0) return;
    const interval = setInterval(() => {
      let mult = isBoost3xActive ? 3 : isBoostActive ? 2 : 1;
      setScore(prev => prev + (autoclicks * mult));
    }, 1000);
    return () => clearInterval(interval);
  }, [autoclicks, isBoostActive, isBoost3xActive, setScore]);

  // Таймер обратного отсчёта буста X2
  useEffect(() => {
    if (!isBoostActive) return;
    const timer = setInterval(() => {
      setBoostTimeLeft(prev => {
        if (prev <= 1) { setIsBoostActive(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBoostActive]);

  // Таймер обратного отсчёта буста X3
  useEffect(() => {
    if (!isBoost3xActive) return;
    const timer = setInterval(() => {
      setBoost3xTimeLeft(prev => {
        if (prev <= 1) { setIsBoost3xActive(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBoost3xActive]);

  // Обработчик основного клика (ИСПРАВЛЕННЫЙ)
  const handleMainClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    let totalClickPower = clickValue + (superclick * 5);
    if (isBoost3xActive) totalClickPower *= 3;
    else if (isBoostActive) totalClickPower *= 2;

    setScore(prev => prev + totalClickPower);
    
    // Счётчик кликов для X3 увеличивается только если X3 сейчас не активен
    if (!isBoost3xActive && clickCount < BOOST3X_GOAL) {
      setClickCount(prev => Math.min(prev + 1, BOOST3X_GOAL));
    }

    // Находим родительский контейнер с классом .relative для точного расчёта координат
    const containerRect = e.currentTarget.closest('.relative')?.getBoundingClientRect();
    
    // Вычитаем положение контейнера из координат курсора (clientX/Y учитывают скролл)
    const x = containerRect ? e.clientX - containerRect.left : e.clientX;
    const y = containerRect ? e.clientY - containerRect.top : e.clientY;

    // Создание вылетающих циферок (+очки)
    const newParticle: Particle = { id: Date.now() + Math.random(), x, y, value: totalClickPower };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => { setParticles(prev => prev.filter(p => p.id !== newParticle.id)); }, 800);
  };

  // Активация буста X2 за очки
  const handleActivateBoost = () => {
    if (score >= BOOST_PRICE && !isBoostActive && !isBoost3xActive) {
      setScore(prev => prev - BOOST_PRICE);
      setBoostTimeLeft(BOOST_DURATION);
      setIsBoostActive(true);
    }
  };

  // Активация буста X3 за накопленные комбо-клики
  const handleActivateBoost3x = () => {
    if (clickCount >= BOOST3X_GOAL && !isBoost3xActive && !isBoostActive) {
      setClickCount(0);
      setBoost3xTimeLeft(BOOST3X_DURATION);
      setIsBoost3xActive(true);
    }
  };

  // Механизм прямого обмена внутри кликера
  const buyToken = () => { if (score >= 100000) { setScore(s => s - 100000); setMultiTokens(t => t + 1); } };
  const sellToken = () => { if (multiTokens >= 1) { setMultiTokens(t => t - 1); setScore(s => s + 75000); } };

  // Цены на улучшения
  const autoClickPrice = 50 + (autoclicks * 25);
  const multiplyPrice = Math.round(100 * Math.pow(1.25, clickValue - 1));
  const superClicksPrice = 1000 + (superclick * 1000);

  // Конфигурация отображения текущего звания
  const rankInfo = (() => {
    switch(maxRankLevel) {
      case 4: return { text: "БОГ клика", color: "#00ff00", nextInfo: "Предел эволюции достигнут! 👑" };
      case 3: return { text: "Мастер клика", color: "orange", nextInfo: 'До ранга "БОГ клика": 250k очков и 50 улучшений' };
      case 2: return { text: "Опытный", color: "yellow", nextInfo: 'До ранга "Мастер клика": 50k очков и 30 улучшений' };
      default: return { text: "Новичок", color: "white", nextInfo: 'До ранга "Опытный": 5k очков и 5 улучшений' };
    }
  })();

  return (
    <div className="py-8 max-w-md mx-auto px-4 relative">
      <style jsx global>{`
        .click-btn { width: 160px; height: 160px; border-radius: 50%; font-size: 22px; color: white; cursor: pointer; font-weight: bold; border: 4px solid #fff; box-shadow: 0px 8px 0px #333; transition: transform 0.05s; }
        .click-btn:active { transform: translateY(6px); box-shadow: 0px 2px 0px #333; }
        .particle { position: absolute; pointer-events: none; font-weight: bold; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); animation: floatUp 0.8s ease-out forwards; z-index: 9999; }
        @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-100px); } }
        .boost-container { width: 320px; height: 48px; background: rgba(0, 0, 0, 0.4); border: 3px solid ${activeTheme.borderColor}; border-radius: 25px; margin: 20px auto; position: relative; overflow: hidden; box-shadow: 4px 4px 0px ${activeTheme.shadowColor}; user-select: none; }
        .boost-bar { height: 100%; transition: width 0.1s linear; }
        .boost-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; text-shadow: 1px 1px 3px rgba(0,0,0,0.9); }
      `}</style>

      {/* Вылетающие частицы очков */}
      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left: p.x, top: p.y, color: isBoost3xActive ? '#00ff66' : isBoostActive ? '#ffeb3b' : '#e94560' }}>
          +{p.value}
        </div>
      ))}

      {/* Верхняя панель управления и мини-обменник */}
      <div className="flex justify-between items-center mb-4">
        <button className="retro-btn !inline-block !m-0" style={{ background: '#333' }} onClick={goBack}>⬅ В хаб</button>
        
        <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/10">
          <button className="retro-btn !p-1.5 !px-2.5 !m-0 text-[10px]" disabled={score < 100000} onClick={buyToken}>Купить токен <br/> (-100k)</button>
          <button className="retro-btn !p-1.5 !px-2.5 !m-0 text-[10px]" disabled={multiTokens < 1} onClick={sellToken}>Продать токен <br/> (+75k)</button>
        </div>
      </div>

      <h2 className="text-4xl font-black mb-4 tracking-wide text-yellow-400">Очки: {score}</h2>
      
      {/* Контейнер Буста X2 */}
      <div className="boost-container" onClick={handleActivateBoost} style={{ cursor: score >= BOOST_PRICE && !isBoostActive && !isBoost3xActive ? 'pointer' : 'not-allowed', opacity: isBoost3xActive ? 0.3 : 1 }}>
        <div className="boost-bar" style={{ width: `${isBoostActive ? (boostTimeLeft/BOOST_DURATION)*100 : Math.min((score/BOOST_PRICE)*100, 100)}%`, background: isBoostActive ? 'linear-gradient(90deg, #ff4b2b, #ff416c)' : 'linear-gradient(90deg, #00c6ff, #0072ff)' }}></div>
        <div className="boost-text">{isBoost3xActive ? "БЛОК Х2: АКТИВЕН Х3" : isBoostActive ? `🔥 БУСТ Х2 АКТИВЕН: ${boostTimeLeft}с` : score >= BOOST_PRICE ? "ГОРЯЧО! ЖМИ ДЛЯ Х2 (5000)" : `До буста X2: ${score} / ${BOOST_PRICE}`}</div>
      </div>

      {/* Контейнер Буста X3 */}
      <div className="boost-container" onClick={handleActivateBoost3x} style={{ cursor: clickCount >= BOOST3X_GOAL && !isBoost3xActive && !isBoostActive ? 'pointer' : 'not-allowed', opacity: isBoostActive ? 0.3 : 1 }}>
        <div className="boost-bar" style={{ width: `${isBoost3xActive ? (boost3xTimeLeft/BOOST3X_DURATION)*100 : Math.min((clickCount/BOOST3X_GOAL)*100, 100)}%`, background: isBoost3xActive ? 'linear-gradient(90deg, #009933, #00ff66)' : 'linear-gradient(90deg, #8a2387, #e94057)' }}></div>
        <div className="boost-text">{isBoostActive ? "БЛОК Х3: АКТИВЕН Х2" : isBoost3xActive ? `⚡ БУСТ Х3 АКТИВЕН: ${boost3xTimeLeft}с` : clickCount >= BOOST3X_GOAL ? "ЗАРЯЖЕНО! ЖМИ СЮДА!" : `Клики до Х3: ${clickCount} / ${BOOST3X_GOAL}`}</div>
      </div>

      {/* Большая кнопка клика */}
      <button className="click-btn mt-4" onClick={handleMainClick} style={{ background: isBoost3xActive ? 'linear-gradient(45deg, #009933, #00ff66)' : isBoostActive ? 'linear-gradient(45deg, #ff416c, #ff4b2b)' : 'radial-gradient(#e94560, #950740)' }}>
        КЛИК!
      </button>
      
      {/* Магазин улучшений */}
      <div className="mt-8 space-y-1">
        <button className="retro-btn w-full" style={{ background: '#3b5998' }} disabled={score < autoClickPrice} onClick={() => { setScore(s => s - autoClickPrice); setAutoclicks(a => a + 1); }}>({autoclicks} шт) Купить Автоклик ({autoClickPrice})</button>
        <button className="retro-btn w-full" style={{ background: '#8b9dc3' }} disabled={score < multiplyPrice} onClick={() => { setScore(s => s - multiplyPrice); setClickValue(v => v + 1); }}>({clickValue - 1} шт) Сильный палец ({multiplyPrice})</button>
        <button className="retro-btn w-full" style={{ background: '#4b0082' }} disabled={score < superClicksPrice} onClick={() => { setScore(s => s - superClicksPrice); setSuperClicks(sc => sc + 1); }}>({superclick} шт) Супер клик +5 ({superClicksPrice})</button>
        
        {/* Отображение звания */}
        <div className="mt-6 p-4 rounded-xl border inline-block min-w-full" style={{ background: 'rgba(0,0,0,0.5)', borderColor: activeTheme.borderColor }}>
          <p className="text-lg font-bold">Звание: <span style={{ color: rankInfo.color }}>{rankInfo.text}</span></p>
          <p className="text-xs text-gray-400 mt-1">{rankInfo.nextInfo}</p>
        </div>
      </div>
    </div>
  );
}