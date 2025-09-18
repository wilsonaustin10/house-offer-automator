import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const About = () => {
  const scrollToLeadForm = () => {
    window.location.href = "/#lead-form";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-primary mb-8">About Us</h1>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-primary mb-6">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              At FastCash Homes, we're more than just property investors – we're a team of wholesome family men with a genuine passion for helping families navigate through difficult situations. We understand that life can throw unexpected challenges your way, and selling your home quickly might be necessary during these times.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Each member of our team brings not only professional expertise in real estate and property renovation but also personal understanding of the importance of home and family. We've dedicated ourselves to creating a compassionate, transparent, and efficient process that puts your needs first.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-primary mb-6">What We Do</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We specialize in purchasing distressed properties and transforming them into beautiful homes that enhance neighborhoods and communities. Our team takes pride in our craftsmanship and attention to detail, ensuring that each property we touch is given new life and purpose.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Beyond the business aspect, we find fulfillment in helping families move forward from challenging circumstances. Whether you're facing foreclosure, dealing with an inherited property, going through a divorce, or simply need to relocate quickly, we offer a helping hand and a fair cash offer with no strings attached.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-primary mb-6">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-primary mb-3">Integrity</h3>
                <p className="text-muted-foreground">
                  We believe in honest, transparent dealings in every transaction.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-primary mb-3">Compassion</h3>
                <p className="text-muted-foreground">
                  We approach each situation with empathy and understanding.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-primary mb-3">Excellence</h3>
                <p className="text-muted-foreground">
                  We strive for the highest quality in both customer service and property renovation.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-primary mb-3">Community</h3>
                <p className="text-muted-foreground">
                  We're committed to improving neighborhoods and supporting local communities.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-semibold text-primary mb-6">How It Works</h2>
            <div className="bg-primary/5 p-8 rounded-lg text-center">
              <h3 className="text-2xl font-semibold text-primary mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                Get your cash offer today – it's fast, easy, and completely obligation-free.
              </p>
              <Button 
                onClick={scrollToLeadForm}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                Get Your Cash Offer Today
              </Button>
            </div>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default About;