import { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { api } from '../api';

export default function CityModal({ current, onSave, onClose }) {
  const [loc, setLoc] = useState({});
  const [s, setS] = useState(current?.s || '');
  const [c, setC] = useState(current?.c || '');

  useEffect(() => {
    api('/locations').then(d => { setLoc(d); const st = current?.s || Object.keys(d)[0]; setS(st); setC(current?.c || d[st][0]); });
  }, []);

  const pickState = st => { setS(st); setC(loc[st][0]); };
  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title>Choose your city</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="text-secondary">Theatres and showtimes depend on your location.</p>
        <Form.Select className="mb-2" value={s} onChange={e => pickState(e.target.value)}>{Object.keys(loc).map(k => <option key={k}>{k}</option>)}</Form.Select>
        <Form.Select value={c} onChange={e => setC(e.target.value)}>{(loc[s] || []).map(x => <option key={x}>{x}</option>)}</Form.Select>
      </Modal.Body>
      <Modal.Footer><Button variant="danger" className="w-100" disabled={!c} onClick={() => onSave({ s, c })}>Confirm</Button></Modal.Footer>
    </Modal>
  );
}
