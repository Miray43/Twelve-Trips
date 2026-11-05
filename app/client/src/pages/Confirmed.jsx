import { Link, useParams } from 'react-router-dom';
import Stepper from '../components/Stepper.jsx';
import { useFetch, Status } from '../components/useFetch.jsx';
import { formatSar } from '../validate.js';

export default function Confirmed() {
  const { reference } = useParams();
  const { data, loading, error } = useFetch('/bookings/mine');
  const b = data?.find((x) => x.reference === reference);
  return (
    <>
      <section className="hero hero-confirm">
        <Stepper current={2} />
        <Status loading={loading} error={error} />
        {data && !b && <h1>We could not find that booking</h1>}
        {b && (
          <div className="glass">
            <h1>You are going to {b.country}.</h1>
            <p>Your seat is booked. A confirmation would be sent by email in a real service.</p>
            <dl>
              <div><dt>Reference</dt><dd>{b.reference}</dd></div>
              <div><dt>Seats</dt><dd>{b.seats}</dd></div>
              <div><dt>Total</dt><dd>{formatSar(b.totalSar)}</dd></div>
              <div><dt>Payment</dt><dd>{b.paymentMethod === 'card' ? 'Mada or credit card' : 'Bank transfer'}</dd></div>
            </dl>
            <h2>What happens next</h2>
            <ol><li>Check your email for the confirmation.</li><li>Keep your reference handy.</li><li>We share the day-by-day plan before departure.</li></ol>
            <Link to="/" className="btn pink">Back home</Link>
          </div>
        )}
      </section>
    </>
  );
}
