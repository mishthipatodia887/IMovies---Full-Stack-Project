import { useAuth } from '../context/AuthContext';

export default function Navbar({ view, setView, city, dark, setDark, onCity, onAuth, onMine, onAdmin }) {
  const { user, isAdmin, logout } = useAuth();
  return (
    <nav className="navbar navbar-expand-lg sticky-top border-bottom bg-body">
      <div className="container-fluid px-3 gap-2 flex-wrap">
        <span className="logo">I<i>Movies</i></span>
        <div className="d-flex gap-1 me-auto">
          {['movies', 'theatres', 'offers'].map(v => (
            <button key={v} className={'navlink ' + (view === v ? 'on' : '')} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>
          ))}
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={onCity}>📍 {city ? `${city.c}, ${city.s}` : 'Select city'}</button>
        <button className="btn btn-outline-secondary btn-sm" onClick={onMine}>My bookings</button>
        {isAdmin && <button className="btn btn-outline-secondary btn-sm" onClick={onAdmin}>Admin</button>}
        <button className="btn btn-outline-secondary btn-sm" onClick={user ? logout : onAuth}>{user ? `Sign out (${user.name.split(' ')[0]})` : 'Sign in'}</button>
        <button className="btn btn-outline-secondary btn-sm" aria-label="Toggle theme" onClick={() => setDark(!dark)}>🌓</button>
      </div>
    </nav>
  );
}
