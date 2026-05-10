import Clicker from './Clicker'; // Подключаем твой основной код

export const metadata = {
  title: 'Sportik Game Hub — начинающий хаб с играми',
  description: 'Играй в Super Clicker и другие аркадные игры прямо в браузере. Ставь рекорды и прокачивай свой уровень!',
  keywords: ['кликер', 'онлайн игры', 'game arcade', 'super clicker', 'играть бесплатно', 'Game hub', 'Sportik'],
  openGraph: {
    title: 'Sportik Game Hub',
    description: 'скоро будет больше игр!',
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