import { Link, useParams } from 'react-router-dom';
import { useFetch, Status } from '../components/useFetch.jsx';
import { formatSar } from '../validate.js';

const INCLUDED = ['Flights', 'Four-star hotel', 'Daily breakfast', 'Activity bookings'];

export default function Trip() {
  const { slug } = useParams();
  const { data: t, loading, error } = useFetch(`/trips/${slug}`);
  if (loading || error) return <section className="page"><Status loading={loading} error={error} /></section>;
  const open = t.status === 'upcoming';
  const full = open && t.seatsLeft === 0;
  return (
    <>
      <section className="hero hero-japan">
        <p className="eyebrow">November 14 to 24, 2026</p>
        <h1>{t.country}, <span className="pink-text">together.</span></h1>
        <p>{t.summary}</p>
        <div className="bookbar">
          <div><small>Route</small><strong>{t.cities.join(', ')}</strong></div>
          <div><small>Price</small><strong>{open ? `${formatSar(t.priceSar)} per seat` : 'Trip completed'}</strong></div>
          {open && <div><small>Seats left</small><strong>{t.seatsLeft}</strong></div>}
          {open && (full ? <span className="btn disabled" aria-disabled="true">Fully booked</span> : <Link className="btn blue" to={`/book/${t.slug}`}>Book {t.country}</Link>)}
        </div>
      </section>
      <section className="page">
        <h2>Three cities, one trip</h2>
        <ul className="cities">{t.cities.map((c) => <li key={c} className={`tile tile-${c.toLowerCase()}`}><h3>{c}</h3></li>)}</ul>
      </section>
      {t.experiences.length > 0 && (
        <section className="page dark-band">
          <h2>Eight experiences, already booked.</h2>
          <ul className="exps">{t.experiences.map((x) => <li key={x.title}><span className="city">{x.city}</span><h3>{x.title}</h3></li>)}</ul>
        </section>
      )}
      <section className="page">
        <h2>What is included in the price</h2>
        <ul className="checks">{INCLUDED.map((i) => <li key={i}>{i}</li>)}</ul>
      </section>
    </>
  );
}
