'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ThemeConfig } from '../page';

interface SnakeProps {
  apples: number;
  setApples: React.Dispatch<React.SetStateAction<number>>;
  multiTokens: number;
  setMultiTokens: React.Dispatch<React.SetStateAction<number>>;
  purchasedSkins: string[];
  setPurchasedSkins: React.Dispatch<React.SetStateAction<string[]>>;
  activeSnakeSkin: string;
  setActiveSnakeSkin: (s: string) => void;
  activeAppleSkin: string;
  setActiveAppleSkin: (s: string) => void;
  map15x15Unlocked: boolean;
  setMap15x15Unlocked: (b: boolean) => void;
  activeTheme: ThemeConfig;
  goBack: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point { x: number; y: number; }

export default function Snake({
  apples, setApples, multiTokens, setMultiTokens, purchasedSkins, setPurchasedSkins,
  activeSnakeSkin, setActiveSnakeSkin, activeAppleSkin, setActiveAppleSkin,
  map15x15Unlocked, setMap15x15Unlocked, activeTheme, goBack
}: SnakeProps) {
  const [mapSize, setMapSize] = useState<10 | 15>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [snake, setSnake] = useState<Point[]>([{ x: 2, y: 5 }, { x: 1, y: 5 }]);
  const [apple, setApple] = useState<Point>({ x: 7, y: 5 });
  const [roundApples, setRoundApples] = useState<number>(0); 
  const [gameOver, setGameOver] = useState(false);

  const inputQueueRef = useRef<Direction[]>([]);
  const currentDirectionRef = useRef<Direction>('RIGHT');
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const snakeRef = useRef<Point[]>(snake);
  const appleRef = useRef<Point>(apple);
  const roundApplesRef = useRef<number>(0);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  useEffect(() => {
    appleRef.current = apple;
  }, [apple]);

  const SNAKE_SKINS = [
    { id: 'snake_default', name: '🟢 Обычная', price: 0, desc: 'Стандарт', color: '#00ff66', mult: 1 },
    { id: 'snake_blue', name: '🔵 Синяя', price: 50, desc: 'х1.1 Общих яблок', color: '#0066ff', mult: 1.1 },
    { id: 'snake_rainbow', name: '🌈 Радужная', price: 250, desc: 'х1.5 Общих яблок', color: 'linear-gradient(45deg, #ff0055, #00ff66, #0055ff, #ffcc00)', mult: 1.5 }
  ];

  const APPLE_SKINS = [
    { id: 'apple_default', name: '🍎 Яблоко', price: 0, desc: 'Стандарт', char: '🍎', mult: 1 },
    { id: 'apple_orange', name: '🍊 Апельсин', price: 50, desc: 'х1.1 Очков', char: '🍊', mult: 1.1 },
    { id: 'apple_grapes', name: '🍇 Виноград', price: 150, desc: 'х1.25 Очков', char: '🍇', mult: 1.25 }
  ];

  const currentSnakeConfig = SNAKE_SKINS.find(s => s.id === activeSnakeSkin) || SNAKE_SKINS[0];
  const currentAppleConfig = APPLE_SKINS.find(a => a.id === activeAppleSkin) || APPLE_SKINS[0];

  const configsRef = useRef({ snake: currentSnakeConfig, apple: currentAppleConfig });
  useEffect(() => {
    configsRef.current = { snake: currentSnakeConfig, apple: currentAppleConfig };
  }, [currentSnakeConfig, currentAppleConfig]);

  const generateNewApple = (currentSnake: Point[], currentMapSize: number) => {
    if (currentSnake.length >= currentMapSize * currentMapSize) return { x: -1, y: -1 };
    while (true) {
      const newApple = { x: Math.floor(Math.random() * currentMapSize), y: Math.floor(Math.random() * currentMapSize) };
      if (!currentSnake.some(s => s.x === newApple.x && s.y === newApple.y)) return newApple;
    }
  };

  const startGame = () => {
    const freshSnake = [{ x: 2, y: Math.floor(mapSize / 2) }, { x: 1, y: Math.floor(mapSize / 2) }];
    const freshApple = generateNewApple(freshSnake, mapSize);
    
    setSnake(freshSnake);
    setApple(freshApple);
    snakeRef.current = freshSnake;
    appleRef.current = freshApple;
    
    inputQueueRef.current = [];
    currentDirectionRef.current = 'RIGHT';
    
    setRoundApples(0);
    roundApplesRef.current = 0;
    
    setGameOver(false);
    setIsPlaying(true);
  };

  const changeDirection = (nextDir: Direction) => {
    const lastDir = inputQueueRef.current.length > 0 ? inputQueueRef.current[inputQueueRef.current.length - 1] : currentDirectionRef.current;
    
    if (nextDir === 'UP' && lastDir === 'DOWN') return;
    if (nextDir === 'DOWN' && lastDir === 'UP') return;
    if (nextDir === 'LEFT' && lastDir === 'RIGHT') return;
    if (nextDir === 'RIGHT' && lastDir === 'LEFT') return;

    if (nextDir !== lastDir) {
      inputQueueRef.current.push(nextDir);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      if (['ArrowUp', 'w', 'W', 'ц', 'Ц'].includes(e.key)) changeDirection('UP');
      if (['ArrowDown', 's', 'S', 'ы', 'Ы'].includes(e.key)) changeDirection('DOWN');
      if (['ArrowLeft', 'a', 'A', 'ф', 'Ф'].includes(e.key)) changeDirection('LEFT');
      if (['ArrowRight', 'd', 'D', 'в', 'В'].includes(e.key)) changeDirection('RIGHT');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isPlaying || gameOver) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !isPlaying || gameOver) return;
    const touch = e.changedTouches[0];
    
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) changeDirection('RIGHT');
        else changeDirection('LEFT');
      }
    } else {
      if (Math.abs(diffY) > minSwipeDistance) {
        if (diffY > 0) changeDirection('DOWN');
        else changeDirection('UP');
      }
    }
    touchStartRef.current = null;
  };

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameTick = () => {
      if (inputQueueRef.current.length > 0) {
        currentDirectionRef.current = inputQueueRef.current.shift()!;
      }

      const currentSnake = snakeRef.current;
      const currentApple = appleRef.current;
      const curDir = currentDirectionRef.current;

      const head = { ...currentSnake[0] };

      if (curDir === 'UP') head.y -= 1;
      if (curDir === 'DOWN') head.y += 1;
      if (curDir === 'LEFT') head.x -= 1;
      if (curDir === 'RIGHT') head.x += 1;

      const isBodyCollision = currentSnake.slice(0, -1).some(s => s.x === head.x && s.y === head.y);
      
      if (head.x < 0 || head.x >= mapSize || head.y < 0 || head.y >= mapSize || isBodyCollision) {
        setIsPlaying(false);
        setGameOver(true);
        setApples(prevApples => (isNaN(prevApples) ? 0 : prevApples) + roundApplesRef.current);
        return;
      }

      const newSnake = [head, ...currentSnake];
      let ateApple = false;

      if (head.x === currentApple.x && head.y === currentApple.y) {
        ateApple = true;
      } else {
        newSnake.pop();
      }

      if (newSnake.length >= mapSize * mapSize) {
         setIsPlaying(false);
         setGameOver(true);
         setApples(prevApples => (isNaN(prevApples) ? 0 : prevApples) + roundApplesRef.current);
         setSnake(newSnake);
         return;
      }

      setSnake(newSnake);
      snakeRef.current = newSnake;

      if (ateApple) {
        const snakeMult = configsRef.current.snake?.mult || 1;
        const appleMult = configsRef.current.apple?.mult || 1;
        const gain = snakeMult * appleMult;

        roundApplesRef.current += gain;
        setRoundApples(roundApplesRef.current);
        
        const newApple = generateNewApple(newSnake, mapSize);
        setApple(newApple);
        appleRef.current = newApple; 
      }
    };

    const interval = setInterval(gameTick, 200); 
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, mapSize, setApples]);

  const buyToken = () => { 
    const currentBalance = isNaN(apples) ? 0 : apples;
    if (currentBalance >= 50) { 
      setApples(currentBalance - 50); 
      setMultiTokens(t => t + 1); 
    } 
  };
  
  const sellToken = () => { 
    if (multiTokens >= 1) { 
      setMultiTokens(t => t - 1); 
      setApples(a => (isNaN(a) ? 0 : a) + 35); 
    } 
  };

  const safeApples = isNaN(apples) ? 0 : apples;
  const displayApples = safeApples.toFixed(1);
  const displayRoundApples = roundApples.toFixed(1);

  return (
    <div className="py-6 max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center relative items-start">
      <div className="col-span-1 md:col-span-3 text-left z-20">
        <button className="retro-btn !inline-block !m-0" style={{ background: '#333' }} onClick={goBack}>⬅ В меню</button>
      </div>

      <div className="space-y-4 order-2 md:order-1 z-0">
        <div className="p-4 rounded-2xl border bg-black/50" style={{ borderColor: activeTheme.borderColor, boxShadow: `4px 4px 0px ${activeTheme.shadowColor}` }}>
          <h2 className="text-xl font-black mb-1 text-green-400">🍏 Яблоки: {displayApples}</h2>
          <p className="text-xs text-gray-400">Собрано за раунд: <span className="text-white font-bold">{displayRoundApples}</span></p>

          <div className="mt-4 pt-3 border-t border-white/10 text-left">
            <p className="text-xs font-bold text-yellow-400 mb-2">🔄 Обменник валюты:</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="retro-btn !p-2 !m-0 text-[10px] w-full" disabled={safeApples < 50} onClick={buyToken}>Купить Токен<br/>(-50.0 🍏)</button>
              <button className="retro-btn !p-2 !m-0 text-[10px] w-full" disabled={multiTokens < 1} onClick={sellToken}>Продать Токен<br/>(+35.0 🍏)</button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
            <p className="text-xs font-bold text-left">Выбор Арены:</p>
            <button 
              className={`retro-btn w-full !py-1.5 !text-xs !my-1 transition-all ${
                mapSize === 10 ? '!bg-emerald-600 !border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : ''
              }`} 
              disabled={isPlaying} 
              onClick={() => setMapSize(10)}
            >
              Обычная 10х10 {mapSize === 10 && '📍'}
            </button>
            {map15x15Unlocked ? (
              <button 
                className={`retro-btn w-full !py-1.5 !text-xs !my-1 transition-all ${
                  mapSize === 15 ? '!bg-emerald-600 !border-green-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' : ''
                }`} 
                disabled={isPlaying} 
                onClick={() => setMapSize(15)}
              >
                Огромная 15х15 {mapSize === 15 && '📍'}
              </button>
            ) : (
              <button className="retro-btn w-full !py-1.5 !text-xs !my-1 text-yellow-300" style={{ background: '#5c1d99' }} disabled={safeApples < 25 || isPlaying} onClick={() => { setApples(a => a - 25); setMap15x15Unlocked(true); setMapSize(15); }}>Открыть 15х15 (25.0 🍏)</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-6 rounded-3xl border bg-neutral-950/80 order-1 md:order-2 z-10 relative max-w-full overflow-visible" style={{ borderColor: activeTheme.borderColor, boxShadow: `0px 10px 30px rgba(0,0,0,0.5)` }}>
        <p className="block md:hidden text-[10px] text-gray-400 mb-2 animate-pulse">📱 Управляй свайпами по игровому экрану!</p>
        
        {!isPlaying ? (
          <div className="my-16">
            {gameOver && <h3 className="text-3xl font-black text-red-500 mb-3 tracking-wide">РАУНД ОКОНЧЕН!</h3>}
            <button className="retro-btn !px-12 !py-4 !text-xl" style={{ background: '#00c853' }} onClick={startGame}>ЗАПУСТИТЬ АРЕНУ</button>
          </div>
        ) : (
          <div 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="grid bg-neutral-900/90 border-4 border-neutral-700 rounded-2xl overflow-hidden shadow-2xl p-1 shrink-0 touch-none select-none"
            style={{ 
              gridTemplateColumns: `repeat(${mapSize}, minmax(0, 1fr))`,
              width: mapSize === 10 ? '340px' : '440px',
              height: mapSize === 10 ? '340px' : '440px',
              aspectRatio: '1 / 1'
            }}
          >
            {Array.from({ length: mapSize * mapSize }).map((_, i) => {
              const x = i % mapSize;
              const y = Math.floor(i / mapSize);
              
              const segmentIndex = snake.findIndex(s => s.x === x && s.y === y);
              const isSnake = segmentIndex !== -1;
              const isHead = segmentIndex === 0;
              const isTail = isSnake && segmentIndex === snake.length - 1 && snake.length > 1;
              const isBody = isSnake && !isHead && !isTail;
              
              const isApple = apple.x === x && apple.y === y;
              const isEvenCell = (x + y) % 2 === 0;

              let cellStyle: React.CSSProperties = {};
              if (isSnake) {
                if (currentSnakeConfig.id === 'snake_rainbow') {
                  cellStyle.background = currentSnakeConfig.color;
                } else {
                  cellStyle.backgroundColor = currentSnakeConfig.color;
                }
                cellStyle.boxShadow = '0 2px 5px rgba(0,0,0,0.3)'; // Тень для объема
              }

              // Вычисление угла поворота для головы и хвоста
              let rotation = 0;
              if (isHead && snake.length > 1) {
                const dx = snake[0].x - snake[1].x;
                const dy = snake[0].y - snake[1].y;
                if (dx === 1) rotation = 0;        // Вправо
                else if (dx === -1) rotation = 180; // Влево
                else if (dy === 1) rotation = 90;   // Вниз
                else if (dy === -1) rotation = 270; // Вверх
              } else if (isTail && snake.length > 1) {
                const prev = snake[snake.length - 2];
                const tail = snake[snake.length - 1];
                const dx = prev.x - tail.x;
                const dy = prev.y - tail.y;
                if (dx === 1) rotation = 0;
                else if (dx === -1) rotation = 180;
                else if (dy === 1) rotation = 90;
                else if (dy === -1) rotation = 270;
              }

              return (
                <div 
                  key={i} 
                  className={`w-full h-full flex items-center justify-center relative rounded-[2px] ${
                    isEvenCell ? 'bg-neutral-800/30' : 'bg-neutral-800/60'
                  }`}
                >
                  {isApple && <span className="absolute scale-150 animate-bounce text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] z-10">{currentAppleConfig.char}</span>}
                  
                  {/* ГОЛОВА ЗМЕИ */}
                  {isHead && (
                    <div
                      className="absolute flex items-center justify-center z-30"
                      style={{
                        ...cellStyle,
                        width: '100%',
                        height: '100%',
                        transform: `rotate(${rotation}deg)`,
                        borderRadius: '8px 12px 12px 8px', // Скругление мордочки
                      }}
                    >
                      {/* Правый глаз */}
                      <div className="absolute right-[10%] top-[15%] w-[30%] h-[30%] bg-white rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                        <div className="w-[50%] h-[50%] bg-black rounded-full translate-x-[20%]" />
                      </div>
                      {/* Левый глаз */}
                      <div className="absolute right-[10%] bottom-[15%] w-[30%] h-[30%] bg-white rounded-full flex items-center justify-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                        <div className="w-[50%] h-[50%] bg-black rounded-full translate-x-[20%]" />
                      </div>
                      {/* Язычок */}
                      <div className="absolute -right-[15%] top-[45%] w-[20%] h-[10%] bg-red-500 rounded-r-full shadow-sm" />
                    </div>
                  )}

                  {/* ТЕЛО ЗМЕИ */}
                  {isBody && (
                    <div
                      className="absolute z-20"
                      style={{
                        ...cellStyle,
                        width: '90%',
                        height: '90%',
                        borderRadius: '6px', // Легкое скругление для эффекта сегментов
                      }}
                    />
                  )}

                  {/* ХВОСТ ЗМЕИ */}
                  {isTail && (
                    <div
                      className="absolute z-10"
                      style={{
                        ...cellStyle,
                        width: '90%',
                        height: '90%',
                        transform: `rotate(${rotation}deg)`,
                        borderRadius: '24px 4px 4px 24px', // Сильное скругление сзади (сужение хвоста)
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4 order-3 z-0">
        <div className="p-4 rounded-2xl border text-left bg-black/50" style={{ borderColor: activeTheme.borderColor, boxShadow: `4px 4px 0px ${activeTheme.shadowColor}` }}>
          <h3 className="text-md font-black text-cyan-400 mb-2">🐍 Скины Змейки {isPlaying && <span className="text-[10px] text-red-400 animate-pulse">(Блок в игре)</span>}:</h3>
          <div className="space-y-2">
            {SNAKE_SKINS.map(s => {
              const owned = purchasedSkins.includes(s.id);
              const active = activeSnakeSkin === s.id;
              return (
                <div key={s.id} className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.desc}</p>
                  </div>
                  {active ? <span className="text-green-400 font-bold">Вкл</span> : owned ? (
                    <button className="retro-btn !p-1 !text-[10px] !m-0 !px-3" disabled={isPlaying} style={{background:'#555'}} onClick={() => setActiveSnakeSkin(s.id)}>Вкл</button>
                  ) : (
                    <button className="retro-btn !p-1 !text-[10px] !m-0" disabled={safeApples < s.price || isPlaying} onClick={() => { if(safeApples >= s.price) { setApples(a=>a-s.price); setPurchasedSkins(p=>[...p, s.id]); setActiveSnakeSkin(s.id); } }}>{s.price.toFixed(1)} 🍏</button>
                  )}
                </div>
              );
            })}
          </div>

          <h3 className="text-md font-black text-orange-400 mt-4 mb-2">🍏 Скины Фруктов {isPlaying && <span className="text-[10px] text-red-400 animate-pulse">(Блок в игре)</span>}:</h3>
          <div className="space-y-2">
            {APPLE_SKINS.map(a => {
              const owned = purchasedSkins.includes(a.id);
              const active = activeAppleSkin === a.id;
              return (
                <div key={a.id} className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold">{a.name} {a.char}</p>
                    <p className="text-[10px] text-gray-400">{a.desc}</p>
                  </div>
                  {active ? <span className="text-green-400 font-bold">Вкл</span> : owned ? (
                    <button className="retro-btn !p-1 !text-[10px] !m-0 !px-3" disabled={isPlaying} style={{background:'#555'}} onClick={() => setActiveAppleSkin(a.id)}>Вкл</button>
                  ) : (
                    <button className="retro-btn !p-1 !text-[10px] !m-0" disabled={safeApples < a.price || isPlaying} onClick={() => { if(safeApples >= a.price) { setApples(a=>a-a.price); setPurchasedSkins(p=>[...p, a.id]); setActiveAppleSkin(a.id); } }}>{a.price.toFixed(1)} 🍏</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}