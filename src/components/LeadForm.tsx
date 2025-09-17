import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Phone, Home, Clock } from "lucide-react";

const LeadForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    timeline: '',
    situation: ''
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to your backend
    toast({
      title: "Form Submitted Successfully!",
      description: "We'll contact you within 4 hours with your cash offer.",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="lead-form" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="lead-form">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-primary mb-2">
                Get Your FREE Cash Offer
              </CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Fill out the form below and we'll contact you within 4 hours with a fair, 
                no-obligation cash offer for your property.
              </CardDescription>
              
              <div className="flex justify-center space-x-8 mt-6 text-sm text-success font-semibold">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>24hr Response</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>No Pressure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Home className="w-4 h-4" />
                  <span>Any Condition</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-12"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="h-12"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>Property Address *</span>
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="123 Main St, City, State, ZIP"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeline">How quickly do you need to sell?</Label>
                  <select
                    id="timeline"
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleChange}
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select timeline</option>
                    <option value="asap">ASAP (Within 30 days)</option>
                    <option value="1-3months">1-3 months</option>
                    <option value="3-6months">3-6 months</option>
                    <option value="flexible">I'm flexible</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="situation">Tell us about your situation (optional)</Label>
                  <Textarea
                    id="situation"
                    name="situation"
                    placeholder="Facing foreclosure, inherited property, divorce, relocation, etc."
                    value={formData.situation}
                    onChange={handleChange}
                    className="min-h-[100px]"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="urgency-button w-full text-lg font-bold py-6 rounded-xl"
                >
                  Get My FREE Cash Offer Now
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  By submitting this form, you agree to receive text messages and calls from our team. 
                  Message and data rates may apply. Your information is secure and will never be sold.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LeadForm;