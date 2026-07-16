import Image from 'next/image';
import Link from 'next/link';

export default function BlogSection() {
  const blogPosts = [
    {
      title: 'Crispy Stovetop Roosted Red Potatoes Foods',
      author: 'David',
      comments: 2,
      img: 'blog-17.jpg',
      description: 'Crispy stovetop red potatoes, seasoned to perfection, golden and delicious.',
      link: 'blog-details',
    },
    {
      title: 'How to make jimmy soft boiled eggs at home',
      author: 'David',
      comments: 2,
      img: 'blog-18.jpg',
      description: 'Make Jimmy soft-boiled eggs at home with tender whites and creamy yolks.',
      link: 'blog-details',
    },
    {
      title: 'Traditional soft pretzels with sweet beer cheese',
      author: 'David',
      comments: 2,
      img: 'blog-19.jpg',
      description: 'Warm, traditional soft pretzels served with rich, sweet beer cheese dip.',
      link: 'blog-details',
    },
  ];

  return (
    <section className="blog-section pt-130 pb-100">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            {/*=== Section Title ===*/}
            <div className="section-title text-center mb-55 wow fadeInDown">
              <span className="sub-title">
                <i className="flaticon-food-tray"></i>Our Latest Blog
              </span>
              <h2>Discover Our Latest Blog Posts</h2>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          {blogPosts.map((post, index) => (
            <div className="col-lg-4 col-md-6 col-sm-12" key={index}>
              {/*=== Blog Post Item ===*/}
              <div className="blog-post-item style-three mb-40 wow fadeInUp">
                <div className="post-thumbnail">
                  <Image
                    src={`/assets/images/blog/${post.img}`}
                    alt="Post Thumbnail"
                    width={370}
                    height={250}
                  />
                </div>
                <div className="post-content">
                  <div className="post-meta">
                    <span>
                      <i className="far fa-user-alt"></i>
                      <Link href="#">{`By ${post.author}`}</Link>
                    </span>
                    <span>
                      <i className="far fa-comment"></i>
                      <Link href="#">{`Comment (${post.comments})`}</Link>
                    </span>
                  </div>
                  <h4 className="title">
                    <Link href={post.link}>{post.title}</Link>
                  </h4>
                  <p>{post.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
