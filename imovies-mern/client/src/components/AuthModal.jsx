import { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose, onDone }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setError('');
    try { const u = await (mode === 'login' ? login : register)(name, password); onDone(u); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title>{mode === 'login' ? 'Welcome back' : 'Create account'}</Modal.Title></Modal.Header>
      <Form onSubmit={submit}>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}
          <Form.Control className="mb-2" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} autoFocus />
          <Form.Control type="password" placeholder="Password (min 6 characters)" value={password} onChange={e => setPassword(e.target.value)} />
          <Button variant="link" className="p-0 mt-2" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          </Button>
        </Modal.Body>
        <Modal.Footer><Button variant="danger" type="submit" className="w-100" disabled={busy}>{busy ? 'Please wait…' : 'Continue'}</Button></Modal.Footer>
      </Form>
    </Modal>
  );
}
