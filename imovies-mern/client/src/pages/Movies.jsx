import { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { api } from '../api';
import Hero from '../components/Hero';
import MovieCard from '../components/MovieCard';

const IND = ['All', 'Bollywood', 'Hollywood', 'South Indian', 'International', '❤ Saved'];

export default function Movies({ city, favs, onFav, onOpen, refreshKey, say }) {
  const [all, setAll] = useState([]);          // every movie (hero, rail, language list)
  const [grid, setGrid] = useState([]);        // filtered movies
  const [f, setF] = useState({ q: '', industry: 'All', language: 'All', sort: 'pop' });

  useEffect(() => { api('/movies?sort=rating').then(setAll).catch(e => say(e.message)); }, [refreshKey]);

  useEffect(() => {
    const params = new URLSearchParams({ q: f.q, language: f.language, sort: f.sort, industry: f.industry === '❤ Saved' ? 'All' : f.industry });
    const t = setTimeout(() => api('/movies?' + params).then(setGrid).catch(e => say(e.message)), 200);   // debounce typing
    return () => clearTimeout(t);
  }, [f, refreshKey]);

  const shown = f.industry === '❤ Saved' ? grid.filter(m => favs.includes(m._id)) : grid;
  const langs = ['All', ...new Set(all.map(m => m.language))];
  const card = (m, i) => <MovieCard key={m._id} m={m} i={i} fav={favs.includes(m._id)} onFav={onFav} onOpen={onOpen} />;

  return (
    <>
      <Hero movies={all} onOpen={onOpen} />
      <div className="container">
        <h2 className="sec">Recommended movies</h2>
        <div className="rail">{all.slice(0, 8).map(card)}</div>
        <h2 className="sec">All movies</h2>
        <div className="d-flex flex-wrap gap-2 mb-2">
          <Form.Control className="flex-grow-1" style={{ minWidth: 180, flexBasis: 200 }} placeholder="Search movies, genres…" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
          <Form.Select style={{ width: 'auto' }} value={f.language} onChange={e => setF({ ...f, language: e.target.value })}>{langs.map(l => <option key={l} value={l}>{l === 'All' ? 'All languages' : l}</option>)}</Form.Select>
          <Form.Select style={{ width: 'auto' }} value={f.sort} onChange={e => setF({ ...f, sort: e.target.value })}>
            <option value="pop">Popular</option><option value="rating">Top rated</option><option value="name">A–Z</option><option value="dur">Shortest</option></Form.Select>
        </div>
        <div className="chips">{IND.map(g => <button key={g} className={'chip ' + (g === f.industry ? 'on' : '')} onClick={() => setF({ ...f, industry: g })}>{g}</button>)}</div>
        <p className="text-secondary mt-2">{shown.length} movie{shown.length === 1 ? '' : 's'} now showing{city ? ' in ' + city.c : ''}</p>
        <main id="grid">{shown.length ? shown.map(card) : <p className="text-secondary">No movies match your filters.</p>}</main>
      </div>
    </>
  );
}
