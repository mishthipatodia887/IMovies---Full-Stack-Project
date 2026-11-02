import Poster from './Poster';
import { dur, tilt } from '../utils';

export default function MovieCard({ m, i = 0, fav, onFav, onOpen }) {
  return (
    <article className="mcard" tabIndex={0} role="button" aria-label={m.title} style={{ animationDelay: i * 35 + 'ms' }}
      onClick={() => onOpen(m)} onKeyDown={e => e.key === 'Enter' && onOpen(m)} {...tilt}>
      <button className={'heart ' + (fav ? 'on' : '')} aria-label="Save" onClick={e => { e.stopPropagation(); onFav(m._id); }}>♥</button>
      <Poster m={m} />
      <div className="info"><h3>{m.title}</h3><p>{m.genre} · {m.language} · {dur(m.duration)}</p></div>
    </article>
  );
}
