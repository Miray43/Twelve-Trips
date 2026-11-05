import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Nav() {
  const { email, logout } = useAuth();
  return (
    <header className="nav">
      <Link to="/" className="brand">Twelve Trips</Link>
      <nav aria-label="Main">
        <NavLink to="/past-trips">Past trips</NavLink>
        <NavLink to="/trips/japan">Next trip</NavLink>
        {email ? <button className="linklike" onClick={logout}>Log out</button> : <NavLink to="/login">Log in</NavLink>}
      </nav>
    </header>
  );
}
