# Website

All video IDs and folder paths are configured in `static/js/index.js`.

---

## Baseline comparison

**480p** — `static/js/index.js` line 54
```js
var baselineVideoIds = [1, 6, 19, ...]; // 480p
```
Videos load from `./static/videos/baselines/<id>.mp4`

**720p** — `static/js/index.js` line 110
```js
var baseline720pVideoIds = [1, 5, 6, ...]; // 720p
```
Videos load from `./static/videos/baselines_720p/<id>.mp4`

---

## Foveation trajectory

**Video IDs** — `static/js/index.js` line 168
```js
var fovTrajIds = [119, 125, 133, ...]; // merged
```
Videos load from `./static/videos/fov_traj/<id>.mp4`

---

## Random mask vs. saliency-guided generation

**Video IDs per subfolder** — `static/js/index.js` line 332
```js
var maskSubfolders = [
  { name: 'games_comparison',    ids: [1, 3, 7, ...], csv: 'games_en.csv' },
  { name: 'av_comparison',       ids: [],              csv: 'av_en.csv' },
  { name: 'robotics_comparison', ids: [],              csv: 'robotics_en.csv' },
];
```
- Set `ids` to a specific list to show only those videos; leave `ids: []` to use all files up to `count`.
- Videos load from `./static/videos/saliency/random_mask_comparison/<subfolder>/<id>.mp4`

---

## Saliency-guided generation applications

Each application (VR Gaming, Autonomous Vehicles, Robotics) shows both 480p and 720p sub-sections.

**Video IDs** — `static/js/index.js` lines ~251–265
```js
if (folder.includes('games')) {
  saliencyIds = is720p
    ? [1, 8, 13, ...]   // 720p
    : [1, 2, 15, ...];  // 480p
} else if (folder.includes('av')) { ... }
  else if (folder.includes('robotics')) { ... }
```
Edit the ID arrays here to change which videos are shown per application per resolution.
- IDs must be a multiple of 3 since three videos are shown per page.
- 480p videos load from `./static/videos/saliency/<folder>/<id>.mp4`
- 720p videos load from `./static/videos/saliency/<folder>_720p/<id>.mp4`

**Resolution and folder** are set in `index.html` on each `.saliency-slideshow` div via `data-folder`, `data-resolution`, and `data-count` attributes (e.g. `data-folder="games" data-resolution="720p" data-count="100"`).
