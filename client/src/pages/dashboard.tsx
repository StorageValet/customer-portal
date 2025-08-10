import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const items = useQuery({ queryKey: ['items'], queryFn: api.items, enabled: isAuthenticated });
  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <div className="p-6">You are not signed in.</div>;
  return (<div className="p-6"><h1 className="text-xl font-semibold mb-2">Welcome, {user.fullName}</h1><p>Plan: {user.planTier} | Zip: {user.zipCode}</p><div className="mt-6"><h2 className="font-semibold mb-2">Your Items</h2>{items.isLoading ? <div>Loading items…</div> : items.data && items.data.length ? (<ul className="list-disc ml-5">{items.data.map((it: any) => <li key={it.id}>{it.name || it.id}</li>)}</ul>) : <div>No items yet.</div>}</div></div>);
}
