import { Link } from 'react-router-dom';
import { useFetch, Status } from '../components/useFetch.jsx';
import { formatSar } from '../validate.js';

export default function Home() {
  const { data: japan, loading, error } = useFetch('/trips/japan');
  return (
    <>
      <section className="hero hero-home">
        <h1>One group.<br />Twelve countries.</h1>
        <p>Every month we take one group to a new country. Flights, hotel and activities are handled, so you only have to show up.</p>
        <Link to="/trips/japan" className="btn pink">Book Japan</Link>
        <dl className="stats"><div><dt>Countries a year</dt><dd>12</dd></div><div><dt>Group each trip</dt><dd>1</dd></div><div><dt>Next trip</dt><dd>Nov</dd></div></dl>
      </section>
      <section className="page">
        <h2>Why a group trip works</h2>
        <div className="cards3">
          <article className="card dark"><h3>Travel with a group</h3><p>Meet people you would not have met, and share the planning load.</p></article>
          <article className="card dark"><h3>Everything arranged</h3><p>Flights, hotel, breakfast and activities are booked before you pay.</p></article>
          <article className="card dark"><h3>A new country monthly</h3><p>Twelve destinations a year, announced well ahead.</p></article>
        </div>
      </section>
      <section className="hero hero-japan">
        <Status loading={loading} error={error} />
        {japan && (<>
          <h2 className="big">Japan</h2>
          <p>November 14 to 24, 2026. Return flights, a four-star hotel and daily breakfast.</p>
          <p className="price">{formatSar(japan.priceSar)} <small>per seat · {japan.seatsLeft} seats left</small></p>
          <Link to="/trips/japan" className="btn pink">See the trip</Link>
        </>)}
      </section>
    </>
  );
}
