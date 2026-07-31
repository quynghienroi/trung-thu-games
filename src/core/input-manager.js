/**
 * 🕹️ Input Manager
 * Xử lý touch, mouse, keyboard cho tất cả thiết bị
 */
export class InputManager {
  constructor(element) {
    this.element = element;
    this.pointerX = 0;
    this.pointerY = 0;
    this.isPointerDown = false;
    this.justTapped = false;
    this.keys = {};
    this._tapCallbacks = [];
    this._moveCallbacks = [];
    this._listeners = [];

    this._init();
  }

  _init() {
    const el = this.element;

    // Touch
    this._on(el, 'touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = el.getBoundingClientRect();
      this.pointerX = t.clientX - rect.left;
      this.pointerY = t.clientY - rect.top;
      this.isPointerDown = true;
      this.justTapped = true;
      this._notifyTap(this.pointerX, this.pointerY);
    }, { passive: false });

    this._on(el, 'touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = el.getBoundingClientRect();
      this.pointerX = t.clientX - rect.left;
      this.pointerY = t.clientY - rect.top;
      this._notifyMove(this.pointerX, this.pointerY);
    }, { passive: false });

    this._on(el, 'touchend', () => {
      this.isPointerDown = false;
    });

    // Mouse
    this._on(el, 'mousedown', (e) => {
      const rect = el.getBoundingClientRect();
      this.pointerX = e.clientX - rect.left;
      this.pointerY = e.clientY - rect.top;
      this.isPointerDown = true;
      this.justTapped = true;
      this._notifyTap(this.pointerX, this.pointerY);
    });

    this._on(el, 'mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      this.pointerX = e.clientX - rect.left;
      this.pointerY = e.clientY - rect.top;
      if (this.isPointerDown) {
        this._notifyMove(this.pointerX, this.pointerY);
      }
    });

    this._on(el, 'mouseup', () => {
      this.isPointerDown = false;
    });

    // Keyboard
    this._on(window, 'keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        this.justTapped = true;
        this._notifyTap(this.pointerX, this.pointerY);
      }
    });

    this._on(window, 'keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  _on(el, event, handler, options) {
    el.addEventListener(event, handler, options);
    this._listeners.push({ el, event, handler, options });
  }

  onTap(callback) {
    this._tapCallbacks.push(callback);
  }

  onMove(callback) {
    this._moveCallbacks.push(callback);
  }

  _notifyTap(x, y) {
    this._tapCallbacks.forEach(cb => cb(x, y));
  }

  _notifyMove(x, y) {
    this._moveCallbacks.forEach(cb => cb(x, y));
  }

  /** Call at end of each frame to reset one-shot flags */
  resetFrame() {
    this.justTapped = false;
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  destroy() {
    this._listeners.forEach(({ el, event, handler, options }) => {
      el.removeEventListener(event, handler, options);
    });
    this._listeners = [];
    this._tapCallbacks = [];
    this._moveCallbacks = [];
  }
}
