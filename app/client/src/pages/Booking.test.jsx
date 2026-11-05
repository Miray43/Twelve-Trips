import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Booking from './Booking.jsx';

const trip = { slug: 'japan', country: 'Japan', status: 'upcoming', priceSar: 9000, seatsLeft: 5, cities: ['Tokyo', 'Kyoto', 'Osaka'], experiences: [] };

beforeEach(() => {
  global.fetch = vi.fn(async (url, opts) => {
    if (url === '/api/trips/japan') return { ok: true, json: async () => trip };
    if (url === '/api/bookings' && opts.method === 'POST') return { ok: true, json: async () => ({ reference: 'TT-ABCD1234' }) };
    return { ok: false, json: async () => ({ error: 'nope' }) };
  });
});

const setup = () => render(
  <MemoryRouter initialEntries={['/book/japan']}>
    <Routes>
      <Route path="/book/:slug" element={<Booking />} />
      <Route path="/confirmed/:reference" element={<p>confirmed page</p>} />
    </Routes>
  </MemoryRouter>,
);

describe('Booking flow', () => {
  it('shows field errors and blocks step 2 with bad input', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByRole('button', { name: /continue to payment/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(screen.queryByText(/how would you like to pay/i)).not.toBeInTheDocument();
  });

  it('updates the total when seats change and caps at seats left', async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText('Who is travelling?');
    const add = screen.getByRole('button', { name: /add a seat/i });
    for (let i = 0; i < 8; i++) await user.click(add);
    expect(screen.getByLabelText('Seats')).toHaveTextContent('5');
    expect(screen.getByText('SAR 45,000')).toBeInTheDocument();
  });

  it('completes the booking and goes to the confirmation', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(await screen.findByLabelText('First name'), 'Mira');
    await user.type(screen.getByLabelText('Last name'), 'Al Harbi');
    await user.type(screen.getByLabelText('Mobile number'), '+966501234567');
    await user.type(screen.getByLabelText('Email'), 'mira@example.com');
    await user.click(screen.getByRole('button', { name: /continue to payment/i }));
    await user.click(await screen.findByRole('button', { name: /confirm booking/i }));
    expect(await screen.findByText(/accept the trip terms/i)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /confirm booking/i }));
    expect(await screen.findByText('confirmed page')).toBeInTheDocument();
  });
});
