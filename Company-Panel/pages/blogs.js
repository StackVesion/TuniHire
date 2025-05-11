import React from 'react';
import Layout from '../components/layout/Layout';
import BlogList from '../components/Blog/BlogList';

export default function Blogs() {
  return (
    <Layout>
      <main className="main">
        <section className="section-box mt-50">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <BlogList />
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
} 