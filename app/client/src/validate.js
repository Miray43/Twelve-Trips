const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ]{9,15}$/;
const NAME_RE = /^[\p{L} '-]{1,60}$/u;

export function validateDetails(v) {
  const e = {};
  if (!NAME_RE.test(v.firstName.trim())) e.firstName = 'Enter the first name as on the passport';
  if (!NAME_RE.test(v.lastName.trim())) e.lastName = 'Enter the last name as on the passport';
  if (!PHONE_RE.test(v.phone.trim())) e.phone = 'Enter a valid mobile number, for example +966 5X XXX XXXX';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email';
  if (!Number.isInteger(v.seats) || v.seats < 1 || v.seats > 6) e.seats = 'Choose 1 to 6 seats';
  return e;
}

export const formatSar = (n) => `SAR ${Number(n).toLocaleString('en-US')}`;
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const monthLabel = (ym) => { const [y, m] = ym.split('-'); return `${MONTHS[Number(m) - 1]} ${y}`; };
