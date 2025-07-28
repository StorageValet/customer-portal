import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  Info,
  Star,
  Zap
} from "lucide-react";
import { format, addDays, isWeekend, isSameDay, parseISO } from "date-fns";

interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
  premium?: boolean;
  recommended?: boolean;
}

interface SmartSchedulerProps {
  type: 'pickup' | 'delivery';
  availableItems: any[];
  existingMovements?: any[];
  onSchedule: (data: any) => void;
  isLoading?: boolean;
  preSelectedItemIds?: number[];
}

export default function SmartScheduler({
  type,
  availableItems,
  existingMovements = [],
  onSchedule,
  isLoading = false,
  preSelectedItemIds = []
}: SmartSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<number[]>(preSelectedItemIds);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [urgentService, setUrgentService] = useState(false);
  const [combineWithDelivery, setCombineWithDelivery] = useState(false);

  // Generate smart time slots based on type and demand
  const generateTimeSlots = (date: string): TimeSlot[] => {
    const baseSlots: TimeSlot[] = [
      { id: '1', label: '8:00 AM - 12:00 PM', startTime: '08:00', endTime: '12:00', available: true, recommended: true },
      { id: '2', label: '12:00 PM - 4:00 PM', startTime: '12:00', endTime: '16:00', available: true },
      { id: '3', label: '4:00 PM - 8:00 PM', startTime: '16:00', endTime: '20:00', available: true },
    ];

    // Weekend slots
    const selectedDate = parseISO(date);
    if (isWeekend(selectedDate)) {
      baseSlots.push({
        id: '4',
        label: '9:00 AM - 1:00 PM (Weekend)',
        startTime: '09:00',
        endTime: '13:00',
        available: true,
        premium: true
      });
    }

    // Mark slots as unavailable based on existing bookings
    const dayMovements = existingMovements.filter(movement => 
      isSameDay(parseISO(movement.scheduledDate), selectedDate)
    );

    return baseSlots.map(slot => {
      const isBooked = dayMovements.some(movement => movement.timeSlot === slot.label);
      return { ...slot, available: !isBooked };
    });
  };

  // Smart date suggestions
  const getSmartDateSuggestions = () => {
    const suggestions = [];
    const today = new Date();
    
    // Next available business day
    let nextBusinessDay = addDays(today, 1);
    while (isWeekend(nextBusinessDay)) {
      nextBusinessDay = addDays(nextBusinessDay, 1);
    }
    
    suggestions.push({
      date: format(nextBusinessDay, 'yyyy-MM-dd'),
      label: 'Tomorrow',
      badge: 'Recommended',
      color: 'bg-teal/10 text-teal border-teal'
    });

    // This week
    for (let i = 2; i <= 7; i++) {
      const date = addDays(today, i);
      if (!isWeekend(date)) {
        suggestions.push({
          date: format(date, 'yyyy-MM-dd'),
          label: format(date, 'EEEE, MMM d'),
          badge: '',
          color: ''
        });
      }
    }

    // Next week
    for (let i = 8; i <= 14; i++) {
      const date = addDays(today, i);
      if (!isWeekend(date)) {
        suggestions.push({
          date: format(date, 'yyyy-MM-dd'),
          label: format(date, 'EEEE, MMM d'),
          badge: '',
          color: ''
        });
      }
    }

    return suggestions.slice(0, 10);
  };

  const datesuggestions = getSmartDateSuggestions();
  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  // Calculate estimated cost and time with volume/weight considerations
  const estimations = useMemo(() => {
    const baseServiceFee = type === 'pickup' ? 25 : 30;
    const itemCount = selectedItems.length;
    
    // Calculate total volume and weight
    let totalVolume = 0;
    let totalWeight = 0;
    
    selectedItems.forEach(itemId => {
      const item = availableItems.find(i => i.id === itemId);
      if (item) {
        // Calculate volume in cubic feet
        const volume = (item.length * item.width * item.height) / 1728; // Convert cubic inches to cubic feet
        totalVolume += volume;
        totalWeight += item.weight;
      }
    });
    
    // Determine truck size needed
    let truckSize = 'small';
    let volumeFee = 0;
    
    if (totalVolume > 100 || totalWeight > 500) {
      truckSize = 'large';
      volumeFee = 50;
    } else if (totalVolume > 50 || totalWeight > 250) {
      truckSize = 'medium';
      volumeFee = 25;
    } else {
      volumeFee = itemCount * 5;
    }
    
    const urgentFee = urgentService ? 15 : 0;
    const weekendFee = selectedDate && isWeekend(parseISO(selectedDate)) ? 10 : 0;
    
    const totalCost = baseServiceFee + volumeFee + urgentFee + weekendFee;
    const estimatedTime = Math.max(30, itemCount * 5); // 5 minutes per item, minimum 30 min
    
    return {
      cost: totalCost,
      time: estimatedTime,
      savings: combineWithDelivery ? 10 : 0,
      totalVolume: totalVolume.toFixed(1),
      totalWeight: totalWeight,
      truckSize: truckSize,
      itemCount: itemCount
    };
  }, [selectedItems, availableItems, urgentService, selectedDate, type, combineWithDelivery]);

  const handleItemToggle = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === availableItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(availableItems.map(item => item.id));
    }
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0 || !selectedDate || !selectedTimeSlot) {
      return;
    }

    onSchedule({
      type,
      scheduledDate: selectedDate,
      timeSlot: selectedTimeSlot,
      itemIds: selectedItems,
      specialInstructions,
      urgentService,
      combineWithDelivery,
      estimatedCost: estimations.cost - estimations.savings,
      estimatedTime: estimations.time
    });
  };

  const canSubmit = selectedItems.length > 0 && selectedDate && selectedTimeSlot;

  return (
    <div className="space-y-6">
      {/* Service Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-navy">
            {type === 'pickup' ? <Calendar className="mr-2 h-5 w-5" /> : <Truck className="mr-2 h-5 w-5" />}
            Schedule {type === 'pickup' ? 'Pickup' : 'Delivery'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-regent">
                {type === 'pickup' 
                  ? 'Select items to be collected from your home'
                  : 'Choose items to be delivered to you'
                }
              </p>
              <p className="text-sm text-teal font-medium mt-1">
                {availableItems.length} items available for {type}
              </p>
            </div>
            
            {selectedItems.length > 0 && (
              <div className="text-right space-y-1">
                <div className="text-2xl font-bold text-navy">
                  ${(estimations.cost - estimations.savings).toFixed(0)}
                </div>
                <div className="text-sm text-gray-regent">
                  Est. {estimations.time} minutes
                </div>
                <div className="text-sm space-x-3">
                  <span className="text-charcoal">
                    {estimations.itemCount} items
                  </span>
                  <span className="text-charcoal">
                    {estimations.totalVolume} ft³
                  </span>
                  <span className="text-charcoal">
                    {estimations.totalWeight} lbs
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {estimations.truckSize.toUpperCase()} TRUCK
                </Badge>
                {estimations.savings > 0 && (
                  <div className="text-sm text-emerald font-medium">
                    Save ${estimations.savings}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Item Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-navy">
              Select Items ({selectedItems.length}/{availableItems.length})
            </CardTitle>
            {availableItems.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-navy border-navy"
              >
                {selectedItems.length === availableItems.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {availableItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-regent">
                No items available for {type === 'pickup' ? 'pickup at home' : 'delivery from storage'}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedItems.includes(item.id) 
                      ? 'border-teal bg-teal/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleItemToggle(item.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleItemToggle(item.id)}
                    />
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {item.photoUrl ? (
                        <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-navy">{item.name}</h4>
                      <p className="text-sm text-gray-regent">{item.category}</p>
                      <div className="flex items-center space-x-2 text-xs text-charcoal">
                        <span>{item.length}x{item.width}x{item.height}" • {item.weight} lbs</span>
                        <span className="text-emerald font-medium">${item.estimatedValue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Selection */}
      {selectedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-navy">Choose Date</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {datesuggestions.map((suggestion) => (
                <Button
                  key={suggestion.date}
                  variant={selectedDate === suggestion.date ? "default" : "outline"}
                  className={`h-auto p-4 flex flex-col items-start ${
                    selectedDate === suggestion.date 
                      ? "bg-teal text-navy hover:bg-teal-medium" 
                      : "text-navy border-gray-200 hover:border-teal"
                  }`}
                  onClick={() => setSelectedDate(suggestion.date)}
                >
                  <div className="w-full flex items-center justify-between mb-1">
                    <span className="font-medium">{suggestion.label}</span>
                    {suggestion.badge && (
                      <Badge className={suggestion.color}>
                        {suggestion.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm opacity-70">
                    {format(parseISO(suggestion.date), 'MMM d, yyyy')}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slot Selection */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-navy">Select Time Slot</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedTimeSlot === slot.label ? "default" : "outline"}
                  disabled={!slot.available}
                  className={`h-auto p-4 flex items-center justify-between ${
                    selectedTimeSlot === slot.label 
                      ? "bg-teal text-navy hover:bg-teal-medium" 
                      : slot.available 
                        ? "text-navy border-gray-200 hover:border-teal" 
                        : "opacity-50"
                  }`}
                  onClick={() => slot.available && setSelectedTimeSlot(slot.label)}
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">{slot.label}</div>
                      {!slot.available && (
                        <div className="text-sm text-red-500">Unavailable</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {slot.recommended && (
                      <Badge className="bg-emerald/10 text-emerald border-emerald">
                        <Star className="mr-1 h-3 w-3" />
                        Best
                      </Badge>
                    )}
                    {slot.premium && (
                      <Badge className="bg-purple/10 text-purple border-purple">
                        <Zap className="mr-1 h-3 w-3" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Options */}
      {selectedTimeSlot && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-navy">Service Options</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="urgent"
                checked={urgentService}
                onCheckedChange={setUrgentService}
              />
              <Label htmlFor="urgent" className="text-navy">
                Urgent Service (+$15) - Priority handling and faster service
              </Label>
            </div>
            
            {type === 'pickup' && (
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="combine"
                  checked={combineWithDelivery}
                  onCheckedChange={setCombineWithDelivery}
                />
                <Label htmlFor="combine" className="text-navy">
                  Combine with delivery (Save $10) - Schedule delivery for same day
                </Label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-navy">Special Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Any special handling instructions, access codes, or notes for our team..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary and Submit */}
      {canSubmit && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-navy">Service Summary</h3>
                <p className="text-sm text-gray-regent">
                  {selectedItems.length} items • {format(parseISO(selectedDate), 'MMM d, yyyy')} • {selectedTimeSlot}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-navy">
                  ${(estimations.cost - estimations.savings).toFixed(0)}
                </div>
                <div className="text-sm text-gray-regent">
                  Estimated {estimations.time} minutes
                </div>
              </div>
            </div>

            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You'll receive email confirmation and SMS updates about your {type} appointment.
                Our team will arrive within your selected time window.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-teal text-navy hover:bg-teal-medium"
              size="lg"
            >
              {isLoading ? 'Scheduling...' : `Confirm ${type === 'pickup' ? 'Pickup' : 'Delivery'}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}