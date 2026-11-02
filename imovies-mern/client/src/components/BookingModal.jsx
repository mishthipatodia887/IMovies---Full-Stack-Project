import { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { dur, QR } from '../utils';

const days = [...Array(7)].map((_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  return { k: d.toISOString().slice(0, 10), l: i ? d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }) : 'Today' };
});
const ROWS = 'ABCDEFG'.split('');
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function BookingModal({ movie, city, config, onClose, onAuth, say }) {
  const { user } = useAuth();
  const [date, setDate] = useState(days[0].k);
  const [list, setList] = useState([]);
  const [sel, setSel] = useState(null);          // { theatre, price, time }
  const [taken, setTaken] = useState([]);
  const [seats, setSeats] = useState([]);
  const [sn, setSn] = useState([0, 0, 0]);
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState('');
  const [step, setStep] = useState('select');    // select -> pay -> done
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState(null);

  // showtimes for the chosen date
  useEffect(() => {
    setSel(null); setSeats([]);
    api(`/shows?movie=${movie._id}&city=${encodeURIComponent(city.c)}&date=${date}`).then(setList).catch(e => say(e.message));
  }, [date]);

  // seat map for the chosen show
  const loadSeats = () => api('/seats?' + new URLSearchParams({ movie: movie._id, city: city.c, theatre: sel.theatre, date, time: sel.time })).then(r => setTaken(r.taken));
  useEffect(() => { if (sel) { setSeats([]); loadSeats().catch(e => say(e.message)); } }, [sel]);

  const price = r => sel.price + ('AB'.includes(r) ? 70 : 0);
  const q = useMemo(() => {
    const tickets = sel ? seats.reduce((a, s) => a + price(s[0]), 0) : 0;
    const snacks = config.snacks.reduce((a, x, i) => a + x.price * sn[i], 0);
    const fee = 25 * seats.length;
    const c = config.coupons[coupon];
    const discount = c && seats.length ? (c.pct ? Math.round(tickets * c.pct / 100) : Math.min(c.flat, tickets)) : 0;
    return { tickets, snacks, fee, discount, total: tickets + snacks + fee - discount };
  }, [seats, sn, coupon, sel]);

  const toggle = s => setSeats(a => a.includes(s) ? a.filter(x => x !== s) : a.length < 8 ? [...a, s] : (say('You can book up to 8 seats'), a));
  const applyCoupon = () => { const v = code.trim().toUpperCase(); if (config.coupons[v]) { setCoupon(v); say('Coupon applied'); } else { setCoupon(''); say('Invalid coupon'); } };
  const proceed = () => (user ? setStep('pay') : onAuth());

  const confirm = async () => {
    setBusy(true);
    try {
      await new Promise(r => setTimeout(r, 900));      // simulated payment gateway
      const b = await api('/bookings', { method: 'POST', body: { movieId: movie._id, city: city.c, ...sel, theatre: sel.theatre, date, seats, snacks: sn, coupon } });
      setTicket(b); setStep('done');
    } catch (e) { say(e.message); setStep('select'); loadSeats().catch(() => {}); setSeats([]); }
    finally { setBusy(false); }
  };

  return (
    <Modal show onHide={onClose} centered scrollable size="lg">
      <Modal.Header closeButton><Modal.Title>{movie.title}</Modal.Title></Modal.Header>
      <Modal.Body>
        {step === 'done' && ticket && (
          <>
            <h4>Booking confirmed 🎉</h4>
            <div className="ticket"><big>{ticket.ref}</big>
              <p className="mt-2 mb-0"><b>{ticket.movieTitle}</b><br />{ticket.theatre}<br />{ticket.date} · {ticket.time}<br />Seats: {ticket.seats.join(', ')} · Paid ₹{ticket.total}</p>
              <QR id={ticket.ref} /></div>
            <Button variant="danger" className="w-100" onClick={onClose}>Done</Button>
          </>
        )}

        {step === 'pay' && (
          <>
            <h5>Payment</h5><p className="text-secondary">Demo checkout – no real money is charged.</p>
            {['UPI', 'Credit / Debit card', 'Net banking'].map((m, i) => <Form.Check key={m} type="radio" name="pm" label={m} defaultChecked={!i} className="pay" />)}
            <Button variant="danger" className="w-100 mt-3" disabled={busy} onClick={confirm}>{busy ? 'Processing…' : `Pay ₹${q.total}`}</Button>
            <Button variant="link" className="w-100" onClick={() => setStep('select')}>Back</Button>
          </>
        )}

        {step === 'select' && (
          <>
            <p className="text-secondary">{movie.industry} · {movie.genre} · {movie.language} · {dur(movie.duration)} · {movie.certificate} · ★ {movie.rating.toFixed(1)}</p>
            <h6 className="sub">Date</h6>
            <div className="chips">{days.map(d => <button key={d.k} className={'chip ' + (d.k === date ? 'on' : '')} onClick={() => setDate(d.k)}>{d.l}</button>)}</div>

            <h6 className="sub">Theatres in {city.c}</h6>
            {list.length > 0 && !list[0].real && <p className="text-secondary small">Sample theatre listing for this city.</p>}
            <div className="legend" style={{ justifyContent: 'flex-start' }}><span><i className="dot g" />Available</span><span><i className="dot a" />Filling fast</span><span><i className="dot r" />Almost full</span></div>
            {list.map(t => (
              <div className="thbox" key={t.name}><b>{t.name}</b> <span className="text-secondary">· from ₹{t.price}</span><span className="tag">Cancellation available</span>
                <div className="chips mt-2">{t.shows.map(s => (
                  <button key={s.time} className={`chip pill ${s.status} ${sel?.theatre === t.name && sel?.time === s.time ? 'on' : ''}`} onClick={() => setSel({ theatre: t.name, price: t.price, time: s.time })}>{s.time}</button>
                ))}</div>
              </div>
            ))}

            {sel ? (
              <>
                <h6 className="sub">Select seats</h6>
                <div className="screen">SCREEN</div>
                {ROWS.map(r => (
                  <div className="srow" key={r}><em>{r}</em>{COLS.map(n => {
                    const id = r + n;
                    return <button key={id} className={`seat ${seats.includes(id) ? 'sel' : ''} ${n === 5 ? 'gap' : ''}`} disabled={taken.includes(id)} title={`${id} · ₹${price(r)}`} onClick={() => toggle(id)} />;
                  })}</div>
                ))}
                <div className="legend"><span><i style={{ background: 'var(--seat)' }} />Free</span><span><i style={{ background: 'var(--accent)' }} />Yours</span><span><i style={{ background: 'var(--taken)' }} />Taken</span></div>
                <p className="text-secondary text-center small mb-0">Rows A–B premium (+₹70) · max 8 seats</p>

                <h6 className="sub">Snacks</h6>
                {config.snacks.map((x, i) => (
                  <div className="sn" key={x.name}><span>{x.name} · ₹{x.price}</span>
                    <div><button onClick={() => setSn(a => a.map((v, j) => j === i ? Math.max(0, v - 1) : v))}>−</button><span>{sn[i]}</span><button onClick={() => setSn(a => a.map((v, j) => j === i ? Math.min(10, v + 1) : v))}>+</button></div></div>
                ))}

                <h6 className="sub">Offers</h6>
                <div className="d-flex gap-2"><Form.Control placeholder="Try IMOVIES10 or FIRST50" value={code} onChange={e => setCode(e.target.value)} /><Button variant="outline-secondary" onClick={applyCoupon}>Apply</Button></div>

                <div className="sum">
                  <div><span>Tickets ({seats.length})</span><span>₹{q.tickets}</span></div>
                  <div><span>Snacks</span><span>₹{q.snacks}</span></div>
                  <div><span>Convenience fee</span><span>₹{q.fee}</span></div>
                  {q.discount > 0 && <div style={{ color: 'var(--accent)' }}><span>Discount ({coupon})</span><span>−₹{q.discount}</span></div>}
                </div>
                <div className="foot"><div><span className="text-secondary">{seats.length ? seats.join(', ') : 'No seats selected'}</span><br /><b>₹{q.total}</b></div>
                  <Button variant="danger" disabled={!seats.length} onClick={proceed}>Proceed to pay</Button></div>
              </>
            ) : <p className="text-secondary mt-3">Choose a theatre and showtime to see the seat map.</p>}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
