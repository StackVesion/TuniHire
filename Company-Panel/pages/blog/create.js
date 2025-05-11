import React from 'react';
import Layout from '../../components/layout/Layout';
import BlogForm from '../../components/Blog/BlogForm';

export default function CreateBlog() {
  return (
    <Layout>
      <main className="main">
        <section className="section-box mt-50">
          <div className="container">
            <div className="row">
              <div className="col-lg-12">
                <BlogForm />
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
} 