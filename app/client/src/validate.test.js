import { describe, it, expect } from 'vitest';
import { validateDetails, formatSar, monthLabel } from './validate.js';

const ok = { firstName: 'Mira', lastName: 'Al Harbi', phone: '+966 50 123 4567', email: 'a@b.co', seats: 2, notes: '' };

describe('validateDetails', () => {
  it('accepts valid details', () => expect(validateDetails(ok)).toEqual({}));
  it('accepts Arabic names', () => expect(validateDetails({ ...ok, firstName: 'ميرا', lastName: 'الحربي' })).toEqual({}));
  it('flags every bad field', () => {
    const e = validateDetails({ firstName: '', lastName: '1', phone: 'abc', email: 'x', seats: 9, notes: '' });
    expect(Object.keys(e).sort()).toEqual(['email', 'firstName', 'lastName', 'phone', 'seats']);
  });
});
describe('format helpers', () => {
  it('formats SAR', () => expect(formatSar(27000)).toBe('SAR 27,000'));
  it('formats month', () => expect(monthLabel('2026-11')).toBe('Nov 2026'));
});
