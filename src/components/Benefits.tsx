import { Card, CardContent } from "@/components/ui/card";
import { 
  DollarSign, 
  Clock, 
  Home, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  Users,
  FileText
} from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: <DollarSign className="w-8 h-8 text-urgency" />,
      title: "Cash Offer in 24 Hours",
      description: "Get a fair, no-obligation cash offer for your property within one business day. No waiting, no uncertainty."
    },
    {
      icon: <Clock className="w-8 h-8 text-urgency" />,
      title: "Close in 7 Days",
      description: "Skip the traditional selling process and close in as little as 7 days, or choose your own timeline."
    },
    {
      icon: <Home className="w-8 h-8 text-urgency" />,
      title: "No Repairs Needed",
      description: "We buy houses as-is. Fire damage, foundation issues, or perfect condition - we buy it all."
    },
    {
      icon: <XCircle className="w-8 h-8 text-urgency" />,
      title: "Zero Fees or Commissions",
      description: "Keep more money in your pocket - no agent fees, no closing costs, no hidden charges."
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-urgency" />,
      title: "Complex Situations Solved",
      description: "Messy titles, liens, estate issues, or other complications? We specialize in closing deals others can't."
    },
    {
      icon: <Calendar className="w-8 h-8 text-urgency" />,
      title: "You Pick Closing Date",
      description: "Need time to move? We work on YOUR schedule, not ours. Close when it's convenient for you."
    },
    {
      icon: <Users className="w-8 h-8 text-urgency" />,
      title: "Local Family Business",
      description: "We're not some big corporation. We're your neighbors, and we treat you like family."
    },
    {
      icon: <FileText className="w-8 h-8 text-urgency" />,
      title: "We Handle Everything",
      description: "We take care of all paperwork, inspections, and legal requirements. You just show up to closing."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Why Choose FastCash Homes?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We've helped many homeowners sell their properties quickly and easily. 
            Here's what makes us different from traditional real estate.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card key={index} className="trust-card border-2 hover:border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-bold text-primary mb-3">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="bg-gray-50 p-8 rounded-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-4">
              We Buy Houses in Any Situation
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-base">
              <div className="text-foreground font-semibold">• Facing Foreclosure</div>
              <div className="text-foreground font-semibold">• Inherited Property</div>
              <div className="text-foreground font-semibold">• Divorce Settlement</div>
              <div className="text-foreground font-semibold">• Job Relocation</div>
              <div className="text-foreground font-semibold">• Financial Hardship</div>
              <div className="text-foreground font-semibold">• Bad Tenants</div>
              <div className="text-foreground font-semibold">• Medical Bills</div>
              <div className="text-foreground font-semibold">• Any Other Reason</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;