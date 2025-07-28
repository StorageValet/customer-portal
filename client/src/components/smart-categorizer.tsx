import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Search, Filter, Tag, TrendingUp } from "lucide-react";

interface SmartCategorizerProps {
  items: any[];
  onCategoryUpdate: (itemId: number, newCategory: string) => void;
}

export default function SmartCategorizer({ items, onCategoryUpdate }: SmartCategorizerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Smart categorization logic based on item names and descriptions
  const suggestCategory = (itemName: string, description?: string): string => {
    const text = (itemName + " " + (description || "")).toLowerCase();
    
    if (text.includes("clothes") || text.includes("shirt") || text.includes("dress") || 
        text.includes("pants") || text.includes("jacket") || text.includes("shoes")) {
      return "Clothing";
    }
    if (text.includes("laptop") || text.includes("phone") || text.includes("tablet") || 
        text.includes("computer") || text.includes("tv") || text.includes("electronics")) {
      return "Electronics";
    }
    if (text.includes("christmas") || text.includes("holiday") || text.includes("winter") || 
        text.includes("summer") || text.includes("decorations")) {
      return "Seasonal";
    }
    if (text.includes("book") || text.includes("document") || text.includes("paper") || 
        text.includes("certificate") || text.includes("file")) {
      return "Documents";
    }
    if (text.includes("kitchen") || text.includes("dish") || text.includes("pot") || 
        text.includes("pan") || text.includes("utensil") || text.includes("cooking")) {
      return "Kitchen";
    }
    if (text.includes("sport") || text.includes("gym") || text.includes("bike") || 
        text.includes("exercise") || text.includes("fitness")) {
      return "Sports";
    }
    if (text.includes("toy") || text.includes("game") || text.includes("puzzle") || 
        text.includes("doll") || text.includes("lego")) {
      return "Toys";
    }
    
    return "Other";
  };

  // Find items that could benefit from better categorization
  const uncategorizedItems = items.filter(item => 
    !item.category || item.category === "Other" || item.category === ""
  );

  const suggestedRecategorizations = items
    .map(item => ({
      ...item,
      suggestedCategory: suggestCategory(item.name, item.description)
    }))
    .filter(item => 
      item.category !== item.suggestedCategory && 
      item.suggestedCategory !== "Other"
    );

  const filteredSuggestions = suggestedRecategorizations.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === "" || item.suggestedCategory === selectedCategory)
  );

  const categoryDistribution = items.reduce((acc, item) => {
    const category = item.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryDistribution)
    .sort(([,a], [,b]) => b - a);

  return (
    <div className="space-y-6">
      {/* Smart Suggestions Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-navy">
            <Sparkles className="mr-2 h-5 w-5 text-teal" />
            Smart Categorization Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-navy">{uncategorizedItems.length}</div>
              <div className="text-sm text-gray-regent">Items need categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal">{suggestedRecategorizations.length}</div>
              <div className="text-sm text-gray-regent">Better category suggestions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald">{sortedCategories.length}</div>
              <div className="text-sm text-gray-regent">Categories in use</div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="space-y-3">
            <h4 className="font-semibold text-navy">Category Distribution</h4>
            <div className="space-y-2">
              {sortedCategories.slice(0, 5).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-navy">{category}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-teal h-2 rounded-full" 
                        style={{ width: `${(count / items.length) * 100}%` }}
                      />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categorization Suggestions */}
      {suggestedRecategorizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg text-navy">
              <TrendingUp className="mr-2 h-5 w-5 text-emerald" />
              Smart Category Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by suggested category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Clothing">Clothing</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Seasonal">Seasonal</SelectItem>
                  <SelectItem value="Documents">Documents</SelectItem>
                  <SelectItem value="Kitchen">Kitchen</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Toys">Toys</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Suggestion List */}
            <div className="space-y-3">
              {filteredSuggestions.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Tag className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-navy">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-regent line-clamp-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-regent">Current:</div>
                      <Badge variant="outline">
                        {item.category || "None"}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-regent">Suggested:</div>
                      <Badge className="bg-teal/10 text-teal border-teal">
                        {item.suggestedCategory}
                      </Badge>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => onCategoryUpdate(item.id, item.suggestedCategory)}
                      className="bg-teal text-navy hover:bg-teal-medium"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSuggestions.length === 0 && (
              <div className="text-center py-8 text-gray-regent">
                {searchTerm || selectedCategory 
                  ? "No matching suggestions found"
                  : "All items are properly categorized! 🎉"
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}