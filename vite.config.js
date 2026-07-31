import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        catching: resolve(__dirname, 'src/games/01-catching/index.html'),
        whack: resolve(__dirname, 'src/games/02-whack/index.html'),
        flappy: resolve(__dirname, 'src/games/03-flappy/index.html'),
        memory: resolve(__dirname, 'src/games/04-memory/index.html'),
        wheel: resolve(__dirname, 'src/games/05-wheel/index.html'),
      },
    },
  },
  server: {
    open: true,
  },
});
