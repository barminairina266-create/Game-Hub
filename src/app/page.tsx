import Clicker from './Clicker'; // Подключаем твою игру с частицами

export const metadata = {
  title: 'Sportik Game Hub — Играй в Super Clicker онлайн',
  description: 'Лучший хаб с аркадными играми. Кликай, зарабатывай очки, покупай улучшения и стань БОГОМ клика в Sportik Game Hub!',
  keywords: ['кликер', 'sportik', 'game hub', 'играть онлайн', 'бесплатные игры', 'super clicker'],
  openGraph: {
    title: 'Sportik Game Hub',
    description: 'Ставь рекорды в нашем крутом кликере!',
    type: 'website',
  },
};

export default function Home() {
  return (
    <main>
      <Clicker />
    </main>
  );
}