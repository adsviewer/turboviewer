import { type Metadata } from 'next';
import { type ReactNode } from 'react';
import BlogData from '@/components/Blog/blog-data';
import BlogItem from '@/components/Blog/blog-item';

export const metadata: Metadata = {
  title: 'Blog Page - Solid SaaS Boilerplate',
  description: 'This is Blog page for Solid Pro',
  // other metadata
};

function BlogPage(): ReactNode {
  return (
    <>
      {/* <!-- ===== Blog Grid Start ===== --> */}
      <section className="py-20 lg:py-25 xl:py-30">
        <div className="mx-auto mt-15 max-w-c-1280 px-4 md:px-8 xl:mt-20 xl:px-0">
          <div className="grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {BlogData.map((post) => (
              <BlogItem key={post.id} blog={post} />
            ))}
          </div>
        </div>
      </section>
      {/* <!-- ===== Blog Grid End ===== --> */}
    </>
  );
}

export default BlogPage;
