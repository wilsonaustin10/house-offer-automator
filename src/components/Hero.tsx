import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-house.jpg";
import { CheckCircle2, Clock, DollarSign, MapPin, Phone, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

const Hero = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    smsConsent: false,
    isListed: '',
    condition: '',
    timeline: '',
    askingPrice: '',
    firstName: '',
    lastName: '',
    email: ''
  });
  const { toast } = useToast();

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Form Submitted Successfully!",
      description: "We'll contact you within 4 hours with your cash offer.",
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.address.trim() && formData.phone.trim() && formData.smsConsent;
      case 2:
        return formData.isListed !== '';
      case 3:
        return formData.condition && formData.timeline && formData.askingPrice.trim();
      case 4:
        return formData.firstName.trim() && formData.lastName.trim() && formData.email.trim();
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center mb-4 text-foreground">Property Details</h3>
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center space-x-1 text-foreground">
                <MapPin className="w-4 h-4" />
                <span>Property Address *</span>
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Main St, City, State, ZIP"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-1 text-foreground">
                <Phone className="w-4 h-4" />
                <span>Phone Number *</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="flex items-start space-x-2 mt-4">
              <input
                type="checkbox"
                id="smsConsent"
                checked={formData.smsConsent}
                onChange={(e) => handleInputChange('smsConsent', e.target.checked)}
                className="mt-1"
              />
              <Label htmlFor="smsConsent" className="text-sm text-muted-foreground">
                I consent to receive text messages about my cash offer. Standard message rates may apply.
              </Label>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center mb-4 text-foreground">Property Status</h3>
            <div className="space-y-3">
              <Label className="text-base text-foreground">Is your property currently listed with a real estate agent?</Label>
              <RadioGroup
                value={formData.isListed}
                onValueChange={(value) => handleInputChange('isListed', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="listed-yes" />
                  <Label htmlFor="listed-yes" className="text-foreground">Yes, it's currently listed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="listed-no" />
                  <Label htmlFor="listed-no" className="text-foreground">No, it's not listed</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center mb-4 text-foreground">Property Information</h3>
            <div className="space-y-2">
              <Label className="text-foreground">Property Condition</Label>
              <RadioGroup
                value={formData.condition}
                onValueChange={(value) => handleInputChange('condition', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor" id="condition-poor" />
                  <Label htmlFor="condition-poor" className="text-foreground">Poor (needs major repairs)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fair" id="condition-fair" />
                  <Label htmlFor="condition-fair" className="text-foreground">Fair (some repairs needed)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id="condition-good" />
                  <Label htmlFor="condition-good" className="text-foreground">Good (minor repairs)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="excellent" id="condition-excellent" />
                  <Label htmlFor="condition-excellent" className="text-foreground">Excellent (move-in ready)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label className="text-foreground">How quickly do you need to sell?</Label>
              <RadioGroup
                value={formData.timeline}
                onValueChange={(value) => handleInputChange('timeline', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="asap" id="timeline-asap" />
                  <Label htmlFor="timeline-asap" className="text-foreground">ASAP (within 2 weeks)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="30days" id="timeline-30" />
                  <Label htmlFor="timeline-30" className="text-foreground">30 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="60days" id="timeline-60" />
                  <Label htmlFor="timeline-60" className="text-foreground">60 days</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="90days" id="timeline-90" />
                  <Label htmlFor="timeline-90" className="text-foreground">90 days</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="askingPrice" className="text-foreground">What's your asking price? (optional)</Label>
              <Input
                id="askingPrice"
                type="text"
                placeholder="$250,000"
                value={formData.askingPrice}
                onChange={(e) => handleInputChange('askingPrice', e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center mb-4 text-foreground">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Smith"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className="h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.smith@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="h-12"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="lead-form" className="hero-section relative min-h-[40vh] flex items-center py-8 text-white">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="success-badge px-3 py-1 rounded-full text-sm font-semibold">
                  ✓ A+ BBB Rating
                </div>
                <div className="success-badge px-3 py-1 rounded-full text-sm font-semibold">
                  ✓ 10+ Years Local
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Sell Your House 
                <span className="block text-urgency">Fast for Cash</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
                Get a fair cash offer in 24 hours. No repairs, no fees, no hassles. 
                Close in as little as 7 days on your timeline.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 py-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-6 h-6 text-urgency" />
                <span className="font-semibold">Cash Offers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-6 h-6 text-urgency" />
                <span className="font-semibold">7-Day Closing</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-urgency" />
                <span className="font-semibold">Any Condition</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-white/80">
              <span>★★★★★ 500+ Happy Homeowners</span>
              <span>•</span>
              <span>No Obligation • 100% Free</span>
            </div>
          </div>
          
          <div className="max-w-md mx-auto lg:mx-0">
            <Card className="lead-form bg-background/95 backdrop-blur">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-primary mb-2">
                  Get Your FREE Cash Offer
                </CardTitle>
                <div className="flex justify-center items-center space-x-2 text-sm text-muted-foreground">
                  <span>Step {currentStep} of {totalSteps}</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`w-2 h-2 rounded-full ${
                          step <= currentStep ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {renderStep()}
                  
                  <div className="flex space-x-3 pt-4">
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                    )}
                    
                    {currentStep < totalSteps ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        className="flex-1"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={!isStepValid()}
                        className="flex-1 urgency-button font-bold"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Get My Cash Offer
                      </Button>
                    )}
                  </div>
                  
                  {currentStep === 4 && (
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      By submitting, you agree to receive text messages and calls. 
                      Your information is secure and will never be sold.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;