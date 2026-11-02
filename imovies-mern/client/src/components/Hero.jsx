import { useEffect, useState } from 'react';
import Poster from './Poster';
import { dur, tilt } from '../utils';

export default function Hero({ movies, onOpen }) {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(x => x + 1), 5000); return () => clearInterval(t); }, []);
  const top = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const m = top[i % (top.length || 1)];
  if (!m) return null;
  return (
    <section className="hero container">
      <div className="d-flex flex-column gap-2">
        <span>Featured · {m.industry}</span>
        <h1>{m.title}</h1>
        <p className="m-0">{m.genre} · {m.language} · {dur(m.duration)} · ★ {m.rating.toFixed(1)}</p>
        <button className="btn btn-light align-self-start mt-2 fw-semibold" onClick={() => onOpen(m)}>Book tickets</button>
      </div>
      <div className="hp" {...tilt}><Poster m={m} /></div>
    </section>
  );
}
