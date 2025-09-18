import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { googlePlacesService } from '@/utils/GooglePlacesService';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "123 Main St, City, State, ZIP",
  required = false,
  className = "h-12"
}: AddressAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (apiKey) {
      initializeAutocomplete(apiKey);
    } else {
      console.warn('Google Places API key not found. Set VITE_GOOGLE_PLACES_API_KEY in your environment variables.');
    }
  }, []);

  const initializeAutocomplete = async (key: string) => {
    if (!inputRef.current) return;

    try {
      await googlePlacesService.loadGoogleMapsScript(key);
      
      autocompleteRef.current = googlePlacesService.initializeAutocomplete(
        inputRef.current,
        (place: google.maps.places.PlaceResult) => {
          if (place.formatted_address) {
            onChange(place.formatted_address);
          }
        }
      );
    } catch (error) {
      console.error('Failed to initialize Google Places autocomplete:', error);
      toast({
        title: "Error",
        description: "Failed to load Google Places API. Please check your API key configuration.",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address" className="flex items-center space-x-1 text-foreground">
        <MapPin className="w-4 h-4" />
        <span>Property Address {required && '*'}</span>
      </Label>

      <Input
        ref={inputRef}
        id="address"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        required={required}
        className={className}
      />
    </div>
  );
};

export default AddressAutocomplete;