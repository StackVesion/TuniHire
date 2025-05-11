import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import BlogForm from '../../../components/Blog/BlogForm';

export default function EditBlog() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <Layout>
      <main className="main">
        <section className="section-box mt-50">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                {id && <BlogForm blogId={id} />}
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
} 