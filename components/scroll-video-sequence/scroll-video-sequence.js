/**
 * ScrollVideoSequence
 * Renders a sequence of frame images onto a <canvas>, mapping the scroll
 * progress of a tall pinned (position: sticky) section to a frame index —
 * i.e. a "video" that plays forward/backward as the user scrolls.
 *
 * Requires GSAP + ScrollTrigger to already be loaded on the page (CDN):
 *   <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
 *
 * Usage:
 *   <section class="svs-section" id="introVideo">
 *     <div class="svs-sticky">
 *       <canvas class="svs-canvas"></canvas>
 *       <div class="svs-overlay"></div>
 *       <div class="svs-loader">
 *         <div class="svs-loader-bar"><div class="svs-loader-fill"></div></div>
 *         <span class="svs-loader-text">0%</span>
 *       </div>
 *     </div>
 *   </section>
 *
 *   new ScrollVideoSequence({
 *     section: '#introVideo',
 *     manifestUrl: 'assets/videos/intro/manifest.json',
 *   });
 */
export class ScrollVideoSequence {
  constructor(options) {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      throw new Error(
        'ScrollVideoSequence requires GSAP + ScrollTrigger to be loaded before this script runs.'
      );
    }

    const section =
      typeof options.section === 'string' ? document.querySelector(options.section) : options.section;
    if (!section) throw new Error('ScrollVideoSequence: `section` element not found.');

    this.section = section;
    this.sticky = section.querySelector('.svs-sticky');
    this.canvas = section.querySelector('.svs-canvas');
    this.loader = section.querySelector('.svs-loader');
    this.loaderFill = section.querySelector('.svs-loader-fill');
    this.loaderText = section.querySelector('.svs-loader-text');
    this.ctx = this.canvas.getContext('2d');

    this.manifestUrl = options.manifestUrl ?? null;
    this.basePath = options.basePath ?? '';
    this.frameCount = options.frameCount ?? 0;
    // Fallback frame-name resolver when no manifest is supplied: (index) => filename
    this.framePattern =
      options.framePattern ?? ((i) => `frame_${String(i + 1).padStart(4, '0')}.webp`);

    this.concurrency = options.concurrency ?? 8;
    this.scrub = options.scrub ?? 0.35;
    this.objectFit = options.objectFit ?? 'cover'; // 'cover' | 'contain'
    this.dprCap = options.dprCap ?? 2;
    this.onProgress = options.onProgress ?? null;

    this.images = [];
    this.currentIndex = 0;
    this.lastDrawnIndex = -1;
    this.scrollTrigger = null;
    this._resizeObserver = null;

    // Exposed so callers can reliably act on internal state (scrollTrigger,
    // frameCount) that only exists once the async setup below has run — see
    // freeze()'s usage in js/intro-section.js for why this matters: without
    // it, a caller invoking freeze() before frames finish loading would
    // silently no-op instead of actually freezing anything.
    this.ready = this._init();
  }

  async _init() {
    const { basePath, files } = await this._resolveFrameList();
    this.basePath = basePath;
    this.urls = files.map((name) => basePath + name);
    this.frameCount = this.urls.length;
    this.images = new Array(this.frameCount).fill(null);

    this._setupResize();
    this._preload();
    this._setupScrollTrigger();
  }

  async _resolveFrameList() {
    if (this.manifestUrl) {
      const res = await fetch(this.manifestUrl);
      if (!res.ok) throw new Error(`ScrollVideoSequence: failed to load manifest ${this.manifestUrl}`);
      const manifest = await res.json();
      // Resolve frame paths relative to where the manifest itself lives (not
      // the manifest's own `basePath` field, which is repo-root relative and
      // would break if this page isn't served from the repo root).
      const basePath = new URL('.', new URL(this.manifestUrl, document.baseURI)).href;
      return { basePath, files: manifest.files };
    }
    if (!this.frameCount) {
      throw new Error('ScrollVideoSequence: provide either `manifestUrl` or `frameCount` + `basePath`.');
    }
    const files = Array.from({ length: this.frameCount }, (_, i) => this.framePattern(i));
    return { basePath: this.basePath, files };
  }

  _loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async _preload() {
    let loaded = 0;
    const total = this.urls.length;
    const updateLoader = () => {
      const pct = Math.round((loaded / total) * 100);
      if (this.loaderFill) this.loaderFill.style.width = `${pct}%`;
      if (this.loaderText) this.loaderText.textContent = `${pct}%`;
    };

    // Load frame 0 first so there's something on screen immediately.
    this.images[0] = await this._loadImage(this.urls[0]);
    loaded = 1;
    updateLoader();
    this._draw(0);

    let nextIndex = 1;
    const worker = async () => {
      while (nextIndex < total) {
        const i = nextIndex++;
        this.images[i] = await this._loadImage(this.urls[i]);
        loaded++;
        updateLoader();
        // If the frame currently requested is the one that just arrived, paint it.
        if (i === this.currentIndex) this._draw(i);
      }
    };

    const workers = Array.from({ length: Math.min(this.concurrency, total) }, worker);
    await Promise.all(workers);

    if (this.loader) {
      this.loader.classList.add('is-hidden');
      this.loader.addEventListener('transitionend', () => this.loader.remove(), { once: true });
    }
  }

  _setupScrollTrigger() {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.section,
      start: 'top top',
      end: 'bottom bottom',
      scrub: this.scrub,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const idx = Math.min(this.frameCount - 1, Math.floor(self.progress * this.frameCount));
        if (idx !== this.currentIndex) {
          this.currentIndex = idx;
          this._draw(idx);
        }
        if (this.onProgress) this.onProgress(self.progress, idx);
      },
    });
  }

  // Draws the requested frame if it's loaded; otherwise falls back to the
  // nearest already-loaded frame so the canvas never goes blank, and keeps
  // the pending index so a later _draw() call (once it finishes loading)
  // still lands.
  _draw(index) {
    let img = this.images[index];
    if (!img) {
      img = this._nearestLoaded(index);
      if (!img) return;
    } else if (index === this.lastDrawnIndex) {
      return;
    }
    this.lastDrawnIndex = index;
    this._paint(img);
  }

  _nearestLoaded(index) {
    for (let d = 1; d < this.frameCount; d++) {
      if (this.images[index - d]) return this.images[index - d];
      if (this.images[index + d]) return this.images[index + d];
    }
    return null;
  }

  _paint(img) {
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, cw, ch);

    const ir = img.width / img.height;
    const cr = cw / ch;
    let sx, sy, sw, sh;

    if (this.objectFit === 'contain') {
      let dw, dh;
      if (ir > cr) {
        dw = cw;
        dh = cw / ir;
      } else {
        dh = ch;
        dw = ch * ir;
      }
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.drawImage(img, 0, 0, img.width, img.height, dx, dy, dw, dh);
      return;
    }

    // cover (default)
    if (ir > cr) {
      sh = img.height;
      sw = sh * cr;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / cr;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  _setupResize() {
    const resize = () => {
      const rect = this.sticky.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, this.dprCap);
      this.canvas.width = Math.round(rect.width * dpr);
      this.canvas.height = Math.round(rect.height * dpr);
      // Resizing the canvas wipes 2D context state (imageSmoothingQuality
      // defaults back to 'low' in Chrome), so it has to be reapplied here,
      // every time — this is what keeps upscaled frames from looking blocky.
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
      const current = this.images[this.currentIndex] ?? this.images[0];
      if (current) this._paint(current);
    };
    resize();
    this._resizeObserver = new ResizeObserver(resize);
    this._resizeObserver.observe(this.sticky);
  }

  // Permanently stops this sequence from responding to scroll and snaps it
  // to its last frame — used for a "one-shot" video that should play once
  // and then stay put, instead of re-scrubbing every time the section
  // scrolls back into view. Unlike destroy(), the resize observer is left
  // running, so the frozen last frame still re-fits correctly if the
  // viewport is resized (e.g. a phone rotating) afterward.
  freeze() {
    this.scrollTrigger?.kill();
    this.scrollTrigger = null;
    this._draw(this.frameCount - 1);
  }

  destroy() {
    this._resizeObserver?.disconnect();
    this.scrollTrigger?.kill();
  }
}
