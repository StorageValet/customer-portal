import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, X, Star, StarOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: any;
}

export default function AddItemModal({ isOpen, onClose, item }: AddItemModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    estimatedValue: "",
    photoUrls: [] as string[],
    coverPhotoIndex: 0,
    location: "At Home",
    status: "at_home" as const,
    length: "12",
    width: "12",
    height: "12",
    weight: "10",
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createItemMutation = useMutation({
    mutationFn: api.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      toast({
        title: "Item Added",
        description: "Your item has been added to your inventory",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number } & any) => api.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      toast({
        title: "Item Updated",
        description: "Your item has been updated",
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        category: item.category || "",
        estimatedValue: item.estimatedValue?.toString() || "",
        photoUrls: item.photoUrls || [],
        coverPhotoIndex: item.coverPhotoIndex || 0,
        location: item.location || "At Home",
        status: item.status || "at_home",
        length: item.length?.toString() || "12",
        width: item.width?.toString() || "12",
        height: item.height?.toString() || "12",
        weight: item.weight?.toString() || "10",
      });
      setPreviewUrls(item.photoUrls || []);
    } else {
      resetForm();
    }
  }, [item]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      estimatedValue: "",
      photoUrls: [],
      coverPhotoIndex: 0,
      location: "At Home",
      status: "at_home",
      length: "12",
      width: "12",
      height: "12",
      weight: "10",
    });
    setPhotoFiles([]);
    setPreviewUrls([]);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (photoFiles.length + files.length > 5) {
      toast({
        title: "Too Many Photos",
        description: "You can only add up to 5 photos per item",
        variant: "destructive",
      });
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} is larger than 5MB`,
          variant: "destructive",
        });
        return;
      }
    }

    const newPhotoFiles = [...photoFiles, ...files];
    const newPreviewUrls = [...previewUrls];
    
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      newPreviewUrls.push(url);
    });

    setPhotoFiles(newPhotoFiles);
    setPreviewUrls(newPreviewUrls);
  };

  const removePhoto = (index: number) => {
    const newPhotoFiles = photoFiles.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    setPhotoFiles(newPhotoFiles);
    setPreviewUrls(newPreviewUrls);
    
    // Adjust cover photo index if needed
    if (formData.coverPhotoIndex >= newPreviewUrls.length) {
      setFormData(prev => ({ ...prev, coverPhotoIndex: Math.max(0, newPreviewUrls.length - 1) }));
    }
  };

  const setCoverPhoto = (index: number) => {
    setFormData(prev => ({ ...prev, coverPhotoIndex: index }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.estimatedValue) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload new photos if any
      const uploadedUrls: string[] = [];
      
      // If editing an item, keep existing URLs for photos that weren't changed
      if (item && item.photoUrls) {
        const existingUrlsCount = item.photoUrls.length;
        const newFilesStartIndex = existingUrlsCount;
        
        // Keep existing URLs
        uploadedUrls.push(...item.photoUrls.slice(0, Math.min(existingUrlsCount, previewUrls.length)));
      }
      
      // Upload new photo files
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const uploadFormData = new FormData();
        uploadFormData.append('photo', file);
        
        try {
          const response = await fetch('/api/upload-photo', {
            method: 'POST',
            credentials: 'include',
            body: uploadFormData,
          });
          
          if (!response.ok) {
            throw new Error('Failed to upload photo');
          }
          
          const { photoUrl } = await response.json();
          uploadedUrls.push(photoUrl);
        } catch (uploadError) {
          console.error('Error uploading photo:', uploadError);
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}. Using placeholder.`,
            variant: "destructive",
          });
          // Use preview URL as fallback
          uploadedUrls.push(previewUrls[uploadedUrls.length]);
        }
      }

      const itemData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        estimatedValue: parseInt(formData.estimatedValue),
        length: parseInt(formData.length || "12"),
        width: parseInt(formData.width || "12"), 
        height: parseInt(formData.height || "12"),
        weight: parseInt(formData.weight || "10"),
        photoUrls: uploadedUrls,
        coverPhotoIndex: formData.coverPhotoIndex,
        location: formData.location,
        status: formData.status,
      };

      if (item) {
        updateItemMutation.mutate({ id: item.id, ...itemData });
      } else {
        createItemMutation.mutate(itemData);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to save item. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-navy">
            {item ? "Edit Item" : "Add New Item"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-navy">Item Name *</Label>
            <Input
              id="name"
              placeholder="Enter item name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-navy">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-navy">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Seasonal">Seasonal</SelectItem>
                <SelectItem value="Documents">Documents</SelectItem>
                <SelectItem value="Kitchen">Kitchen</SelectItem>
                <SelectItem value="Sports">Sports</SelectItem>
                <SelectItem value="Books">Books</SelectItem>
                <SelectItem value="Toys">Toys</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimatedValue" className="text-navy">Estimated Value *</Label>
            <Input
              id="estimatedValue"
              type="number"
              placeholder="Enter value"
              value={formData.estimatedValue}
              onChange={(e) => handleInputChange("estimatedValue", e.target.value)}
              required
            />
          </div>

          {/* Dimensions Section */}
          <div className="space-y-2">
            <Label className="text-navy">Dimensions & Weight</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="length" className="text-sm text-charcoal">Length (inches)</Label>
                <Input
                  id="length"
                  type="number"
                  placeholder="12"
                  value={formData.length}
                  onChange={(e) => handleInputChange("length", e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="width" className="text-sm text-charcoal">Width (inches)</Label>
                <Input
                  id="width"
                  type="number"
                  placeholder="12"
                  value={formData.width}
                  onChange={(e) => handleInputChange("width", e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="height" className="text-sm text-charcoal">Height (inches)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="12"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="weight" className="text-sm text-charcoal">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="10"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  min="1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">These help us determine the right truck size for your order</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-navy">Current Location (defaults to "At Home")</Label>
            <Select 
              value={formData.location} 
              onValueChange={(value) => handleInputChange("location", value)}
              disabled
            >
              <SelectTrigger className="bg-gray-50 text-gray-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="At Home">At Home</SelectItem>
                <SelectItem value="At Storage">At Storage</SelectItem>
                <SelectItem value="Hoboken Apartment">Hoboken Apartment</SelectItem>
                <SelectItem value="East Hampton Beach House">East Hampton Beach House</SelectItem>
                <SelectItem value="Narragansett Beach House">Narragansett Beach House</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Location updates automatically when items are scanned</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-navy">Photos (up to 5)</Label>
            <div className="space-y-3">
              {/* Photo Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <label htmlFor="photos" className="cursor-pointer">
                    <span className="text-sm text-navy hover:text-teal">
                      Click to add photos (up to 5)
                    </span>
                    <input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoAdd}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Max 5MB per photo</p>
                </div>
              </div>

              {/* Photo Previews */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-40 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverPhoto(index)}
                        className={`absolute -top-2 -left-2 p-1 rounded-full ${
                          formData.coverPhotoIndex === index
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        } hover:bg-yellow-400`}
                      >
                        {formData.coverPhotoIndex === index ? (
                          <Star className="h-3 w-3" />
                        ) : (
                          <StarOff className="h-3 w-3" />
                        )}
                      </button>
                      {formData.coverPhotoIndex === index && (
                        <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-white text-xs text-center py-1">
                          Cover Photo
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-teal hover:bg-teal-dark text-white"
              disabled={createItemMutation.isPending || updateItemMutation.isPending}
            >
              {createItemMutation.isPending || updateItemMutation.isPending
                ? "Saving..."
                : item ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}