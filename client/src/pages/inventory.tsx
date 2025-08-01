import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { api, type Item } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Trash2, Package, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ItemCard from "@/components/item-card";
import AddItemModal from "@/components/add-item-modal";
import AIChatbot from "@/components/ai-chatbot";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { InventorySkeleton } from "@/components/loading-skeleton";

export default function Inventory() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkActionMode, setBulkActionMode] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['/api/items'],
    queryFn: api.getItems,
  });

  const deleteItemMutation = useMutation({
    mutationFn: api.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      toast({
        title: "Item Deleted",
        description: "Item has been removed from your inventory",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    },
  });



  // Early returns after all hooks
  if (!user) {
    return <div>Please log in to access your inventory.</div>;
  }

  if (isLoading) {
    return <InventorySkeleton />;
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesStatus = !statusFilter || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(items.map(item => item.category)));

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setIsAddModalOpen(true);
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: api.bulkDeleteItems,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      toast({
        title: "Items Deleted",
        description: `${data.deletedCount} items have been removed from your inventory`,
      });
      setSelectedItems([]);
      setBulkActionMode(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete items",
        variant: "destructive",
      });
    },
  });

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      bulkDeleteMutation.mutate(selectedItems);
    }
  };

  const handleSchedulePickup = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to schedule for pickup",
        variant: "destructive",
      });
      return;
    }
    // Navigate to scheduling page with selected items
    window.location.href = `/schedule-pickup?items=${selectedItems.join(',')}`;
  };

  const handleScheduleDelivery = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to schedule for delivery",
        variant: "destructive",
      });
      return;
    }
    // Navigate to scheduling page with selected items
    window.location.href = `/schedule-delivery?items=${selectedItems.join(',')}`;
  };

  const calculateTotalVolume = (items: Item[]) => {
    return items.reduce((total, item) => {
      return total + (item.length * item.width * item.height);
    }, 0);
  };

  const calculateTotalWeight = (items: Item[]) => {
    return items.reduce((total, item) => total + item.weight, 0);
  };

  const formatVolume = (cubicInches: number) => {
    const cubicFeet = cubicInches / 1728;
    return cubicFeet.toFixed(1) + ' ft³';
  };

  const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
  const totalVolume = calculateTotalVolume(selectedItemsData);
  const totalWeight = calculateTotalWeight(selectedItemsData);

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Category', 'Value', 'Status', 'Description'].join(','),
      ...filteredItems.map(item => [
        `"${item.name}"`,
        `"${item.category}"`,
        item.estimatedValue,
        item.status,
        `"${item.description || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'storage-inventory.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-mint-cream">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-8 border-silver">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-oxford-blue">Your Storage Inventory</h1>
                <p className="text-charcoal">Manage your stored items</p>
              </div>
              <Button onClick={handleAddItem} className="bg-sea-green text-mint-cream hover:bg-sea-green/90">
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Actions */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="in_storage">In Storage</SelectItem>
                  <SelectItem value="at_home">At Home</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex-1 max-w-md">
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={exportToCSV}
                  className="text-oxford-blue border-oxford-blue hover:bg-oxford-blue hover:text-mint-cream"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                
                <Button 
                  variant={bulkActionMode ? "default" : "outline"}
                  onClick={() => {
                    setBulkActionMode(!bulkActionMode);
                    setSelectedItems([]);
                  }}
                  className={bulkActionMode ? "bg-oxford-blue text-mint-cream" : "text-oxford-blue border-oxford-blue hover:bg-oxford-blue hover:text-mint-cream"}
                >
                  {bulkActionMode ? "Cancel" : "Select"}
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {bulkActionMode && (
              <div className="p-4 bg-sea-green/10 rounded-lg border border-sea-green/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-oxford-blue font-medium">
                      {selectedItems.length} of {filteredItems.length} items selected
                    </span>
                  </div>
                  
                  {selectedItems.length > 0 && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ({selectedItems.length})
                      </Button>
                    </div>
                  )}
                </div>
                
                {selectedItems.length > 0 && (
                  <div className="border-t border-sea-green/20 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-oxford-blue">
                          Total Volume: <span className="font-semibold">{formatVolume(totalVolume)}</span>
                        </p>
                        <p className="text-sm text-oxford-blue">
                          Total Weight: <span className="font-semibold">{totalWeight} lbs</span>
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleSchedulePickup}
                          className="bg-sea-green text-white hover:bg-sea-green/90"
                          disabled={selectedItemsData.some(item => item.status === 'in_storage')}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Schedule Pickup
                        </Button>
                        
                        <Button 
                          size="sm" 
                          onClick={handleScheduleDelivery}
                          className="bg-oxford-blue text-white hover:bg-oxford-blue/90"
                          disabled={selectedItemsData.some(item => item.status === 'at_home')}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Schedule Delivery
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-oxford-blue">
              Items ({filteredItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-charcoal">Loading your items...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-charcoal">
                  {searchTerm || categoryFilter || statusFilter 
                    ? "No items match your filters" 
                    : "No items yet. Add your first item to get started!"
                  }
                </p>
                {!searchTerm && !categoryFilter && !statusFilter && (
                  <Button onClick={handleAddItem} className="mt-4 bg-sea-green text-mint-cream hover:bg-sea-green/90">
                    Add Your First Item
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="relative">
                    {bulkActionMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={() => handleSelectItem(item.id)}
                          className="bg-white shadow-sm"
                        />
                      </div>
                    )}
                    <ItemCard
                      item={item}
                      onClick={bulkActionMode ? () => handleSelectItem(item.id) : () => handleEditItem(item)}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        item={selectedItem}
      />

      {/* AI Chatbot */}
      <AIChatbot 
        currentPage="inventory"
        userContext={{
          totalItems: items.length,
          filteredItems: filteredItems.length,
          categories: categories.length,
          selectedItems: selectedItems.length
        }}
      />
    </div>
  );
}
