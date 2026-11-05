const STEPS = ['Your details', 'Payment', 'Confirmed'];

export default function Stepper({ current }) {
  return (
    <ol className="stepper" aria-label="Booking progress">
      {STEPS.map((s, i) => (
        <li key={s} className={i === current ? 'on' : ''} aria-current={i === current ? 'step' : undefined}>{s}</li>
      ))}
    </ol>
  );
}
