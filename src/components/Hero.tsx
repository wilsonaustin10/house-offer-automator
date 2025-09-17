import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-house.jpg";
import { CheckCircle2, Clock, DollarSign } from "lucide-react";

const Hero = () => {
  return (
    <section className="hero-section relative min-h-[40vh] flex items-center py-8 text-white">
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
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className="urgency-button text-lg font-bold px-8 py-4 rounded-xl"
                onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get My Cash Offer Now
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg font-semibold px-8 py-4 rounded-xl"
                onClick={() => window.open('tel:+15551234567')}
              >
                Call (555) 123-CASH
              </Button>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-white/80">
              <span>★★★★★ 500+ Happy Homeowners</span>
              <span>•</span>
              <span>No Obligation • 100% Free</span>
            </div>
          </div>
          
          <div className="lg:block hidden">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Beautiful family home - we buy houses for cash"
                className="rounded-2xl shadow-2xl w-full h-auto max-h-96 object-cover"
                loading="eager"
              />
              <div className="absolute -bottom-4 -right-4 bg-urgency text-urgency-foreground p-4 rounded-xl font-bold shadow-lg">
                <div className="text-2xl">24HR</div>
                <div className="text-sm">Cash Offers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;