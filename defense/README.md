# Starlight: Last Station v0.4.5

A tower defense set in the Project Starlight universe.
Hold the last station against Commander Edisar Starlight's fleet.

Open `index.html` in a browser (a local static server is best; a PWA install
is available over http). No build step.

Play opens the level select. There are nine levels of ten waves, each with
its own map: Orbital Station, Asteroid Belt, Moon Base, Solar Drydock,
Twin Gates, Eclipse Rim, Wreck Yard, Storm Needle, and Shatter Gate.
Twin Gates, Eclipse Rim, Wreck Yard, and Storm Needle have two entrances;
Shatter Gate has three. Ships spawn from every gate and the paths may
merge. Credits and turrets reset at the start of every level. The last
wave of each level is a boss. The Nebula turret unlocks on Level 3 and
later. Later maps introduce Wraiths (ships that briefly drop turret lock)
and Hive Pods (which burst into Swarmers when destroyed). Edisar's
flagships ignore the winding path and fly a straight line at the station.
Waves are denser than in v0.2: about twice the ships on Level 1, and up
to three times as many on Levels 2 and 3.

After you beat Level 3, level select also unlocks LAST STAND (subtitle:
Endless Siege): an endless mode with a center station and four corner
gates spiraling in. Two opposite gates start open; a new gate and a new
sky open every ten waves until all four lanes are live, then the sky
keeps cycling. Waves never stop and grow harder, mixing every ship type,
with an Edisar flagship every ten waves. Score points for kills, waves
cleared, hull held, and early-sends; your best score is saved. Milestone
stars on this mode are cosmetic only and do not add to the ARMORY.

Story on the title screen plays a skippable crawl, "The Return of Edisar
Starlight," then returns to the level select. The crawl is timed to the
SkyFire track, which plays once and does not loop or restart.

After a wave clears, a short on-map timer starts. About three seconds after
a wave begins spawning, you can send the next one without waiting for the
current wave to end, so several waves can be on the map at once. The
early-send bonus scales with the time you save. The auto timer still runs
when the field is clear. The score screen (kills, credits, hull, early-send
bonuses, time, and 1–3 stars) appears only after you finish a level.

Stars are kept as the best result on each level (27 maximum across nine
levels). An ARMORY on the title screen and the level-select screen spends those stars on
permanent turret and station upgrades, sold by Bazooka Joe, the station's
mad-scientist weapons inventor. Each turret has its own upgrades
(faster fire, wider blasts, deeper slows, and so on) instead of a
shared damage / range / cost package. After HERO PROTOCOL, a fork lets
you specialize the hero special as FREEZE (also freezes every ship) or
OVERLOAD (+50% special damage). Only one can be owned at a time; a free
respec returns every star and lets you switch.

Turrets can only be built on marked pads. A few gold premium pads sit on
the best chokepoints and must be unlocked with match credits (about 60–120)
before you can build there.

A HUD speed button (and the F key) cycles x1 / x2 / x3. It only speeds the
simulation; music is unaffected. Between waves, and before you start the
first wave, a calmer build track (Brave Pilots) loops and crossfades into
the battle music when a wave begins.

At the start of a level you choose a hero, Oakens or Nebula. They stand at
the path edge, auto-attack, move on a short cooldown when you tap a
destination, and have one special ability that hits every ship on the
field: Oakens calls a missile rain, Nebula calls down red lightning.
Bosses take reduced special damage. If they go down they respawn.

Three active abilities sit on the HUD: Orbital Strike (area damage), Drones
(briefly hold ships), and EMP (drops shields in an area). Tap the button,
then tap the field. Each turret has a targeting priority (First, Last,
Strongest, Weakest, Closest) you can cycle in its panel.

## Turrets and enemies

Six turrets are each upgradable to MK III: laser (twin beams at MK III),
missiles (cluster warheads), ice (brief freeze), railgun (piercing line),
tesla (chaining arc), and pulse (shield-breaking shockwave that poisons hulls; MK III toxin can spread).
Level 3 and later unlock the Nebula turret (about 300 credits, one per map): a
heavy dark-energy piercing beam, in the red of Nebula's mothership, that
ignores shields and resistances. On
Levels 1 and 2 it appears in the shop with a Level 3 lock tag.
Pulse no longer stuns; it strips shields and applies a stacking poison.
MK III poison is stronger and can spread to nearby ships.
After you place a turret, build mode clears so the cursor is free.

Scouts resist missiles and are weak to lasers. Armored resist lasers and
are weak to missiles and the railgun. Shielded ships resist almost everything
until Tesla or Pulse breaks the bubble. Cryo-engine ships are immune to ice slow and freeze. Interceptors are
very fast, low-HP slip-throughs, weak to lasers and Tesla; ice slows
them hard. Juggernauts are slow, heavy tanks, weak to railguns and
missiles; ice only slows them partially. Tap or click a ship to see its HP, weaknesses and
resistances.

## Controls

Desktop: click a turret in the build bar, then click a pad to place it,
or press and drag a turret from the bar onto a pad. Each button shows
the turret itself; hover (or long-press on a phone, without placing)
for a short description. A ghost and range
preview follow the cursor; dropping off a valid pad cancels. Click a
placed turret to upgrade or sell. Space or the Start / Send Wave button
begins the next wave, or sends the next one early (during the countdown,
or mid-wave once the 3-second call window opens).
P / Esc pauses, M mutes, F cycles battle speed. Keys 1–7 pick turret types
(7 is Nebula). Q / W / E arm Orbital, Drones and EMP (a TAP TO TARGET reticle follows the cursor; Esc or right-click cancels). The turret panel
cycles targeting priority. R or the on-screen SPECIAL button fires the
hero special at every ship on the field (no need to select the hero first).
T retries the current
level, with a Yes/No confirm, from play, the pause menu, or the defeat
screen. U upgrades, X sells.

Phone: the same, with taps and drag-and-drop. Speed, Send Wave and the
hero SPECIAL button are on the HUD. Landscape is recommended.
The first two levels show a short hint on how to move the hero and fire
their special.

When a boss wave starts, Edisar's line appears beside his portrait.

You can buy, place, upgrade and sell at any time, including during a wave.
Every enemy that dies grants credits.

## Credits

Title music is "Space Dimensions (8bit/Retro Version)" by Matthew Pablo,
licensed under CC-BY 3.0. In-game music is from Oblidivm's Space Shooter
Music pack, also CC-BY 3.0: "Music by Oblidivm - oblidivmmusic.blogspot.com".
Last Stand music is "The Evil Sacrifice Archenemies" by ISAo (SOUND
AIRYLUVS, https://airyluvs.com/), licensed under OGA-BY 3.0, from
https://opengameart.org/content/boss-battle-emotional-uplifting-metal-rock.
See CREDITS.txt and the in-game Credits panel for full attribution.
