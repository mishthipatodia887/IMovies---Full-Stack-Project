import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { ls, save } from './utils';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import CityModal from './components/CityModal';
import AuthModal from './components/AuthModal';
import BookingModal from './components/BookingModal';
import MyBookings from './components/MyBookings';
import AdminPanel from './components/AdminPanel';
import Movies from './pages/Movies';
import Theatres from './pages/Theatres';
import Offers from './pages/Offers';

export default function App() {
  const { user } = useAuth();
  const [view, setView] = useState('movies');
  const [city, setCity] = useState(() => ls('im_city', null));
  const [favs, setFavs] = useState(() => ls('im_favs', []));
  const [dark, setDark] = useState(() => ls('im_dark', matchMedia('(prefers-color-scheme: dark)').matches));
  const [modal, setModal] = useState(null);          // 'city' | 'auth' | 'mine' | 'admin'
  const [book, setBook] = useState(null);
  const [config, setConfig] = useState(null);
  const [toast, setToast] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const say = useCallback(m => { setToast(m); setTimeout(() => setToast(''), 2300); }, []);

  useEffect(() => { document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light'); save('im_dark', dark); }, [dark]);
  useEffect(() => { api('/config').then(setConfig).catch(e => say(e.message)); }, []);
  useEffect(() => { if (!city) { const t = setTimeout(() => setModal('city'), 600); return () => clearTimeout(t); } }, []);

  const toggleFav = id => setFavs(f => { const n = f.includes(id) ? f.filter(x => x !== id) : [...f, id]; save('im_favs', n); return n; });
  const open = m => (city ? setBook(m) : setModal('city'));
  const saveCity = c => { setCity(c); save('im_city', c); setModal(null); say('Showing theatres in ' + c.c); };
  const needAuth = () => setModal('auth');

  return (
    <>
      <Navbar view={view} setView={setView} city={city} dark={dark} setDark={setDark}
        onCity={() => setModal('city')} onAuth={needAuth} onMine={() => (user ? setModal('mine') : needAuth())} onAdmin={() => setModal('admin')} />

      {view === 'movies' && <Movies city={city} favs={favs} onFav={toggleFav} onOpen={open} refreshKey={refreshKey} say={say} />}
      {view === 'theatres' && <Theatres city={city} onCity={() => setModal('city')} say={say} />}
      {view === 'offers' && config && <Offers config={config} />}
      <footer className="text-center text-secondary py-4 mt-4 border-top small">IMovies · Theatre lists outside the major metros are sample data</footer>

      {modal === 'city' && <CityModal current={city} onSave={saveCity} onClose={() => setModal(null)} />}
      {modal === 'auth' && <AuthModal onClose={() => setModal(null)} onDone={u => { setModal(null); say('Welcome, ' + u.name.split(' ')[0] + '!'); }} />}
      {modal === 'mine' && <MyBookings onClose={() => setModal(null)} say={say} />}
      {modal === 'admin' && <AdminPanel onClose={() => setModal(null)} onChanged={() => setRefreshKey(k => k + 1)} say={say} />}
      {book && config && city && <BookingModal movie={book} city={city} config={config} onClose={() => setBook(null)} onAuth={needAuth} say={say} />}
      <div id="toast" className={toast ? 'show' : ''}>{toast}</div>
    </>
  );
}
