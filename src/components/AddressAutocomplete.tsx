import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Settings } from 'lucide-react';
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
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedApiKey = localStorage.getItem('google_places_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsApiKeySet(true);
      initializeAutocomplete(savedApiKey);
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
        description: "Failed to load Google Places API. Please check your API key.",
        variant: "destructive"
      });
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('google_places_api_key', apiKey);
    setIsApiKeySet(true);
    setShowApiKeyInput(false);
    initializeAutocomplete(apiKey);
    
    toast({
      title: "Success",
      description: "Google Places API key saved successfully"
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="address" className="flex items-center space-x-1 text-foreground">
          <MapPin className="w-4 h-4" />
          <span>Property Address {required && '*'}</span>
        </Label>
        {!isApiKeySet && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Setup API
          </Button>
        )}
      </div>

      {showApiKeyInput && (
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <Label htmlFor="apiKey" className="text-sm font-medium">
            Google Places API Key
          </Label>
          <div className="flex space-x-2">
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google Places API key"
              className="flex-1"
            />
            <Button type="button" onClick={handleSaveApiKey} size="sm">
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your API key from the{' '}
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>
      )}

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
      
      {!isApiKeySet && (
        <p className="text-xs text-muted-foreground">
          Enable address autocomplete by setting up your Google Places API key
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;