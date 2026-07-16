import Link from 'next/link';

export default function CategorySection() {
  const categories = [
    {
      icon: 'flaticon-burger',
      title: 'Delish Burger',
      items: '25 items',
      delay: '.3s',
    },
    {
      icon: 'flaticon-sandwich-1',
      title: 'Sandwiches',
      items: '20 items',
      delay: '.4s',
    },
    {
      icon: 'flaticon-shrimp',
      title: 'Mexican Cuisine',
      items: '30 items',
      delay: '.5s',
    },
    {
      icon: 'flaticon-pasta',
      title: 'Italian Cuisine',
      items: '19 items',
      delay: '.6s',
    },
  ];

  return (
    <section className="category-section pt-130">
      <div className="container">
        {/*=== Section Header ===*/}
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="section-title mb-50 wow fadeInUp">
              <h2>Our Categories</h2>
            </div>
          </div>
          <div className="col-md-6">
            <div className="category-button float-md-end mb-50 wow fadeInDown">
              <Link href="/menu-v3" className="theme-btn style-two">
                See More
              </Link>
            </div>
          </div>
        </div>

        {/*=== Category Grid ===*/}
        <div className="row">
          {categories.map((cat, index) => (
            <div key={index} className="col-xl-3 col-md-6 col-sm-12">
              <Link
                href="/menu-v3"
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
