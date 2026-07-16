import Banner from "@/components/home1/Banner";
import Category from "@/components/home1/Category";
import About from "@/components/home1/About";
import Offer from "@/components/home1/Offer";
import Whychoose from "@/components/home1/Whychoose";
import Booking from "@/components/home1/Booking";
import Menu from "@/components/home1/Menu";
import Gallery from "@/components/home1/Gallery";
import Team from "@/components/home1/Team";
import Testimonial from "@/components/home1/Testimonial";
import Blog from "@/components/home1/Blog";
import Footer from "@/components/footer/Footer1";

export default function Home() {
  return (
    <div className="home-one">
      <Banner />
      <Category />
      <About />
      <Offer />
      <Whychoose />
      <Booking />
      <Menu />
      <Gallery />
      <Team />
      <Testimonial />
      <Blog />
      <Footer />
    </div>
  );
}
