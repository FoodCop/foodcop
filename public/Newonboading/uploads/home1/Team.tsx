import Image from 'next/image';
import Link from 'next/link';

export default function TeamSection() {
  return (
    <section className="team-section pt-120 pb-90">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            {/*== Section Title ===*/}
            <div className="section-title text-center mb-60 wow fadeInDown">
              <span className="sub-title">
                <i className="flaticon-food-tray"></i>Our Special Chefs
              </span>
              <h2>Introducing Our Culinary Masters</h2>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          {[
            { name: 'David Liam', position: 'CEO', img: 'team-14.jpg' },
            { name: 'Alex Mika', position: 'Excutive Chef', img: 'team-15.jpg' },
            { name: 'John Smith', position: 'Excutive Chef', img: 'team-16.jpg' },
          ].map((member, index) => (
            <div className="col-lg-4 col-md-6 col-sm-12" key={index}>
              {/*== Team Item ===*/}
              <div className="team-item style-three mb-40 wow fadeInUp">
                <div className="member-image">
                  <Image
                    src={`/assets/images/team/${member.img}`}
                    alt="Member Image"
                    width={370}
                    height={370}
                  />
                  <div className="hover-content">
                    <div className="social-box">
                      <ul className="social-link">
                        <li>
                        <a href="https://facebook.com" target="_blank"><i className="fab fa-facebook-f"></i></a>
                      </li>
                      <li>
                        <a href="https://x.com/" target="_blank"><i className="fab fa-twitter"></i></a>
                      </li>
                      <li>
                        <a href="https://www.linkedin.com/" target="_blank"><i className="fab fa-linkedin-in"></i></a>
                      </li>
                      <li>
                        <a href="https://www.pinterest.com/" target="_blank"><i className="fab fa-pinterest-p"></i></a>
                      </li>
                      </ul>
                    </div>
                    <div className="member-info">
                      <h4 className="title">{member.name}</h4>
                      <span className="position">{member.position}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
