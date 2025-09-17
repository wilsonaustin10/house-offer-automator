import { Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-primary">
              FastCash Homes
            </div>
            <div className="hidden md:block text-sm text-muted-foreground">
              Licensed • Bonded • Local
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Phone className="w-4 h-4 text-primary" />
                <span className="font-semibold">(555) 123-CASH</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4 text-primary" />
                <span>info@fastcashhomes.com</span>
              </div>
            </div>
            
            <Button 
              className="urgency-button font-semibold px-6 py-2 rounded-lg"
              onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get Cash Offer
            </Button>
          </div>
        </div>
        
        {/* Mobile contact info */}
        <div className="md:hidden flex items-center justify-center space-x-4 text-sm mt-2 pt-2 border-t border-border">
          <div className="flex items-center space-x-1">
            <Phone className="w-4 h-4 text-primary" />
            <span className="font-semibold">(555) 123-CASH</span>
          </div>
          <div className="flex items-center space-x-1">
            <Mail className="w-4 h-4 text-primary" />
            <span>info@fastcashhomes.com</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;