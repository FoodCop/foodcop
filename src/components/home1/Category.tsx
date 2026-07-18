import Link from 'next/link';

export default function CategorySection() {
  const categories = [
    {
      icon: 'fas fa-search',
      title: 'Discover',
      items: 'Curated Feeds',
      delay: '.3s',
      link: '/bites',
    },
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Explore',
      items: 'Local Places',
      delay: '.4s',
      link: '/scout',
    },
    {
      icon: 'fas fa-video',
      title: 'Create',
      items: 'Snaps & AI Studio',
      delay: '.5s',
      link: '/profile',
    },
    {
      icon: 'fas fa-comments',
      title: 'Connect',
      items: 'Social & Chat',
      delay: '.6s',
      link: '/profile',
    },
  ];

  return (
    <section className="category-section pt-130">
      <div className="container">
        {/*=== Section Header ===*/}
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="section-title mb-50 wow fadeInUp">
              <h2>Core Pillars</h2>
            </div>
          </div>
          <div className="col-md-6">
            <div className="category-button float-md-end mb-50 wow fadeInDown">
              <Link href="/discover" className="theme-btn style-two">
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/*=== Category Grid ===*/}
        <div className="row">
          {categories.map((cat, index) => (
            <div key={index} className="col-xl-3 col-md-6 col-sm-12">
              <Link
                href={cat.link}
                className={`iconic-box style-four mb-40 wow fadeInUp`}
                data-wow-delay={cat.delay}
              >
                <div className="icon">
                  <i className={cat.icon}></i>
                </div>
                <div className="content">
                  <h4 className="title">{cat.title}</h4>
                  <span>{cat.items}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
