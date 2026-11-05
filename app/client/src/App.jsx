import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Home from './pages/Home.jsx';
import PastTrips from './pages/PastTrips.jsx';
import Trip from './pages/Trip.jsx';
import Booking from './pages/Booking.jsx';
import Confirmed from './pages/Confirmed.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './auth.jsx';

function Private({ children }) {
  const { email } = useAuth();
  const loc = useLocation();
  return email ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/past-trips" element={<PastTrips />} />
          <Route path="/trips/:slug" element={<Trip />} />
          <Route path="/book/:slug" element={<Private><Booking /></Private>} />
          <Route path="/confirmed/:reference" element={<Private><Confirmed /></Private>} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<section className="page narrow"><h1>Page not found</h1></section>} />
        </Routes>
      </main>
      <footer className="footer"><strong>Twelve Trips</strong><span>Concept project by Mira Alharbi. Not a real travel company; no payments are taken.</span></footer>
    </>
  );
}
