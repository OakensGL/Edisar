# Starlight: Last Station v0.2.1

A tower defense set in the Project Starlight universe.
Hold the last station against Commander Edisar Starlight's fleet.

Open `index.html` in a browser (a local static server is best; a PWA install
is available over http). No build step.

Play opens the level select. There are three levels of ten waves, each with
its own map: Orbital Station, Asteroid Belt, and Moon Base. Credits and
turrets reset at the start of every level. The last wave of each level is a
boss; Level 3 brings Edisar's flagship at full strength.
Waves are denser than in v0.2: about twice the ships on Level 1, and up
to three times as many on Levels 2 and 3.

Story on the title screen plays a skippable crawl, "The Return of Edisar
Starlight," then returns to the level select. The crawl is timed to the
SkyFire track, which plays once and does not loop or restart.

After a wave clears, a short on-map timer starts. About three seconds after
a wave begins spawning, you can send the next one without waiting for the
current wave to end, so several waves can be on the map at once. The
early-send bonus scales with the time you save. The auto timer still runs
when the field is clear. The score screen (kills, credits, hull, early-send
bonuses, time, and 1–3 stars) appears only after you finish a level.

A HUD speed button (and the F key) cycles x1 / x2 / x3. It only speeds the
simulation; music is unaffected.

## Turrets and enemies

Six turrets are each upgradable to MK III: laser (twin beams at MK III),
missiles (cluster warheads), ice (brief freeze), railgun (piercing line),
tesla (chaining arc), and pulse (shield-breaking shockwave; only MK III stuns, briefly, and bosses are immune).
Level 3 also unlocks the Nebula turret (about 300 credits, one per map): a
heavy dark-energy piercing beam that ignores shields and resistances. On
Levels 1 and 2 it appears in the shop with a Level 3 lock tag.
After you place a turret, build mode clears so the cursor is free.

Scouts resist missiles and are weak to lasers. Armored resist lasers and
are weak to missiles and the railgun. Shielded ships resist almost everything
until Tesla or Pulse breaks the bubble. Cryo-engine ships are immune to ice slow and freeze. Interceptors are
very fast, low-HP slip-throughs, weak to lasers and Tesla; ice slows
them hard. Juggernauts are slow, heavy tanks, weak to railguns and
missiles; ice only slows them partially. Tap or click a ship to see its HP, weaknesses and
resistances.

## Controls

Desktop: click a turret in the build bar, then click a pad to place it.
Click a placed turret to upgrade or sell. Space or the Start / Send Wave
button begins the next wave, or sends the next one early (during the
countdown, or mid-wave once the 3-second call window opens).
P / Esc pauses, M mutes, F cycles battle speed. Keys 1–7 pick turret types
(7 is Nebula). U upgrades, X sells.

Phone: the same, with taps. Speed and Send Wave are on the HUD. Landscape is
recommended.

You can buy, place, upgrade and sell at any time, including during a wave.
Every enemy that dies grants credits.

## Credits

Title music is "Space Dimensions (8bit/Retro Version)" by Matthew Pablo,
licensed under CC-BY 3.0. In-game music is from Oblidivm's Space Shooter
Music pack, also CC-BY 3.0: "Music by Oblidivm - oblidivmmusic.blogspot.com".
See CREDITS.txt and the in-game Credits panel for full attribution.
