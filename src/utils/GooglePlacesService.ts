interface GooglePlacesService {
  initializeAutocomplete: (input: HTMLInputElement, onPlaceSelect: (place: google.maps.places.PlaceResult) => void) => google.maps.places.Autocomplete | null;
  loadGoogleMapsScript: (apiKey: string) => Promise<void>;
}

export class GooglePlaces implements GooglePlacesService {
  private static instance: GooglePlaces;
  private isScriptLoaded = false;
  private scriptPromise: Promise<void> | null = null;

  static getInstance(): GooglePlaces {
    if (!GooglePlaces.instance) {
      GooglePlaces.instance = new GooglePlaces();
    }
    return GooglePlaces.instance;
  }

  async loadGoogleMapsScript(apiKey: string): Promise<void> {
    if (this.isScriptLoaded) {
      return;
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && window.google) {
        this.isScriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }

  initializeAutocomplete(
    input: HTMLInputElement, 
    onPlaceSelect: (place: google.maps.places.PlaceResult) => void
  ): google.maps.places.Autocomplete | null {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps Places API not loaded');
      return null;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['address'],
      componentRestrictions: { country: 'US' },
      fields: ['formatted_address', 'address_components', 'place_id']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        onPlaceSelect(place);
      }
    });

    return autocomplete;
  }
}

export const googlePlacesService = GooglePlaces.getInstance();