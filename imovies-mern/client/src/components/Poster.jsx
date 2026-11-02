import { dur, emo, posterVars } from '../utils';

export default function Poster({ m }) {
  return (
    <div className="poster" style={posterVars(m)}>
      <div className="pbg" />
      <span className="pe">{emo(m)}</span>
      <div className="pa"><small>{m.industry.toUpperCase()}</small><strong>{m.title}</strong><em>{m.genre} · {m.language}</em></div>
      {m.poster && <img src={m.poster} alt="" onLoad={e => e.target.classList.add('ld')} onError={e => e.target.remove()} />}
      <div className="pq">
        <span className="pmeta">{m.genre} · {m.language}</span>
        <strong>{m.title}</strong>
        <span className="pmeta">⏱ {dur(m.duration)} · {m.certificate}</span>
        <div className="prt">★ {m.rating.toFixed(1)}<span className="prt-b"><span style={{ '--w': m.rating * 10 + '%' }} /></span></div>
        <span className="pcta">🎟 Book tickets</span>
      </div>
      <b>★ {m.rating.toFixed(1)}</b><u>{m.certificate}</u>
    </div>
  );
}
