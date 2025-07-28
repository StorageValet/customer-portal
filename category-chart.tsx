import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Item } from "@shared/schema";

interface CategoryChartProps {
  items: Item[];
}

export default function CategoryChart({ items }: CategoryChartProps) {
  // Process items to calculate value by category
  const categoryData = items.reduce((acc, item) => {
    const existing = acc.find(cat => cat.name === item.category);
    if (existing) {
      existing.value += item.estimatedValue;
    } else {
      acc.push({
        name: item.category,
        value: item.estimatedValue,
      });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Sort by value descending and take top categories
  const sortedData = categoryData
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Show top 6 categories

  // Color palette for the chart
  const COLORS = ['#14B8A6', '#0E7490', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

  // Custom label formatter
  const renderCustomLabel = ({ value }: { value: number }) => {
    return `$${value.toLocaleString()}`;
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg text-navy">Value by Category</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {sortedData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sortedData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sortedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span className="text-sm text-gray-700">
                      {value} (${entry.value.toLocaleString()})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-regent">No items to display</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}