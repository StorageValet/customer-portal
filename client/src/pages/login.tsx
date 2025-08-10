import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useLocation } from 'wouter';
export default function LoginPage() {
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false); const [, navigate] = useLocation();
  useEffect(() => { const url = new URL(window.location.href); const token = url.searchParams.get('token'); if (token) { api.magicLinkVerify(token).then(() => navigate('/dashboard')).catch(() => {}); } }, [navigate]);
  const onSubmit = async (e: React.FormEvent) => { e.preventDefault(); await api.magicLinkRequest(email); setSent(true); };
  return (<div className="p-6 max-w-md mx-auto"><h1 className="text-xl font-semibold mb-4">Sign in</h1>{sent ? (<p>Check your email for a sign-in link.</p>) : (<form onSubmit={onSubmit} className="space-y-3"><input className="border w-full p-2" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} /><button className="bg-black text-white px-4 py-2 rounded">Email me a sign-in link</button></form>)}</div>);
}
