// Midnight Vault — input: keyboard and mouse, nothing else.
// Keys are read as a held set; edge presses (smoke, EMP, start, restart)
// are consumed once by the game loop through pressed().

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.queue = [];
    this.click = null;
    this.canvas = canvas;
    this.onKey = (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
      }
      if (!e.repeat) this.queue.push(k);
      this.keys.add(k);
    };
    this.onKeyUp = (e) => this.keys.delete(e.key.toLowerCase());
    this.onClick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width / rect.width;
      const sy = this.canvas.height / rect.height;
      this.click = {
        x: (e.clientX - rect.left) * sx,
        y: (e.clientY - rect.top) * sy,
      };
    };
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('pointerdown', this.onClick);
  }

  get up() {
    return this.keys.has('w') || this.keys.has('arrowup');
  }
  get down() {
    return this.keys.has('s') || this.keys.has('arrowdown');
  }
  get left() {
    return this.keys.has('a') || this.keys.has('arrowleft');
  }
  get right() {
    return this.keys.has('d') || this.keys.has('arrowright');
  }

  // True once for each physical press since the last frame.
  pressed(key) {
    const i = this.queue.indexOf(key);
    if (i === -1) return false;
    this.queue.splice(i, 1);
    return true;
  }

  takeClick() {
    const c = this.click;
    this.click = null;
    return c;
  }

  endFrame() {
    this.queue.length = 0;
  }
}
