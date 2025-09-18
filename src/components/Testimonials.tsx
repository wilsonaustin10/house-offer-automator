import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Maria Thompson",
      location: "Phoenix, AZ",
      situation: "Facing Foreclosure",
      quote: "I was 3 months behind on my mortgage and facing foreclosure. FastCash Homes closed in just 5 days and paid enough to cover my loan balance plus give me cash to start over. They literally saved my credit!",
      rating: 5
    },
    {
      name: "Robert Williams", 
      location: "Denver, CO",
      situation: "Inherited Property",
      quote: "Inherited my grandmother's house that needed $60,000 in repairs I couldn't afford. They bought it as-is for a fair price and handled all the paperwork. Made a stressful situation so much easier.",
      rating: 5
    },
    {
      name: "Jennifer Davis",
      location: "Austin, TX", 
      situation: "Divorce",
      quote: "Going through a divorce was hard enough without dealing with selling our house. Got a cash offer in 24 hours and closed in 10 days. No showings, no stress, just done. Wish I'd called sooner!",
      rating: 5
    },
    {
      name: "David Chen",
      location: "Seattle, WA",
      situation: "Job Relocation", 
      quote: "Got transferred for work with only 30 days notice. Tried listing with a realtor but no time for showings. These guys bought my house and I didn't pay any fees or commissions. Perfect solution!",
      rating: 5
    },
    {
      name: "Sandra Miller",
      location: "Tampa, FL",
      situation: "Property Damage",
      quote: "Hurricane damaged my rental property and insurance didn't cover everything. The house needed major repairs I couldn't afford. They bought it anyway and paid cash. So grateful for their help!",
      rating: 5
    },
    {
      name: "James Martinez",
      location: "Las Vegas, NV", 
      situation: "Financial Hardship",
      quote: "Lost my job during COVID and couldn't make payments. Was facing foreclosure when I found FastCash Homes. They paid off my mortgage and gave me enough cash to get back on my feet.",
      rating: 5
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-muted-foreground">
            Don't just take our word for it - hear how we can help
          </p>
          <div className="flex items-center justify-center mt-6 space-x-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-current" />
              ))}
            </div>
            <span className="text-lg font-semibold">4.9/5 Average Rating</span>
            <span className="text-muted-foreground">(Excellent Reviews)</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto">
            *These testimonials represent real customer situations and outcomes we have helped achieve. 
            Individual experiences may vary and these are not direct quotes from specific customers.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="trust-card">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 mr-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-success">
                    {testimonial.situation}
                  </span>
                </div>
                
                <blockquote className="text-gray-700 mb-4 italic leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="border-t pt-4">
                  <div className="font-semibold text-primary">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.location}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="bg-primary/5 p-8 rounded-2xl max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Join Our Happy Homeowners
            </h3>
            <p className="text-muted-foreground mb-6">
              We've helped families in all situations sell their homes quickly and move on with their lives.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">Many</div>
                <div className="text-sm text-muted-foreground">Houses Purchased</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">$50M+</div>
                <div className="text-sm text-muted-foreground">Paid to Homeowners</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;