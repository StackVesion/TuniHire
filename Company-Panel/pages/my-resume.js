import Layout from "@/components/layout/Layout"

export default function Home() {
    return (
        <>
            <Layout breadcrumbTitle="My Profile" breadcrumbActive="My Profile">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="section-box">
                        <div className="container">
                            <div className="panel-white mb-30">
                            <div className="box-padding">
                                <h5>Update your CV</h5>
                                <div className="row mt-30">
                                <div className="col-lg-6 col-md-6">
                                    <div className="form-group mb-30">
                                    <div className="box-upload">
                                        <div className="add-file-upload">
                                        <input className="fileupload" type="file" name="file" />
                                        </div>
                                        <a className="btn btn-default">Upload File</a>
                                    </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-6">
                                    <div className="form-group mb-30 d-flex align-items-center box-file-uploaded">
                                    <span>Job_required.pdf</span>
                                    <a className="btn btn-delete">Delete</a>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                            <div className="panel-white mb-30">
                            <div className="box-padding">
                                <h5 className="icon-edu">Education</h5>
                                <div className="row mt-30">
                                <div className="col-lg-9">
                                    <div className="row">
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            From
                                        </label>
                                        <input
                                            className="form-control"
                                            type="date"
                                            data-date-format="DD MMMM YYYY"
                                            data-date="17 September 2022"
                                            defaultValue="2022-09-20"
                                            placeholder="12 September 2008"
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            To
                                        </label>
                                        <input
                                            className="form-control"
                                            type="date"
                                            data-date-format="DD MMMM YYYY"
                                            data-date="17 September 2022"
                                            defaultValue="2022-09-20"
                                            placeholder="12 September 2008"
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Description
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="message"
                                            rows={5}
                                            defaultValue={
                                            " Product Designer - Spotify Inc\n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a ipsum tellus. Interdum et malesuada fames ac ante\n ipsum primis in faucibus\n "
                                            }
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="form-group mt-10">
                                        <button className="btn btn-default btn-brand icon-tick">
                                            Add Timeline
                                        </button>
                                        </div>
                                    </div>
                                    </div>
                                    <div className="box-timeline mt-50">
                                    <div className="item-timeline">
                                        <div className="timeline-year">

                                        <span>2008 - 2012</span>
                                        </div>
                                        <div className="timeline-info">
                                        <h5 className="color-brand-1 mb-20">
                                            National Design Academy
                                        </h5>
                                        <p className="color-text-paragraph-2 mb-15">
                                            Lorem ipsum dolor sit amet, consectetur dipiscing elit.
                                            Proin a ipsum tellus. Interdum et malesuada fames ac
                                            ante ipsum primis in faucibus.
                                        </p>
                                        </div>
                                        <div className="timeline-actions">

                                        <a className="btn btn-editor" />
                                        <a className="btn btn-remove" />
                                        </div>
                                    </div>
                                    <div className="item-timeline">
                                        <div className="timeline-year">

                                        <span>2012 - 2014</span>
                                        </div>
                                        <div className="timeline-info">
                                        <h5 className="color-brand-1 mb-20">
                                            University of Oxford
                                        </h5>
                                        <p className="color-text-paragraph-2 mb-15">
                                            Lorem ipsum dolor sit amet, consectetur dipiscing elit.
                                            Proin a ipsum tellus. Interdum et malesuada fames ac
                                            ante ipsum primis in faucibus.
                                        </p>
                                        </div>
                                        <div className="timeline-actions">

                                        <a className="btn btn-editor" />
                                        <a className="btn btn-remove" />
                                        </div>
                                    </div>
                                    <div className="item-timeline">
                                        <div className="timeline-year">

                                        <span>2014 - 2016</span>
                                        </div>
                                        <div className="timeline-info">
                                        <h5 className="color-brand-1 mb-20">
                                            California Institute of Technology
                                        </h5>
                                        <p className="color-text-paragraph-2 mb-15">
                                            Lorem ipsum dolor sit amet, consectetur dipiscing elit.
                                            Proin a ipsum tellus. Interdum et malesuada fames ac
                                            ante ipsum primis in faucibus.
                                        </p>
                                        </div>
                                        <div className="timeline-actions">

                                        <a className="btn btn-editor" />
                                        <a className="btn btn-remove" />
                                        </div>
                                    </div>
                                    <div className="item-timeline">
                                        <div className="timeline-year">

                                        <span>2016 - Now</span>
                                        </div>
                                        <div className="timeline-info">
                                        <h5 className="color-brand-1 mb-20">
                                            Stanford University
                                        </h5>
                                        <p className="color-text-paragraph-2 mb-15">
                                            Lorem ipsum dolor sit amet, consectetur dipiscing elit.
                                            Proin a ipsum tellus. Interdum et malesuada fames ac
                                            ante ipsum primis in faucibus.
                                        </p>
                                        </div>
                                        <div className="timeline-actions">

                                        <a className="btn btn-editor" />
                                        <a className="btn btn-remove" />
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                            <div className="panel-white mb-30">
                            <div className="box-padding">
                                <h5 className="icon-edu">Work &amp; Experience</h5>
                                <div className="row mt-30">
                                <div className="col-lg-9">
                                    <div className="row">
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            From
                                        </label>
                                        <input
                                            className="form-control"
                                            type="date"
                                            data-date-format="DD MMMM YYYY"
                                            data-date="17 September 2022"
                                            defaultValue="2022-09-20"
                                            placeholder="12 September 2008"
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            To
                                        </label>
                                        <input
                                            className="form-control"
                                            type="date"
                                            data-date-format="DD MMMM YYYY"
                                            data-date="17 September 2022"
                                            defaultValue="2022-09-20"
                                            placeholder="12 September 2008"
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Description
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="message"
                                            rows={5}
                                            defaultValue={
                                            " Product Designer - Spotify Inc.\n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin a ipsum tellus. Interdum et malesuada fames ac ante\n psum primis in faucibus\n                              "
                                            }
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="form-group mt-10">
                                        <button className="btn btn-default btn-brand icon-tick">
                                            Add Timeline
                                        </button>
                                        </div>
                                    </div>
                                    </div>
                                    <div className="box-timeline mt-50">
                                    <div className="item-timeline">
                                        <div className="timeline-year">

                                        <span>2008 - 2012</span>
                                        </div>
                                        <div className="timeline-info">
                                        <h5 className="color-brand-1 mb-20">
                                            Samoo Architects &amp; Engineers
                                        </h5>
                                        <p className="color-text-paragraph-2 mb-15">
                                            Lorem ipsum dolor sit amet, consectetur dipiscing elit.
                                            Proin a ipsum tellus. Interdum et malesuada fames ac
                                            ante ipsum primis in faucibus.
                                        </p>
                                        </div>
                                        <div className="timeline-actions">

                                        <a className="btn btn-editor" />
                                        <a className="btn btn-remove" />
                                        </div>
                                    </div>
                                    <div className="item-timeline">
                                        <div className="timeline-year">

                                        <span>2012 - 2014</span>
                                        </div>
                                        <div className="timeline-info">
                                        <h5 className="color-brand-1 mb-20">
                                            Foster &amp; Partners
                                        </h5>
                                        <p className="color-text-paragraph-2 mb-15">
                                            Lorem ipsum dolor sit amet, consectetur dipiscing elit.
                                            Proin a ipsum tellus. Interdum et malesuada fames ac
                                            ante ipsum primis in faucibus.
                                        </p>
                                        </div>
                                        <div className="timeline-actions">

                                        <a className="btn btn-editor" />
                                        <a className="btn btn-remove" />
                                        </div>
                                    </div>
                                    <div className="item-timeline">
                                        <div className="timeline-year">

                                        <span>2014 - 2016</span>
                                        </div>
                                        <div className="timeline-info">
                                        <h5 className="color-brand-1 mb-20">
                                            Skidmore Owings &amp; Merrill
                                        </h5>
                                        <p className="color-text-paragraph-2 mb-15">
                                            Lorem ipsum dolor sit amet, consectetur dipiscing elit.
                                            Proin a ipsum tellus. Interdum et malesuada fames ac
                                            ante ipsum primis in faucibus.
                                        </p>
                                        </div>
                                        <div className="timeline-actions">

                                        <a className="btn btn-editor" />
                                        <a className="btn btn-remove" />
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    )
}