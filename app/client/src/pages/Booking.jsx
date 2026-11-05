import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Stepper from '../components/Stepper.jsx';
import { useFetch, Status } from '../components/useFetch.jsx';
import { api } from '../api.js';
import { validateDetails, formatSar } from '../validate.js';

export function Field({ id, label, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="error">{error}</p>}
    </div>
  );
}

export default function Booking() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { data: trip, loading, error: loadError } = useFetch(`/trips/${slug}`);
  const [step, setStep] = useState(0);
  const [v, setV] = useState({ firstName: '', lastName: '', phone: '', email: '', seats: 1, notes: '' });
  const [payment, setPayment] = useState('card');
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading || loadError) return <section className="page"><Status loading={loading} error={loadError} /></section>;
  if (trip.status !== 'upcoming') return <section className="page narrow"><h1>This trip is closed</h1></section>;

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const maxSeats = Math.min(6, trip.seatsLeft);
  const total = v.seats * trip.priceSar;
  const err = (k) => errors[k];
  const aria = (k) => ({ 'aria-invalid': err(k) ? true : undefined, 'aria-describedby': err(k) ? `${k}-err` : undefined });

  function next(e) {
    e.preventDefault();
    const found = validateDetails(v);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep(1);
  }

  async function confirm(e) {
    e.preventDefault();
    if (!terms) return setErrors({ acceptedTerms: 'You need to accept the trip terms' });
    setBusy(true); setSubmitError(''); setErrors({});
    try {
      const r = await api('/bookings', { method: 'POST', body: { tripSlug: slug, ...v, seats: v.seats, paymentMethod: payment, acceptedTerms: terms } });
      nav(`/confirmed/${r.reference}`, { replace: true });
    } catch (ex) {
      if (ex.status === 401) return nav('/login', { state: { from: `/book/${slug}` } });
      if (ex.fields && Object.keys(ex.fields).length) { setErrors(ex.fields); setStep(0); }
      setSubmitError(ex.message);
    } finally { setBusy(false); }
  }

  return (
    <>
      <section className="hero hero-book"><h1>Book your seat</h1><Stepper current={step} /></section>
      <section className="page book-layout">
        <div className="panel">
          {step === 0 && (
            <form onSubmit={next} noValidate>
              <h2>Who is travelling?</h2>
              <p className="muted">Use the name exactly as it appears on the passport.</p>
              <div className="two">
                <Field id="firstName" label="First name" error={err('firstName')}><input id="firstName" value={v.firstName} onChange={set('firstName')} autoComplete="given-name" {...aria('firstName')} /></Field>
                <Field id="lastName" label="Last name" error={err('lastName')}><input id="lastName" value={v.lastName} onChange={set('lastName')} autoComplete="family-name" {...aria('lastName')} /></Field>
                <Field id="phone" label="Mobile number" error={err('phone')}><input id="phone" value={v.phone} onChange={set('phone')} placeholder="+966 5X XXX XXXX" autoComplete="tel" inputMode="tel" {...aria('phone')} /></Field>
                <Field id="email" label="Email" error={err('email')}><input id="email" type="email" value={v.email} onChange={set('email')} placeholder="name@email.com" autoComplete="email" {...aria('email')} /></Field>
              </div>
              <div className="seats">
                <div><strong>Seats</strong><br /><small>{formatSar(trip.priceSar)} per seat · {trip.seatsLeft} left</small></div>
                <div className="counter">
                  <button type="button" aria-label="Remove a seat" onClick={() => setV({ ...v, seats: Math.max(1, v.seats - 1) })}>−</button>
                  <output aria-live="polite" aria-label="Seats">{v.seats}</output>
                  <button type="button" aria-label="Add a seat" onClick={() => setV({ ...v, seats: Math.min(maxSeats, v.seats + 1) })}>+</button>
                </div>
              </div>
              {err('seats') && <p role="alert" className="error">{err('seats')}</p>}
              <h2>Anything we should know?</h2>
              <p className="muted">Food allergies, mobility needs or anything that helps us plan. Optional.</p>
              <textarea aria-label="Notes" rows="3" maxLength="500" value={v.notes} onChange={set('notes')} />
              <button className="btn blue wide">Continue to payment</button>
            </form>
          )}
          {step === 1 && (
            <form onSubmit={confirm} noValidate>
              <h2>How would you like to pay?</h2>
              <p className="muted">No payment is taken in this concept project. You will not be charged.</p>
              <fieldset className="pay">
                <legend className="sr">Payment method</legend>
                <label className={payment === 'card' ? 'opt on' : 'opt'}><input type="radio" name="pay" checked={payment === 'card'} onChange={() => setPayment('card')} /><span><strong>Mada or credit card</strong><br /><small>Pay securely online</small></span></label>
                <label className={payment === 'transfer' ? 'opt on' : 'opt'}><input type="radio" name="pay" checked={payment === 'transfer'} onChange={() => setPayment('transfer')} /><span><strong>Bank transfer</strong><br /><small>We send you the account details</small></span></label>
              </fieldset>
              <label className="check"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> I agree to the trip terms and the cancellation policy.</label>
              {err('acceptedTerms') && <p role="alert" className="error">{err('acceptedTerms')}</p>}
              {submitError && <p role="alert" className="error">{submitError}</p>}
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setStep(0)}>Back</button>
                <button className="btn blue wide" disabled={busy}>{busy ? 'Booking…' : 'Confirm booking'}</button>
              </div>
            </form>
          )}
        </div>
        <aside className="summary" aria-label="Booking summary">
          <div className={`tile tile-${trip.slug} short`}><h3>{trip.country}</h3><small>{trip.cities.join(', ')}</small></div>
          <dl>
            <div><dt>Dates</dt><dd>Nov 14-24, 2026</dd></div>
            <div><dt>Length</dt><dd>11 days, 10 nights</dd></div>
            <div><dt>Seats</dt><dd>{v.seats}</dd></div>
          </dl>
          <ul className="checks"><li>Flights</li><li>Four-star hotel</li><li>Daily breakfast</li><li>Activity bookings</li></ul>
          <p className="total"><span>Total</span><strong>{formatSar(total)}</strong></p>
        </aside>
      </section>
    </>
  );
}
