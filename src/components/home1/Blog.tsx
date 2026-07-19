import Image from 'next/image';
import Link from 'next/link';

export default function BlogSection() {
  const blogPosts = [
    {
      title: 'Introducing AI Recipe Studio',
      author: 'Fuzo Team',
      comments: 12,
      img: 'blog-17.jpg',
      description: 'Learn how to turn any culinary idea or fridge photo into a structured, step-by-step recipe instantly.',
      link: '/discover',
    },
    {
      title: 'How the Points Loop Works',
      author: 'Fuzo Team',
      comments: 8,
      img: 'blog-18.jpg',
      description: 'Discover how saving Bites and sharing Trims earns you points and levels up your creator status.',
      link: '/rewards',
    },
    {
      title: 'New Scout Features Released',
      author: 'Fuzo Team',
      comments: 24,
      img: 'blog-19.jpg',
      description: 'We just updated Scout! Now you can filter local spots based on your exact dietary preferences and saved tastes.',
      link: '/scout',
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
                <i className="fas fa-newspaper"></i> Platform News
              </span>
              <h2>Latest from FUZO</h2>
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
                      <Link href={post.link}>{`By ${post.author}`}</Link>
                    </span>
                    <span>
                      <i className="far fa-comment"></i>
                      <Link href={post.link}>{`Comment (${post.comments})`}</Link>
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
