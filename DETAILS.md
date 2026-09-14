# how it works

`script.js` is the whole thing, and it's short:

- Pointer events (not mouse or touch separately) so one code path covers
  desktop and phone.
- On each move, the pointer's angle around the fish's centre is compared to the
  previous one. That delta gets added to the rotation, so the fish tracks your
  hand instead of snapping to it. The delta is unwrapped across the -180/180
  seam so it doesn't flip out when you cross the left side.
- Audio is gated on motion, not on holding. Every meaningful move stamps
  `lastMoveAt`; a `requestAnimationFrame` loop pauses playback once that stamp
  goes stale. Hold the fish still and the music stops even though you haven't
  let go.
- Playback resumes from where it paused rather than restarting, so a long spin
  sounds continuous.

## knobs

Two knobs at the top of `script.js`:

| | |
|---|---|
| `IDLE_MS` | how long the fish can sit still before the music stops (130ms) |
| `MIN_DELTA` | how much movement counts as spinning (0.35 degrees) |

## the fish

The fish is 22 PNGs in `assets/frames/` (`00.png` - `21.png`) - one full 360
degree turn, cut frame-by-frame out of the original Spinning Fish meme gif.
Dragging maps your pointer angle onto that cycle, so the fish turns on its
vertical axis exactly the way it does in the meme instead of tumbling flat.

To swap in a different subject, replace the frames with your own evenly-spaced
turntable sequence and set `FRAMES` in `script.js` to however many you have.
They must be the same dimensions, in order, on a white background.

Transparent PNG works best. Nothing else changes - rotation pivots on the
image's centre automatically.

## audio

**There is no audio file in this repo.** The one this site was built around is
copyrighted, so it isn't committed here.

Drop any mp3 at `assets/song.mp3` and it works:

```
assets/song.mp3
```

A short clip that loops well is ideal - a few seconds is plenty. Until you add
one, the fish still spins, it's just silent, and the page will say so.

## run locally

```
python3 -m http.server 8000
```

Open http://localhost:8000

No build step, no dependencies, no framework. Three files and an image.

## deploy

Static site, so anywhere that serves files will do. On Netlify:

1. Push to GitHub
2. Add new site -> Import an existing project -> pick the repo
3. Build command: leave empty. Publish directory: `.`
4. Add `assets/song.mp3` separately, since git doesn't have it - drag it into
   the deploy, or upload it in the site's file browser

Custom domain lives under Domain settings.
