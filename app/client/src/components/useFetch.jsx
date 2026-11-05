import { useEffect, useState } from 'react';
import { api } from '../api.js';

export function useFetch(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let cancelled = false;
    setState({ data: null, error: null, loading: true });
    api(path).then(
      (data) => !cancelled && setState({ data, error: null, loading: false }),
      (error) => !cancelled && setState({ data: null, error, loading: false }),
    );
    return () => { cancelled = true; };
  }, [path]);
  return state;
}

export function Status({ loading, error }) {
  if (loading) return <p role="status" className="muted">Loading…</p>;
  if (error) return <p role="alert" className="error">{error.message}. Is the API running?</p>;
  return null;
}
