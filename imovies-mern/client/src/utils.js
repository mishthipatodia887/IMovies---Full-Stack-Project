export const H = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
export const dur = m => Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm';
export const ls = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
export const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

const EMT = { 'Jawan': '🛡️', 'Pathaan': '🕵️', 'Animal': '🐺', '3 Idiots': '🎓', 'Stree 2': '👻', 'Dangal': '🤼', 'Oppenheimer': '☢️', 'Inception': '🌀', 'Interstellar': '🪐', 'The Dark Knight': '🦇', 'Avatar: The Way of Water': '🌊', 'Top Gun: Maverick': '✈️', 'Barbie': '💖', 'Inside Out 2': '🧠', 'RRR': '🔥', 'KGF: Chapter 2': '⛏️', 'Kalki 2898 AD': '🛸', 'Parasite': '🏠', 'Spirited Away': '🐉' };
const BYGENRE = [[/Horror/, '👻'], [/Sports/, '🏆'], [/Comedy/, '😂'], [/Crime/, '🕶️'], [/Sci-Fi/, '🚀'], [/Animation/, '✨'], [/Biopic/, '🎞️'], [/Adventure/, '🧭'], [/Thriller/, '🌀'], [/Action/, '💥']];
export const emo = m => EMT[m.title] || BYGENRE.find(([rx]) => rx.test(m.genre))?.[1] || '🎬';

// every movie gets its own colours derived from its title
export const posterVars = m => {
  const h = H(m.title) % 360;
  return { '--c1': `hsl(${h},68%,40%)`, '--c2': `hsl(${(h + 55) % 360},60%,20%)`, '--c3': `hsla(${(h + 160) % 360},85%,62%,.5)`, '--c4': `hsl(${(h + 160) % 360},85%,66%)` };
};

// 3D tilt handlers shared by cards and the hero poster
export const tilt = {
  onPointerMove(e) {
    if (e.pointerType !== 'mouse') return;
    const c = e.currentTarget, r = c.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.classList.add('hov');
    c.style.setProperty('--mx', x.toFixed(3)); c.style.setProperty('--my', y.toFixed(3));
    c.style.setProperty('--ry', ((x - .5) * 14).toFixed(2)); c.style.setProperty('--rx', ((.5 - y) * 14).toFixed(2));
  },
  onPointerLeave(e) {
    const c = e.currentTarget;
    c.classList.remove('hov');
    ['--rx', '--ry', '--mx', '--my'].forEach(p => c.style.removeProperty(p));
  },
};

export function QR({ id }) {
  let h = H(id); const cells = [];
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const finder = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
    if (finder || (h >> 16) % 2) cells.push([x, y]);
  }
  return <svg viewBox="0 0 11 11" className="qr">{cells.map(([x, y]) => <rect key={x + '-' + y} x={x} y={y} width="1" height="1" />)}</svg>;
}
