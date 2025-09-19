import { Card, CardContent } from "@/components/ui/card";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Tell us about your property",
      description: "It's quick, easy, and free!"
    },
    {
      number: "2", 
      title: "If it meets our buying criteria",
      description: "We will contact you to setup a quick appointment."
    },
    {
      number: "3",
      title: "We present you with a fair all-cash offer",
      description: "Or discuss the best method to proceed."
    },
    {
      number: "4",
      title: "We close at a local reputable title company", 
      description: "Have cash in your hands in as little as 7 days!"
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            How The Process Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Simple, fast, and straightforward - here's how we help you sell your house
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card key={index} className="text-center relative">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-primary mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;