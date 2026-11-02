import { useEffect, useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { api } from '../api';

const IND = ['Bollywood', 'Hollywood', 'South Indian', 'International'];

export default function AdminPanel({ onClose, onChanged, say }) {
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [f, setF] = useState({ title: '', industry: IND[0], language: '', genre: '', duration: '', poster: '' });
  const set = k => e => setF({ ...f, [k]: e.target.value });

  const load = async () => {
    const [s, m] = await Promise.all([api('/bookings/stats'), api('/movies')]);   // parallel requests
    setStats(s); setMovies(m);
  };
  useEffect(() => { load().catch(e => say(e.message)); }, []);

  const add = async () => {
    if (!f.title.trim()) return say('Enter a title');
    try { await api('/movies', { method: 'POST', body: f }); say('Movie added'); setF({ ...f, title: '', genre: '', language: '', duration: '', poster: '' }); await load(); onChanged(); }
    catch (e) { say(e.message); }
  };
  const del = async id => { try { await api('/movies/' + id, { method: 'DELETE' }); await load(); onChanged(); } catch (e) { say(e.message); } };

  return (
    <Modal show onHide={onClose} centered scrollable>
      <Modal.Header closeButton><Modal.Title>Admin panel</Modal.Title></Modal.Header>
      <Modal.Body>
        {stats && <div className="stats"><div><b>{stats.bookings}</b>Bookings</div><div><b>₹{stats.revenue}</b>Revenue</div><div><b>{stats.movies}</b>Movies</div></div>}
        <h6 className="mt-4 text-uppercase text-secondary small">Add a movie</h6>
        <Form.Control className="mb-2" placeholder="Title" value={f.title} onChange={set('title')} />
        <Row className="g-2">
          <Col xs={6}><Form.Select value={f.industry} onChange={set('industry')}>{IND.map(i => <option key={i}>{i}</option>)}</Form.Select></Col>
          <Col xs={6}><Form.Control placeholder="Language" value={f.language} onChange={set('language')} /></Col>
          <Col xs={6}><Form.Control placeholder="Genre" value={f.genre} onChange={set('genre')} /></Col>
          <Col xs={6}><Form.Control type="number" placeholder="Minutes" value={f.duration} onChange={set('duration')} /></Col>
          <Col xs={12}><Form.Control placeholder="Poster image URL (optional)" value={f.poster} onChange={set('poster')} /></Col>
        </Row>
        <Button variant="danger" className="w-100 mt-3" onClick={add}>Add movie</Button>
        <h6 className="mt-4 text-uppercase text-secondary small">All movies</h6>
        {movies.map(m => <div className="bk" key={m._id}><span>{m.title}</span><Button size="sm" variant="outline-secondary" onClick={() => del(m._id)}>Delete</Button></div>)}
      </Modal.Body>
    </Modal>
  );
}
