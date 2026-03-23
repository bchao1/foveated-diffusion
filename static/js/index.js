window.HELP_IMPROVE_VIDEOJS = false;

// Simple CSV parser: handles quoted fields with commas inside.
function parseCSV(text) {
  var lines = text.split('\n');
  var map = {};
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var commaIdx = line.indexOf(',');
    if (commaIdx === -1) continue;
    var id = line.substring(0, commaIdx).trim();
    var prompt = line.substring(commaIdx + 1).trim();
    if (prompt.charAt(0) === '"' && prompt.charAt(prompt.length - 1) === '"') {
      prompt = prompt.substring(1, prompt.length - 1);
    }
    map[id] = prompt;
  }
  return map;
}

function loadCSV(url) {
  return fetch(url).then(function (r) { return r.text(); }).then(parseCSV);
}

// Parses a CSV where rows are ordered; uses 0-based row index (after header) as key.
function parseOrderedCSV(text) {
  var lines = text.split('\n');
  var map = {};
  var idx = 0;
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var commaIdx = line.indexOf(',');
    var value = commaIdx === -1 ? line : line.substring(commaIdx + 1).trim();
    if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    map[String(idx)] = value;
    idx++;
  }
  return map;
}

function loadOrderedCSV(url) {
  return fetch(url).then(function (r) { return r.text(); }).then(parseOrderedCSV);
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// Maps a normalized coordinate (0–1) to a grid index (0 to N-1).
// The first and last 20% each map to a single cell (0 and N-1).
// The center 60% is divided evenly among cells 1 to N-2.
function marginGridIndex(t, N) {
  if (t <= 0.2) return 0;
  if (t >= 0.8) return N - 1;
  return Math.min(N - 2, Math.floor((t - 0.2) / 0.6 * (N - 2)) + 1);
}

// ---------------------------------------------------------------------------
// Image preloading cache
// ---------------------------------------------------------------------------

// Cache: key -> Image object (loaded or loading)
var imageCache = {};

// Preload a single image URL, returning the Image from cache
function preloadImage(url) {
  if (imageCache[url]) return imageCache[url];
  var img = new Image();
  img.src = url;
  imageCache[url] = img;
  return img;
}

// Preload an array of URLs in batches; calls onDone when ALL are loaded.
function preloadBatch(urls, concurrency, onDone) {
  concurrency = concurrency || 6;
  var idx = 0;
  var loaded = 0;
  var total = urls.length;
  if (total === 0) { if (onDone) onDone(); return; }
  function done() {
    loaded++;
    if (loaded >= total) { if (onDone) { onDone(); onDone = null; } return; }
    next();
  }
  function next() {
    while (idx < urls.length) {
      var url = urls[idx++];
      var cached = imageCache[url];
      // Already fully loaded — count it and continue loop (no recursion)
      if (cached && cached.complete) { loaded++; if (loaded >= total) { if (onDone) { onDone(); onDone = null; } return; } continue; }
      // Already started by another batch — listen for completion
      if (cached) {
        if (cached.complete) { loaded++; if (loaded >= total) { if (onDone) { onDone(); onDone = null; } return; } continue; }
        var settled = false;
        (function (img) {
          function settle() { if (!settled) { settled = true; done(); } }
          img.addEventListener('load', settle, { once: true });
          img.addEventListener('error', settle, { once: true });
        })(cached);
        return;
      }
      // New image — create, cache, and start loading
      var img = new Image();
      imageCache[url] = img;
      img.onload = img.onerror = done;
      img.src = url;
      return;
    }
  }
  for (var i = 0; i < Math.min(concurrency, total); i++) next();
}

// Show/hide a loading overlay by element ID
function showLoading(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}
function hideLoading(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// Set an <img> element's src from cache (instant if preloaded)
function setImageFromCache(imgEl, url) {
  var cached = imageCache[url];
  if (cached && cached.complete && cached.naturalWidth > 0) {
    // Already loaded — swap src for instant display
    imgEl.src = url;
  } else {
    // Not yet cached or still loading — preload and set
    preloadImage(url);
    imgEl.src = url;
  }
}

// Debounce helper
function debounce(fn, delay) {
  var timer = null;
  return function () {
    var ctx = this, args = arguments;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

document.addEventListener('DOMContentLoaded', function () {

  // Navbar burger toggle
  var burgers = document.querySelectorAll('.navbar-burger');
  burgers.forEach(function (el) {
    el.addEventListener('click', function () {
      var target = document.getElementById(el.dataset.target);
      el.classList.toggle('is-active');
      if (target) target.classList.toggle('is-active');
    });
  });

  // ---------------------------------------------------------------------------
  // Baseline video slideshow (720p)
  // ---------------------------------------------------------------------------

  var baseline720pVideoIds = [12, 15, 1, 24, 20, 28, 34, 36, 41, 14, 19];

  var video720pEl = document.getElementById('baseline-720p-video');
  var prev720pBtn = document.getElementById('baseline-720p-prev');
  var next720pBtn = document.getElementById('baseline-720p-next');
  var baseline720pPromptEl = document.getElementById('baseline-720p-prompt');
  var baseline720pPrompts = {};

  loadCSV('./static/files/prompts/claude_prompts_new_en.csv').then(function (map) {
    baseline720pPrompts = map;
    updateBaseline720pPrompt();
  });

  if (video720pEl && baseline720pVideoIds.length > 0) {
    var currentIndex720p = 0;

    function updateBaseline720pPrompt() {
      if (!baseline720pPromptEl) return;
      var fileId = String(baseline720pVideoIds[currentIndex720p]);
      var prompt = baseline720pPrompts[fileId] || '';
      baseline720pPromptEl.textContent = prompt ? '[' + fileId + '] ' + prompt : '';
    }

    function loadVideo720p(index) {
      currentIndex720p = index;
      video720pEl.src = './static/videos/baselines_720p/' + baseline720pVideoIds[currentIndex720p] + '.mp4';
      video720pEl.load();
      video720pEl.play().catch(function () {});
      updateBaseline720pPrompt();
    }

    loadVideo720p(0);

    if (prev720pBtn) {
      prev720pBtn.addEventListener('click', function () {
        loadVideo720p((currentIndex720p - 1 + baseline720pVideoIds.length) % baseline720pVideoIds.length);
      });
    }
    if (next720pBtn) {
      next720pBtn.addEventListener('click', function () {
        loadVideo720p((currentIndex720p + 1) % baseline720pVideoIds.length);
      });
    }

    var baseline720pContainer = video720pEl.parentElement;
    baseline720pContainer.addEventListener('mouseenter', function () { video720pEl.pause(); });
    baseline720pContainer.addEventListener('mouseleave', function () { video720pEl.play().catch(function () {}); });
  }

  // ---------------------------------------------------------------------------
  // Baseline image slideshow
  // ---------------------------------------------------------------------------

  var baselineImageIds = [8, 10, 35, 29, 61, 3];

  var baselineImgEl = document.getElementById('baseline-img');
  var baselineImgPrevBtn = document.getElementById('baseline-img-prev');
  var baselineImgNextBtn = document.getElementById('baseline-img-next');
  var baselineImgPromptEl = document.getElementById('baseline-img-prompt');
  var baselineImgPrompts = {};

  loadOrderedCSV('./static/files/prompts/image_baseline_prompts.csv').then(function (map) {
    baselineImgPrompts = map;
    updateBaselineImgPrompt();
  });

  if (baselineImgEl && baselineImageIds.length > 0) {
    var currentImgIndex = 0;

    function updateBaselineImgPrompt() {
      if (!baselineImgPromptEl) return;
      var fileId = String(baselineImageIds[currentImgIndex]);
      var prompt = baselineImgPrompts[fileId] || '';
      baselineImgPromptEl.textContent = prompt || '';
    }

    function loadBaselineImg(index) {
      currentImgIndex = index;
      var padded = String(baselineImageIds[currentImgIndex]).padStart(5, '0');
      setImageFromCache(baselineImgEl, './static/images/baselines/' + padded + '.png');
      updateBaselineImgPrompt();
    }

    loadBaselineImg(0);

    if (baselineImgPrevBtn) {
      baselineImgPrevBtn.addEventListener('click', function () {
        loadBaselineImg((currentImgIndex - 1 + baselineImageIds.length) % baselineImageIds.length);
      });
    }
    if (baselineImgNextBtn) {
      baselineImgNextBtn.addEventListener('click', function () {
        loadBaselineImg((currentImgIndex + 1) % baselineImageIds.length);
      });
    }

    // Preload all baseline images
    baselineImageIds.forEach(function (id) {
      var padded = String(id).padStart(5, '0');
      preloadImage('./static/images/baselines/' + padded + '.png');
    });
  }

  // ---------------------------------------------------------------------------
  // Foveation trajectory video slideshow
  // ---------------------------------------------------------------------------

  var fovTrajIds = [153, 157, 176, 180, 184, 228, 234, 275, 388, 432, 463, 471, 125, 133, 138];

  var fovVideo = document.getElementById('fov-traj-video');
  var fovPrev = document.getElementById('fov-traj-prev');
  var fovNext = document.getElementById('fov-traj-next');
  var fovContainer = document.getElementById('fov-traj-video-container');
  var fovPromptEl = document.getElementById('fov-traj-prompt');
  var fovPrompts = {};

  loadCSV('./static/files/prompts/claude_prompts_new_v2_en.csv').then(function (map) {
    fovPrompts = map;
    updateFovPrompt();
  });

  if (fovVideo && fovTrajIds.length > 0) {
    var fovIdx = 0;

    function updateFovPrompt() {
      if (!fovPromptEl) return;
      var fileId = String(fovTrajIds[fovIdx]);
      var prompt = fovPrompts[fileId] || '';
      fovPromptEl.textContent = prompt ? '[' + fileId + '] ' + prompt : '';
    }

    function loadFovVideo(index) {
      fovIdx = index;
      fovVideo.src = './static/videos/fov_traj/' + fovTrajIds[fovIdx] + '.mp4';
      fovVideo.load();
      fovVideo.play().catch(function () {});
      updateFovPrompt();
    }

    loadFovVideo(0);

    if (fovPrev) {
      fovPrev.addEventListener('click', function () {
        loadFovVideo((fovIdx - 1 + fovTrajIds.length) % fovTrajIds.length);
      });
    }
    if (fovNext) {
      fovNext.addEventListener('click', function () {
        loadFovVideo((fovIdx + 1) % fovTrajIds.length);
      });
    }

    if (fovContainer) {
      fovContainer.addEventListener('mouseenter', function () { fovVideo.pause(); });
      fovContainer.addEventListener('mouseleave', function () { fovVideo.play().catch(function () {}); });
    }
  }

  // ---------------------------------------------------------------------------
  // Combined applications grid (720p: games, driving, robotics)
  // ---------------------------------------------------------------------------

  var appsPages = [
    { label: 'VR Gaming',            folder: 'games_720p',    ids: [8, 15, 25],  csv: 'games_en.csv' },
    { label: 'Autonomous Driving',   folder: 'av_720p',       ids: [2, 6, 11],   csv: 'av_en.csv' },
    { label: 'Robotics',             folder: 'robotics_720p', ids: [11, 67, 65], csv: 'robotics_en.csv' },
  ];

  var appsGrid = document.getElementById('apps-grid');

  if (appsGrid) {
    appsPages.forEach(function (pg, catIdx) {
      var rowLabel = appsGrid.querySelector('.apps-grid-row[data-category="' + catIdx + '"] .apps-row-label');
      if (rowLabel) rowLabel.textContent = pg.label;

      var videos = appsGrid.querySelectorAll('video.apps-video[data-category="' + catIdx + '"]');
      videos.forEach(function (v, i) {
        v.src = './static/videos/saliency/' + pg.folder + '/' + pg.ids[i] + '.mp4';
        v.load();
        v.play().catch(function () {});
      });

      loadCSV('./static/files/prompts/' + pg.csv).then(function (map) {
        var prompts = appsGrid.querySelectorAll('p.apps-prompt[data-category="' + catIdx + '"]');
        prompts.forEach(function (p, i) {
          var fileId = String(pg.ids[i]);
          var prompt = map[fileId] || '';
          p.textContent = prompt ? '[' + fileId + '] ' + prompt : '';
        });
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Foveation Trajectory — image grid hover (2x: image + tokenization)
  // ---------------------------------------------------------------------------

  var fovTrajImgIds = ['003', '006', '011', '012', '013',
    '000', '001', '002', '099',
    '020', '021', '023', '024'];
  var fovTrajImgN = 10;
  var fovTrajImgIndex = 0;
  var fovTrajLastCell = -1;

  var fovTrajImg2x = document.getElementById('fov-traj-img-2x');
  var fovTrajMask2x = document.getElementById('fov-traj-mask-2x');
  var fovTrajGridOverlays = document.querySelectorAll('.fov-traj-grid-overlay');
  var fovTrajImgPrev = document.getElementById('fov-traj-img-prev');
  var fovTrajImgNext = document.getElementById('fov-traj-img-next');

  // Build all URLs for a given fov-traj sample
  function fovTrajUrlsForId(id) {
    var urls = [];
    for (var c = 0; c < 100; c++) {
      var padded = String(c).padStart(4, '0');
      urls.push('./static/images/fov_traj_grid_10x10_2x/random/' + id + '/img_' + padded + '.png');
      urls.push('./static/images/tokenization_masks_10x10_2x/tokenization_mask_' + padded + '.png');
    }
    return urls;
  }

  if (fovTrajImg2x && fovTrajMask2x) {
    var fovTrajReady = false;

    function loadFovTrajGridImg(cellIdx) {
      if (!fovTrajReady || cellIdx === fovTrajLastCell) return;
      fovTrajLastCell = cellIdx;
      var id = fovTrajImgIds[fovTrajImgIndex];
      var padded = String(cellIdx).padStart(4, '0');
      setImageFromCache(fovTrajImg2x, './static/images/fov_traj_grid_10x10_2x/random/' + id + '/img_' + padded + '.png');
      setImageFromCache(fovTrajMask2x, './static/images/tokenization_masks_10x10_2x/tokenization_mask_' + padded + '.png');
    }

    function preloadFovTrajSample(idx, onDone) {
      var id = fovTrajImgIds[idx];
      preloadBatch(fovTrajUrlsForId(id), 8, onDone);
    }

    function preloadFovTrajCurrent() {
      showLoading('fov-traj-img-loading');
      fovTrajReady = false;
      preloadFovTrajSample(fovTrajImgIndex, function () {
        fovTrajReady = true;
        hideLoading('fov-traj-img-loading');
        fovTrajLastCell = -1;
        loadFovTrajGridImg(44);
        // Preload neighbors in background
        var nextIdx = (fovTrajImgIndex + 1) % fovTrajImgIds.length;
        var prevIdx = (fovTrajImgIndex - 1 + fovTrajImgIds.length) % fovTrajImgIds.length;
        setTimeout(function () { preloadFovTrajSample(nextIdx); }, 1000);
        setTimeout(function () { preloadFovTrajSample(prevIdx); }, 2000);
      });
    }

    fovTrajGridOverlays.forEach(function (overlay) {
      overlay.addEventListener('mousemove', function (e) {
        if (!fovTrajReady) return;
        var rect = overlay.getBoundingClientRect();
        var tx = (e.clientX - rect.left) / rect.width;
        var ty = (e.clientY - rect.top) / rect.height;
        var col = marginGridIndex(tx, fovTrajImgN);
        var row = marginGridIndex(ty, fovTrajImgN);
        loadFovTrajGridImg(row * fovTrajImgN + col);
      });
    });

    preloadFovTrajCurrent();

    if (fovTrajImgPrev) {
      fovTrajImgPrev.addEventListener('click', function () {
        fovTrajImgIndex = (fovTrajImgIndex - 1 + fovTrajImgIds.length) % fovTrajImgIds.length;
        preloadFovTrajCurrent();
      });
    }
    if (fovTrajImgNext) {
      fovTrajImgNext.addEventListener('click', function () {
        fovTrajImgIndex = (fovTrajImgIndex + 1) % fovTrajImgIds.length;
        preloadFovTrajCurrent();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Vary-radius image slider (saliency + bbox side by side) with slideshow
  // ---------------------------------------------------------------------------

  var varyRadiusIds = [];
  for (var vi = 0; vi <= 3; vi++) varyRadiusIds.push(String(vi).padStart(3, '0'));
  var varyRadiusIndex = 0;

  var bboxImgEl     = document.getElementById('bbox-img');
  var saliencyImgEl = document.getElementById('saliency-img');
  var bboxMaskImgEl = document.getElementById('bbox-mask-img');
  var varySlider    = document.getElementById('bbox-slider');
  var bboxPrev      = document.getElementById('bbox-prev');
  var bboxNext      = document.getElementById('bbox-next');

  if (bboxImgEl && saliencyImgEl && bboxMaskImgEl && varySlider) {
    var varyImageCount = 0;

    function varyRadiusFolders() {
      var id = varyRadiusIds[varyRadiusIndex];
      return {
        bbox: './static/images/vary_radius_new/bbox/' + id + '/',
        saliency: './static/images/vary_radius_new/saliency/' + id + '/',
        mask: './static/images/tokenization_masks_radius_2x/'
      };
    }

    function probeImages(folder, index, found, onDone) {
      var padded = String(index).padStart(4, '0');
      var probe = new Image();
      probe.onload = function () { found.push(index); probeImages(folder, index + 1, found, onDone); };
      probe.onerror = function () { onDone(found); };
      probe.src = folder + 'img_' + padded + '.png';
    }

    function preloadVaryRadiusSample(sampleIdx, count, onDone) {
      var id = varyRadiusIds[sampleIdx];
      var bboxFolder = './static/images/vary_radius_new/bbox/' + id + '/';
      var saliencyFolder = './static/images/vary_radius_new/saliency/' + id + '/';
      var maskFolder = './static/images/tokenization_masks_radius_2x/';
      var urls = [];
      for (var i = 0; i < count; i++) {
        var padded = String(i).padStart(4, '0');
        urls.push(bboxFolder + 'img_' + padded + '.png');
        urls.push(saliencyFolder + 'img_' + padded + '.png');
        urls.push(maskFolder + 'tokenization_mask_' + padded + '.png');
      }
      preloadBatch(urls, 6, onDone);
    }

    var bboxReady = false;

    function loadVaryRadius() {
      var folders = varyRadiusFolders();
      showLoading('bbox-loading');
      bboxReady = false;
      varySlider.disabled = true;
      probeImages(folders.bbox, 0, [], function (ids) {
        if (ids.length === 0) return;
        varyImageCount = ids.length;
        varySlider.min = 0;
        varySlider.max = ids.length - 1;
        varySlider.value = 0;

        function loadVaryImg(idx) {
          var padded = String(ids[idx]).padStart(4, '0');
          setImageFromCache(bboxImgEl, folders.bbox + 'img_' + padded + '.png');
          setImageFromCache(saliencyImgEl, folders.saliency + 'img_' + padded + '.png');
          setImageFromCache(bboxMaskImgEl, folders.mask + 'tokenization_mask_' + padded + '.png');
        }

        // Preload all images, then enable slider
        preloadVaryRadiusSample(varyRadiusIndex, ids.length, function () {
          bboxReady = true;
          hideLoading('bbox-loading');
          varySlider.disabled = false;
          loadVaryImg(0);

          varySlider.oninput = function () {
            if (!bboxReady) return;
            loadVaryImg(parseInt(this.value, 10));
          };

          // Preload neighbors
          var nextIdx = (varyRadiusIndex + 1) % varyRadiusIds.length;
          setTimeout(function () { preloadVaryRadiusSample(nextIdx, ids.length); }, 2000);
        });
      });
    }

    loadVaryRadius();

    if (bboxPrev) {
      bboxPrev.addEventListener('click', function () {
        varyRadiusIndex = (varyRadiusIndex - 1 + varyRadiusIds.length) % varyRadiusIds.length;
        loadVaryRadius();
      });
    }
    if (bboxNext) {
      bboxNext.addEventListener('click', function () {
        varyRadiusIndex = (varyRadiusIndex + 1) % varyRadiusIds.length;
        loadVaryRadius();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Teaser — 2x3 grid: 3 resolution factors (1x, 2x, 4x) × (image + tokenization)
  // ---------------------------------------------------------------------------

  var teaserImg1x = document.getElementById('teaser-img-1x');
  var teaserImg2x = document.getElementById('teaser-img-2x');
  var teaserImg4x = document.getElementById('teaser-img-4x');
  var teaserMask1x = document.getElementById('teaser-mask-1x');
  var teaserMask2x = document.getElementById('teaser-mask-2x');
  var teaserMask4x = document.getElementById('teaser-mask-4x');
  var teaserGridOverlays = document.querySelectorAll('.teaser-grid-overlay');
  var teaserGridN = 10;
  var teaserLastCell = -1;

  if (teaserImg1x && teaserImg2x && teaserImg4x && teaserMask1x && teaserMask2x && teaserMask4x) {
    var teaserReady = false;

    function loadTeaserGridImg(cellIdx) {
      if (!teaserReady || cellIdx === teaserLastCell) return;
      teaserLastCell = cellIdx;
      var padded = String(cellIdx).padStart(4, '0');
      setImageFromCache(teaserImg1x, './static/images/fov_traj_grid_10x10_1x/random/006/img_0000.png');
      setImageFromCache(teaserMask1x, './static/images/tokenization_masks_1x/tokenization_mask_0000.png');
      setImageFromCache(teaserImg2x, './static/images/fov_traj_grid_10x10_2x/random/006/img_' + padded + '.png');
      setImageFromCache(teaserMask2x, './static/images/tokenization_masks_10x10_2x/tokenization_mask_' + padded + '.png');
      setImageFromCache(teaserImg4x, './static/images/fov_traj_grid_10x10_4x/random_4x_distill/006/img_' + padded + '.png');
      setImageFromCache(teaserMask4x, './static/images/tokenization_masks_10x10_4x/tokenization_mask_' + padded + '.png');
    }

    // Preload all teaser images; show spinner until ALL are loaded
    showLoading('teaser-loading');
    (function () {
      var allUrls = [];
      allUrls.push('./static/images/fov_traj_grid_10x10_1x/random/006/img_0000.png');
      allUrls.push('./static/images/tokenization_masks_1x/tokenization_mask_0000.png');
      for (var c = 0; c < 100; c++) {
        var padded = String(c).padStart(4, '0');
        allUrls.push('./static/images/fov_traj_grid_10x10_2x/random/006/img_' + padded + '.png');
        allUrls.push('./static/images/tokenization_masks_10x10_2x/tokenization_mask_' + padded + '.png');
        allUrls.push('./static/images/fov_traj_grid_10x10_4x/random_4x_distill/006/img_' + padded + '.png');
        allUrls.push('./static/images/tokenization_masks_10x10_4x/tokenization_mask_' + padded + '.png');
      }
      preloadBatch(allUrls, 12, function () {
        teaserReady = true;
        hideLoading('teaser-loading');
        loadTeaserGridImg(44);
      });
    })();

    teaserGridOverlays.forEach(function (overlay) {
      overlay.addEventListener('mousemove', function (e) {
        if (!teaserReady) return;
        var rect = overlay.getBoundingClientRect();
        var tx = (e.clientX - rect.left) / rect.width;
        var ty = (e.clientY - rect.top) / rect.height;
        var col = marginGridIndex(tx, teaserGridN);
        var row = marginGridIndex(ty, teaserGridN);
        loadTeaserGridImg(row * teaserGridN + col);
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Saliency-guided image generation — vary_position_grid hover grid slideshow
  // ---------------------------------------------------------------------------

  var saliencyGridIds = [];
  var saliencyStartId = 0;
  var saliencyEndId = 4;
  for (var si = saliencyStartId; si <= saliencyEndId; si++) saliencyGridIds.push(String(si).padStart(3, '0'));
  var saliencyGridN = 10;
  var saliencyGridIndex = 0;
  var saliencyLastCell = -1;

  var saliencyGridRandomImg = document.getElementById('saliency-grid-random-img');
  var saliencyGridSaliencyImg = document.getElementById('saliency-grid-saliency-img');
  var saliencyGridMaskImg = document.getElementById('saliency-grid-mask-img');
  var saliencyGridOverlays = document.querySelectorAll('.saliency-grid-overlay');
  var saliencyGridPrev = document.getElementById('saliency-grid-prev');
  var saliencyGridNext = document.getElementById('saliency-grid-next');

  // Build all URLs for a given saliency sample
  function saliencyUrlsForId(id) {
    var urls = [];
    for (var c = 0; c < 100; c++) {
      var padded = String(c).padStart(4, '0');
      urls.push('./static/images/vary_position_grid_10x10/random/' + id + '/img_' + padded + '.png');
      urls.push('./static/images/vary_position_grid_10x10/saliency/' + id + '/img_' + padded + '.png');
      urls.push('./static/images/tokenization_masks_10x10_2x/tokenization_mask_' + padded + '.png');
    }
    return urls;
  }

  if (saliencyGridRandomImg && saliencyGridSaliencyImg && saliencyGridMaskImg && saliencyGridOverlays.length === 3) {
    var saliencyReady = false;

    function saliencyGridBasePaths() {
      var id = saliencyGridIds[saliencyGridIndex];
      return {
        random: './static/images/vary_position_grid_10x10/random/' + id + '/',
        saliency: './static/images/vary_position_grid_10x10/saliency/' + id + '/',
        mask: './static/images/tokenization_masks_10x10_2x/'
      };
    }

    function loadSaliencyGridImg(cellIdx) {
      if (!saliencyReady || cellIdx === saliencyLastCell) return;
      saliencyLastCell = cellIdx;
      var paths = saliencyGridBasePaths();
      var padded = String(cellIdx).padStart(4, '0');
      setImageFromCache(saliencyGridRandomImg, paths.random + 'img_' + padded + '.png');
      setImageFromCache(saliencyGridSaliencyImg, paths.saliency + 'img_' + padded + '.png');
      setImageFromCache(saliencyGridMaskImg, paths.mask + 'tokenization_mask_' + padded + '.png');
    }

    function preloadSaliencySample(idx, onDone) {
      var id = saliencyGridIds[idx];
      preloadBatch(saliencyUrlsForId(id), 8, onDone);
    }

    function preloadSaliencyCurrent() {
      showLoading('saliency-loading');
      saliencyReady = false;
      preloadSaliencySample(saliencyGridIndex, function () {
        saliencyReady = true;
        hideLoading('saliency-loading');
        saliencyLastCell = -1;
        loadSaliencyGridImg(12);
        // Preload neighbors in background
        var nextIdx = (saliencyGridIndex + 1) % saliencyGridIds.length;
        var prevIdx = (saliencyGridIndex - 1 + saliencyGridIds.length) % saliencyGridIds.length;
        setTimeout(function () { preloadSaliencySample(nextIdx); }, 1500);
        setTimeout(function () { preloadSaliencySample(prevIdx); }, 3000);
      });
    }

    saliencyGridOverlays.forEach(function (overlay) {
      overlay.addEventListener('mousemove', function (e) {
        if (!saliencyReady) return;
        var rect = overlay.getBoundingClientRect();
        var tx = (e.clientX - rect.left) / rect.width;
        var ty = (e.clientY - rect.top) / rect.height;
        var col = marginGridIndex(tx, saliencyGridN);
        var row = marginGridIndex(ty, saliencyGridN);
        loadSaliencyGridImg(row * saliencyGridN + col);
      });
    });

    preloadSaliencyCurrent();

    saliencyGridPrev.addEventListener('click', function () {
      saliencyGridIndex = (saliencyGridIndex - 1 + saliencyGridIds.length) % saliencyGridIds.length;
      preloadSaliencyCurrent();
    });
    saliencyGridNext.addEventListener('click', function () {
      saliencyGridIndex = (saliencyGridIndex + 1) % saliencyGridIds.length;
      preloadSaliencyCurrent();
    });
  }
});
