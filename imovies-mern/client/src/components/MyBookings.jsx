import { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { api } from '../api';

export default function MyBookings({ onClose, say }) {
  const [list, setList] = useState(null);
  const load = () => api('/bookings/mine').then(setList).catch(e => { say(e.message); setList([]); });
  useEffect(() => { load(); }, []);

  const cancel = async id => {
    try { await api('/bookings/' + id, { method: 'DELETE' }); say('Booking cancelled, seats released'); load(); }
    catch (e) { say(e.message); }
  };

  return (
    <Modal show onHide={onClose} centered scrollable>
      <Modal.Header closeButton><Modal.Title>My bookings</Modal.Title></Modal.Header>
      <Modal.Body>
        {list === null ? <p className="text-secondary">Loading…</p> : !list.length ? <p className="text-secondary">No bookings yet. Pick a movie to get started.</p> :
          list.map(b => (
            <div className="bk" key={b._id}>
              <div><b>{b.movieTitle}</b> <span className="text-secondary">· {b.ref}</span><br />
                <span className="text-secondary">{b.theatre} · {b.date} · {b.time}<br />Seats {b.seats.join(', ')} · ₹{b.total}</span></div>
              <Button size="sm" variant="outline-secondary" onClick={() => cancel(b._id)}>Cancel</Button>
            </div>
          ))}
      </Modal.Body>
    </Modal>
  );
}
