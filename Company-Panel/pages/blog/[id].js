import React from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import BlogDetail from '../../components/Blog/BlogDetail';

export default function BlogDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <Layout>
      <main className="main">
        <section className="section-box mt-50">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                {id && <BlogDetail blogId={id} />}
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
} 