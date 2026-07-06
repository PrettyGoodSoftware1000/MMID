# Music

Each level plays a looping track when it loads. Without any files here, the
game falls back to a small WebAudio-synthesized chiptune loop (`js/music.js`).

To use **real** Mega Man X music, drop audio files into this folder named
after the level's folder under `levels/` — any of `.mp3`, `.ogg`, or `.wav`:

| File | Played on |
|---|---|
| `test.mp3` | the TEST STAGE level (`levels/test`) |
| `long_test.mp3` | the LONG RANGE level (`levels/long_test`) |
| `default.mp3` | any level without its own track |

The lookup order is `music/<levelfolder>.<ext>` then `music/default.<ext>`,
trying `mp3`, `ogg`, `wav` in that order. Volume lives in `CFG.musicVolume`
(`js/config.js`).

SNES Mega Man X soundtrack rips can be found on video game music sites —
download, rename to the names above, done. Same non-commercial fan-work
caveats as the sprite sheets apply.
