import { Link } from 'react-router-dom';
import { useFetch, Status } from '../components/useFetch.jsx';
import { monthLabel } from '../validate.js';

export default function PastTrips() {
  const { data, loading, error } = useFetch('/trips?status=past');
  return (
    <>
    <section className="hero hero-past">
      <h1>Ten trips, and counting.</h1>
      <p>One group, one new country each month.</p>
    </section>
    <section className="page">
      <Status loading={loading} error={error} />
      {data && (
        <ul className="grid-trips">
          {data.map((t) => (
            <li key={t.slug} className={`tile tile-${t.slug}`}>
              <span className="badge">{monthLabel(t.month)}</span>
              <h3>{t.country}</h3>
            </li>
          ))}
        </ul>
      )}
      <Link to="/trips/japan" className="btn pink">Next up: Japan</Link>
    </section>
    </>
  );
}
