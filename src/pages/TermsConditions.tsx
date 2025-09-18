import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-primary mb-8">Terms & Conditions</h1>
          <p className="text-muted-foreground mb-8">Last Updated: September 18, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using the FastCash Homes website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">2. Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              FastCash Homes provides real estate purchasing services. We purchase residential properties for cash. All offers are subject to property inspection and verification of ownership.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">3. No Obligation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Submitting information through our website or contacting us does not create any obligation for you to sell your property or for us to purchase it. All offers are preliminary until a formal purchase agreement is signed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">4. Communication Consent</h2>
            <p className="text-muted-foreground leading-relaxed">
              By providing your contact information, you consent to receive communications from FastCash Homes via phone, email, and text message regarding your property and our services. You may opt out at any time by following the unsubscribe instructions in our communications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">5. Accuracy of Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to provide accurate and complete information about your property. Any misrepresentation may void any offers or agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              FastCash Homes shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-primary mb-4">7. Contact Information</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="font-semibold text-primary mb-2">FastCash Homes</p>
              <p className="text-muted-foreground mb-1">Email: info@fastcashhomes.com</p>
              <p className="text-muted-foreground">Phone: (555) 123-CASH</p>
            </div>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TermsConditions;