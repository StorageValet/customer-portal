import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

interface Item {
  id: string;
  name: string;
  description?: string;
  category: string;
  estimatedValue: number;
  photoUrls: string[];
  coverPhotoIndex: number;
  qrCode: string;
  status: 'at_home' | 'in_storage';
  facility?: string;
  zone?: string;
  rack?: string;
  shelf?: string;
  createdAt: Date;
}

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const statusColor = item.status === 'at_home' ? 'text-green-600' : 'text-blue-600';
  const statusBg = item.status === 'at_home' ? 'bg-green-100' : 'bg-blue-100';
  
  const coverPhoto = item.photoUrls?.[item.coverPhotoIndex] || item.photoUrls?.[0];
  
  return (
    <div 
      className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        {/* Cover Photo - Hero Focus */}
        <div className="mb-3">
          {coverPhoto ? (
            <img 
              src={coverPhoto} 
              alt={item.name}
              className="w-full h-40 object-cover rounded"
            />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {/* Item Name */}
          <h3 className="font-semibold text-oxford-blue text-lg">{item.name}</h3>
          
          {/* Description (truncated) */}
          {item.description && (
            <p className="text-sm text-charcoal line-clamp-1">{item.description}</p>
          )}
          
          {/* Value and Location */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-oxford-blue">
              ${item.estimatedValue?.toLocaleString()}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBg} ${statusColor}`}>
              {item.status === 'at_home' ? 'At Home' : 'In Storage'}
            </span>
          </div>
          
          {/* Photo Count Indicator */}
          {item.photoUrls && item.photoUrls.length > 1 && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>📷 {item.photoUrls.length} photos</span>
              {item.coverPhotoIndex > 0 && <span>• Cover: #{item.coverPhotoIndex + 1}</span>}
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            Category: {item.category}
          </div>
          
          {/* QR Code - Discrete at bottom for internal use */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <span className="font-mono">QR: {item.qrCode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}