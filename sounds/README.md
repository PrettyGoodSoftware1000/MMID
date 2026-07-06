# Sounds

The game synthesizes Mega Man X-style sound effects with WebAudio by default.
To use **real** sounds instead, drop `.wav` files into this folder with these
exact names — any file present here automatically replaces its synthesized
version (see `js/sound.js`):

| File | Played when |
|---|---|
| `lemon.wav` | uncharged buster shot |
| `mid_shot.wav` | half-charge shot released |
| `full_shot.wav` | full-charge shot released |
| `charge_mid.wav` | charge reaches level 1 |
| `charge_full.wav` | charge reaches level 2 |
| `dash.wav` | dash start / wall kick |
| `hurt.wav` | player takes damage |
| `explosion.wav` | enemy destroyed |
| `impact.wav` | shot hits an enemy |
| `teleport.wav` | player teleports in |
| `menu_move.wav` | menu cursor move |
| `menu_select.wav` | menu confirm |

Rips of the SNES originals can be found on sites like The Sounds Resource
(sounds-resource.com → SNES → Mega Man X, "Sound Effects" sheet) — download,
rename to the names above, done. Same non-commercial fan-work caveats as the
sprite sheets apply.
