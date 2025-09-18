import { CheckCircle, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useGoogleTag } from "@/hooks/useGoogleTag";

const ThankYou = () => {
  const { trackConversion, isConfigured } = useGoogleTag();

  useEffect(() => {
    // Track conversion when thank you page loads
    if (isConfigured) {
      trackConversion();
    }
  }, [trackConversion, isConfigured]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="p-8 bg-card border shadow-lg">
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Thank You!
                </h1>
                <p className="text-xl text-muted-foreground">
                  Your cash offer request has been successfully submitted.
                </p>
              </div>

              <div className="bg-primary/10 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-center space-x-2 text-primary">
                  <Phone className="w-6 h-6" />
                  <span className="text-2xl font-bold">(555) 123-CASH</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>We'll reach out to you shortly via telephone to discuss your cash offer</span>
                </div>
              </div>

              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  Our team will contact you within <strong>4 hours</strong> during business hours 
                  to provide you with a fair cash offer for your property.
                </p>
                
                <div className="pt-6">
                  <Button asChild variant="outline" className="mr-4">
                    <Link to="/">Return to Homepage</Link>
                  </Button>
                  <Button asChild>
                    <a href="tel:(555)123-2274">Call Us Now</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYou;