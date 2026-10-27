# Edisar

Edisar es un RPG de navegador al estilo Tibia, creado por Juan Carlos (OakensGL).

**Jugar:** https://oakensgl.github.io/Edisar/

Las partidas se guardan en el navegador del jugador. El progreso queda en el almacenamiento local de este dispositivo.

Incluye una tienda de prueba de Edisar Coins, un cambista, un filtro de rareza para el loot AFK y un depósito.

## Cómo reconstruir

```bash
cd source && npm ci && ./build.sh
```

Eso genera `source/dist/index.html`. Copia ese archivo a `index.html` en la raíz del repositorio: es el que publica GitHub Pages.

El código del juego y el pipeline de compilación están en [`source/`](source/).
