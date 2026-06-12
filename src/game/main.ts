import { Game } from '../engine/game';
import { content } from './content';

const canvas = document.getElementById('screen') as HTMLCanvasElement;
const game = new Game(canvas, content);

if (import.meta.env.DEV) {
  const { attachDebugOverlay } = await import('../debug/overlay');
  attachDebugOverlay(game);
  (window as unknown as { __game: Game }).__game = game;
}

void game.start();
