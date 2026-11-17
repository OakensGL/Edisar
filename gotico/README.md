# GOTICO

A gothic side-scrolling run-and-gun. Original characters and art.

You play as **Avrill** (twin revolvers, white-and-pink Victorian coat) or **Oakens** (steampunk crossbow-shotgun, black frock coat with cyan trim). Hunt the graveyard under a red moon, free the captured, and face **the Grave Titan**.

## How to run locally

Serve the `game` folder over HTTP (opening `index.html` as a file may block audio in some browsers):

```bash
cd /workspace/gotico/game
python3 -m http.server 8770
```

Then open http://127.0.0.1:8770/

## Controls

**Keyboard**
- Move: Arrow keys or A/D
- Aim up / down: Up/W or Down/S (down while airborne)
- Jump: Z, Space, or Up
- Shoot: X, J, or Ctrl (hold to fire)
- Bomb: C, K, or Shift
- Pause: P or Esc
- Confirm: Enter or Space

**Touch / phone**
- On-screen buttons: left / right, JUMP, FIRE, BOMB, and pause
- On the title screen, tap a hunter to select, tap again to start

## Features (first playable)

- Character select, one foggy graveyard level, scrolling camera
- Lives and hit points, bombs with pickups, a heavy-shot weapon drop
- Two hostages to rescue
- Skeletons (some throw bones), swooping bats, ghouls
- Boss: the Grave Titan (slam, bone throw, skull volleys), then Level Clear
- Pause, game over, retry
- Keyboard and mobile touch controls
- Built-in synth sound effects (no copyrighted music)
