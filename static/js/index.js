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
  // Baseline video slideshow (480p) — commented out, replaced by 720p below
  // ---------------------------------------------------------------------------

  // var baselineVideoIds = null;
  // // var baselineVideoIds = [1, 6, 19, 39, 46, 48, 50, 55, 58, 59, 60, 62, 77, 85, 96]; // 480p
  // var baselineVideoIds = [60, 48, 46, 58, 6, 59, 1, 96, 19, 39, 50, 55, 62, 77, 85];
  // if (!baselineVideoIds) { baselineVideoIds = []; for (var i = 1; i <= 100; i++) baselineVideoIds.push(i); }
  // var videoEl = document.getElementById('baseline-video');
  // var prevBtn = document.getElementById('baseline-prev');
  // var nextBtn = document.getElementById('baseline-next');
  // var baselinePromptEl = document.getElementById('baseline-prompt');
  // var baselinePrompts = {};
  // loadCSV('./static/files/prompts/claude_prompts_new_en.csv').then(function (map) {
  //   baselinePrompts = map;
  //   updateBaselinePrompt();
  // });
  // if (!videoEl || baselineVideoIds.length === 0) return;
  // var currentIndex = 0;
  // function updateBaselinePrompt() {
  //   if (!baselinePromptEl) return;
  //   var fileId = String(baselineVideoIds[currentIndex]);
  //   baselinePromptEl.textContent = baselinePrompts[fileId] ? '[' + fileId + '] ' + baselinePrompts[fileId] : '';
  // }
  // function loadVideo(index) {
  //   currentIndex = index;
  //   videoEl.src = './static/videos/baselines/' + baselineVideoIds[currentIndex] + '.mp4'; // 480p
  //   videoEl.load();
  //   videoEl.play().catch(function () {});
  //   updateBaselinePrompt();
  // }
  // loadVideo(0);
  // if (prevBtn) { prevBtn.addEventListener('click', function () { loadVideo((currentIndex - 1 + baselineVideoIds.length) % baselineVideoIds.length); }); }
  // if (nextBtn) { nextBtn.addEventListener('click', function () { loadVideo((currentIndex + 1) % baselineVideoIds.length); }); }
  // var baselineVideoContainer = videoEl.parentElement;
  // baselineVideoContainer.addEventListener('mouseenter', function () { videoEl.pause(); });
  // baselineVideoContainer.addEventListener('mouseleave', function () { videoEl.play().catch(function () {}); });

  // ---------------------------------------------------------------------------
  // Baseline video slideshow (720p)
  // ---------------------------------------------------------------------------

  // var baseline720pVideoIds = [12, 1, 24, 15, 20, 28, 34, 36, 41, 5, 6, 13, 14, 19, 21, 30, 43]; // old
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
      baselineImgEl.src = './static/images/baselines/' + padded + '.png';
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
  }

  // ---------------------------------------------------------------------------
  // Foveation trajectory slideshow
  // ---------------------------------------------------------------------------

  // To show only specific videos, uncomment and edit the line below:
  // var fovTrajIds = [101, 105, 203, 310, 425];
  var fovTrajIds = null;
  var fovTrajIds = [153, 157, 176, 180, 184, 228, 234, 275, 388, 432, 463, 471, 125, 133, 138];
  // var fovTrajIds = [119, 162, 265, 269, 283, 294, 332, 334, 370, 385, 398, 423, 432, 463, 466, 471, 473, 485]; // mine
  // var fovTrajIds = [
  //   119, 125, 133, 138, 153, 157, 162, 176, 180, 184,
  //   228, 234, 265, 269, 275, 283, 294, 329, 332, 334, 370,
  //   385, 388, 398, 432, 463, 466, 471, 473, 485, 487
  // ]; // merged
  if (!fovTrajIds) {
    fovTrajIds = [];
    var ranges = [[101, 499]];
    ranges.forEach(function (r) { for (var n = r[0]; n <= r[1]; n++) fovTrajIds.push(n); });
  }

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
  // Saliency slideshows – commented out, replaced by combined apps slideshow below
  // ---------------------------------------------------------------------------

  // document.querySelectorAll('.saliency-slideshow').forEach(function (slideshow) { ... });
  // (old per-folder saliency slideshows: games 480p/720p, av 480p/720p, robotics 480p/720p)

  // ---------------------------------------------------------------------------
  // Mask comparison slideshow – commented out
  // ---------------------------------------------------------------------------

  // var maskVideo = document.getElementById('mask-cmp-video'); ...
  // (old mask-cmp slideshow merged games_comparison + av_comparison + robotics_comparison)

  // ---------------------------------------------------------------------------
  // Combined applications slideshow (720p: games, driving, robotics)
  // ---------------------------------------------------------------------------

  var appsPages = [
    // old games 720p ids: [1, 8, 13, 15, 23, 25, 36, 38, 56, 57, 76, 86]
    { label: 'VR Gaming',            folder: 'games_720p',    ids: [8, 15, 25],  csv: 'games_en.csv' },
    // old av 720p ids: [2, 6, 11, 12, 19, 24, 34, 40, 74, 76, 93, 94]
    { label: 'Autonomous Driving',   folder: 'av_720p',       ids: [2, 6, 11],   csv: 'av_en.csv' },
    // old robotics 720p ids: [3, 5, 7, 10, 11, 15, 24, 30, 45, 48, 65, 67, 75, 79, 86]
    { label: 'Robotics',             folder: 'robotics_720p', ids: [11, 67, 65], csv: 'robotics_en.csv' },
  ];

  var appsGrid = document.getElementById('apps-grid');

  if (appsGrid) {
    // Load all 9 videos and prompts at once
    appsPages.forEach(function (pg, catIdx) {
      // Set row label
      var rowLabel = appsGrid.querySelector('.apps-grid-row[data-category="' + catIdx + '"] .apps-row-label');
      if (rowLabel) rowLabel.textContent = pg.label;

      // Set video sources
      var videos = appsGrid.querySelectorAll('video.apps-video[data-category="' + catIdx + '"]');
      videos.forEach(function (v, i) {
        v.src = './static/videos/saliency/' + pg.folder + '/' + pg.ids[i] + '.mp4';
        v.load();
        v.play().catch(function () {});
      });

      // Load prompts
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
  // Foveation Trajectory — 2x2 image grid hover (2x + 4x) × (image + tokenization)
  // ---------------------------------------------------------------------------

  var fovTrajImgIds = ['003', '006', '011', '012', '013', 
    '000', '001', '002', '099',
  '020', '021', '023', '024'];
  var fovTrajImgN = 10;
  var fovTrajImgIndex = 0;

  var fovTrajImg2x = document.getElementById('fov-traj-img-2x');
  var fovTrajMask2x = document.getElementById('fov-traj-mask-2x');
  var fovTrajImg4x = document.getElementById('fov-traj-img-4x');
  var fovTrajMask4x = document.getElementById('fov-traj-mask-4x');
  var fovTrajGridOverlays = document.querySelectorAll('.fov-traj-grid-overlay');
  var fovTrajImgPrev = document.getElementById('fov-traj-img-prev');
  var fovTrajImgNext = document.getElementById('fov-traj-img-next');

  if (fovTrajImg2x && fovTrajMask2x) {
    function loadFovTrajGridImg(cellIdx) {
      var id = fovTrajImgIds[fovTrajImgIndex];
      var padded = String(cellIdx).padStart(4, '0');
      fovTrajImg2x.src = './static/images/fov_traj_grid_10x10_2x/random/' + id + '/img_' + padded + '.png';
      fovTrajMask2x.src = './static/images/tokenization_masks_10x10_2x/tokenization_mask_' + padded + '.png';
      if (fovTrajImg4x) fovTrajImg4x.src = './static/images/fov_traj_grid_10x10_4x/random_4x_distill/' + id + '/img_' + padded + '.png';
      if (fovTrajMask4x) fovTrajMask4x.src = './static/images/tokenization_masks_10x10_4x/tokenization_mask_' + padded + '.png';
    }

    // Hover: map mouse position to grid cell with 20% margins
    fovTrajGridOverlays.forEach(function (overlay) {
      overlay.addEventListener('mousemove', function (e) {
        var rect = overlay.getBoundingClientRect();
        var tx = (e.clientX - rect.left) / rect.width;
        var ty = (e.clientY - rect.top) / rect.height;
        var col = marginGridIndex(tx, fovTrajImgN);
        var row = marginGridIndex(ty, fovTrajImgN);
        loadFovTrajGridImg(row * fovTrajImgN + col);
      });
    });

    loadFovTrajGridImg(44); // default: center cell of 10x10

    if (fovTrajImgPrev) {
      fovTrajImgPrev.addEventListener('click', function () {
        fovTrajImgIndex = (fovTrajImgIndex - 1 + fovTrajImgIds.length) % fovTrajImgIds.length;
        loadFovTrajGridImg(44);
      });
    }
    if (fovTrajImgNext) {
      fovTrajImgNext.addEventListener('click', function () {
        fovTrajImgIndex = (fovTrajImgIndex + 1) % fovTrajImgIds.length;
        loadFovTrajGridImg(44);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Vary-radius image slider (saliency + bbox side by side) with slideshow
  // ---------------------------------------------------------------------------

  var varyRadiusIds = [];
  for (var vi = 0; vi <= 3; vi++) varyRadiusIds.push(String(vi).padStart(3, '0'));
  var varyRadiusIndex = 0;

  // varyRadiusIds = ["010", "017", "022", "027"]; // selected 

  var bboxImgEl     = document.getElementById('bbox-img');
  var saliencyImgEl = document.getElementById('saliency-img');
  var bboxMaskImgEl = document.getElementById('bbox-mask-img');
  var varySlider    = document.getElementById('bbox-slider');
  var bboxPrev      = document.getElementById('bbox-prev');
  var bboxNext      = document.getElementById('bbox-next');

  if (bboxImgEl && saliencyImgEl && bboxMaskImgEl && varySlider) {
    var varyImageCount = 0; // will be set after probing

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

    function loadVaryRadius() {
      var folders = varyRadiusFolders();
      probeImages(folders.bbox, 0, [], function (ids) {
        if (ids.length === 0) return;
        varyImageCount = ids.length;
        varySlider.min = 0;
        varySlider.max = ids.length - 1;
        varySlider.value = 0;

        function loadVaryImg(idx) {
          var padded = String(ids[idx]).padStart(4, '0');
          bboxImgEl.src     = folders.bbox     + 'img_' + padded + '.png';
          saliencyImgEl.src = folders.saliency + 'img_' + padded + '.png';
          bboxMaskImgEl.src = folders.mask + 'tokenization_mask_' + padded + '.png';
        }

        loadVaryImg(0);
        varySlider.oninput = function () {
          loadVaryImg(parseInt(this.value, 10));
        };
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

  if (teaserImg1x && teaserImg2x && teaserImg4x && teaserMask1x && teaserMask2x && teaserMask4x) {
    function loadTeaserGridImg(cellIdx) {
      var padded = String(cellIdx).padStart(4, '0');
      // 1x: single image, does not vary with cell
      teaserImg1x.src = './static/images/fov_traj_grid_10x10_1x/random/006/img_0000.png';
      teaserMask1x.src = './static/images/tokenization_masks_1x/tokenization_mask_0000.png';
      // 2x
      teaserImg2x.src = './static/images/fov_traj_grid_10x10_2x/random/006/img_' + padded + '.png';
      teaserMask2x.src = './static/images/tokenization_masks_10x10_2x/tokenization_mask_' + padded + '.png';
      // 4x
      teaserImg4x.src = './static/images/fov_traj_grid_10x10_4x/random_4x_distill/006/img_' + padded + '.png';
      teaserMask4x.src = './static/images/tokenization_masks_10x10_4x/tokenization_mask_' + padded + '.png';
    }

    // Hover: map mouse position to grid cell with 20% margins
    teaserGridOverlays.forEach(function (overlay) {
      overlay.addEventListener('mousemove', function (e) {
        var rect = overlay.getBoundingClientRect();
        var tx = (e.clientX - rect.left) / rect.width;
        var ty = (e.clientY - rect.top) / rect.height;
        var col = marginGridIndex(tx, teaserGridN);
        var row = marginGridIndex(ty, teaserGridN);
        loadTeaserGridImg(row * teaserGridN + col);
      });
    });

    // Load default image (center cell: 44 = center of 10x10)
    loadTeaserGridImg(44);
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
  
  // saliencyGridIds = ["011", "013", "017", "026", "028"]; // 5x5 selection

  var saliencyGridRandomImg = document.getElementById('saliency-grid-random-img');
  var saliencyGridSaliencyImg = document.getElementById('saliency-grid-saliency-img');
  var saliencyGridMaskImg = document.getElementById('saliency-grid-mask-img');
  var saliencyGridOverlays = document.querySelectorAll('.saliency-grid-overlay');
  var saliencyGridPrev = document.getElementById('saliency-grid-prev');
  var saliencyGridNext = document.getElementById('saliency-grid-next');

  if (saliencyGridRandomImg && saliencyGridSaliencyImg && saliencyGridMaskImg && saliencyGridOverlays.length === 3) {
    function saliencyGridBasePaths() {
      var id = saliencyGridIds[saliencyGridIndex];
      return {
        random: './static/images/vary_position_grid_10x10/random/' + id + '/',
        saliency: './static/images/vary_position_grid_10x10/saliency/' + id + '/',
        mask: './static/images/tokenization_masks_10x10_2x/'
      };
    }

    function loadSaliencyGridImg(cellIdx) {
      var paths = saliencyGridBasePaths();
      var padded = String(cellIdx).padStart(4, '0');
      saliencyGridRandomImg.src = paths.random + 'img_' + padded + '.png';
      saliencyGridSaliencyImg.src = paths.saliency + 'img_' + padded + '.png';
      saliencyGridMaskImg.src = paths.mask + 'tokenization_mask_' + padded + '.png';
    }

    // Hover: map mouse position to grid cell with 20% margins
    saliencyGridOverlays.forEach(function (overlay) {
      overlay.addEventListener('mousemove', function (e) {
        var rect = overlay.getBoundingClientRect();
        var tx = (e.clientX - rect.left) / rect.width;
        var ty = (e.clientY - rect.top) / rect.height;
        var col = marginGridIndex(tx, saliencyGridN);
        var row = marginGridIndex(ty, saliencyGridN);
        loadSaliencyGridImg(row * saliencyGridN + col);
      });
    });

    // Load default image (center cell: 12)
    loadSaliencyGridImg(12);

    // Slideshow navigation
    saliencyGridPrev.addEventListener('click', function () {
      saliencyGridIndex = (saliencyGridIndex - 1 + saliencyGridIds.length) % saliencyGridIds.length;
      loadSaliencyGridImg(12);
    });
    saliencyGridNext.addEventListener('click', function () {
      saliencyGridIndex = (saliencyGridIndex + 1) % saliencyGridIds.length;
      loadSaliencyGridImg(12);
    });
  }
});
