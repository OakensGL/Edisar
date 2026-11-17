# GOTICO

A gothic side-scrolling run-and-gun. Original characters and art.

You play as **Avrill** (twin revolvers, white-and-pink Victorian coat) or **Oakens** (steampunk crossbow, black frock coat with cyan trim). Hunt the graveyard under a red moon, free the captured, and face **the Grave Titan**.

## How to run locally

Serve the `game` folder over HTTP (opening `index.html` as a file may block audio or sprite loading in some browsers):

```bash
cd /workspace/gotico/game
python3 -m http.server 8770
```

Then open http://127.0.0.1:8770/

## Controls

**Keyboard + mouse (desktop)**
- Move: A/D (arrow keys also work)
- Aim: mouse (free 360°, on-screen crosshair; the hunter faces the cursor and the gun tracks it)
- Shoot: left mouse button (hold to fire)
- Jump: Space or W
- Crouch: S (lower stance and a smaller hitbox; can still aim and shoot; walks slowly; cannot jump while crouched)
- Bomb: right mouse button (thrown toward the cursor)
- Pause: P or Esc
- Confirm (menus): Enter, or click a menu item

**Touch / phone**
- On-screen buttons: left / right, JUMP, FIRE, BOMB, and pause
- FIRE auto-aims at the nearest enemy in the facing direction
- On the title screen, tap a hunter to select, tap again to start

## Features (v0.2)

- Character select, one foggy graveyard level, scrolling camera
- Mouse aim with rotatable guns, bombs thrown toward the cursor
- Lives and hit points, bombs with pickups, a heavy-shot weapon drop
- Two hostages to rescue
- Skeletons (some throw bones), swooping bats, ghouls — each plays a short death effect and despawns
- Boss: the Grave Titan (slam, bone throw, skull volleys), then Level Clear
- Pause, game over, retry
- Keyboard, mouse, and mobile touch controls
- Built-in synth sound effects (no copyrighted music)
