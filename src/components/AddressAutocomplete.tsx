import { useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const loadGooglePlacesService = useCallback(async () => {
    const { googlePlacesService } = await import('@/utils/GooglePlacesService');
    return googlePlacesService;
  }, []);

  const initializeAutocomplete = useCallback(async () => {
    if (!inputRef.current || isInitialized || isLoading) return;

    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('Google Places API key not found. Set VITE_GOOGLE_PLACES_API_KEY in your environment variables.');
      return;
    }

    setIsLoading(true);
    
    try {
      const googlePlacesService = await loadGooglePlacesService();
      await googlePlacesService.loadGoogleMapsScript(apiKey);
      
      autocompleteRef.current = googlePlacesService.initializeAutocomplete(
        inputRef.current,
        (place: google.maps.places.PlaceResult) => {
          if (place.formatted_address) {
            onChange(place.formatted_address);
          }
        }
      );
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Google Places autocomplete:', error);
      toast({
        title: "Error",
        description: "Failed to load Google Places API. Please check your API key configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading, loadGooglePlacesService, onChange, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleInputFocus = () => {
    if (!isInitialized && !isLoading) {
      initializeAutocomplete();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address" className="flex items-center space-x-1 text-foreground">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
        <span>Property Address {required && '*'}</span>
      </Label>

      <div className="relative">
        <Input
          ref={inputRef}
          id="address"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          required={required}
          className={className}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressAutocomplete;