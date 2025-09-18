import Header from "@/components/Header";
import Hero from "@/components/Hero"; 
import Benefits from "@/components/Benefits";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Benefits />
      <Testimonials />
      <Footer />
    </div>
  );
};

export default Index;
