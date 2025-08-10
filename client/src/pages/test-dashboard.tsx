export default function TestDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test Dashboard - No API Calls</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Success!</h2>
          <p className="text-green-600">✓ You have successfully reached a working page</p>
          <p className="text-gray-600 mt-2">This page makes no API calls and has no authentication checks.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold">Your Items</h3>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-semibold">Total Value</h3>
            <p className="text-2xl font-bold">$2,450</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm">
            <strong>Note:</strong> This is a test page with mock data. 
            The actual dashboard at /dashboard is trying to fetch from /api/items and /api/movements which are failing.
          </p>
        </div>
      </div>
    </div>
  );
}