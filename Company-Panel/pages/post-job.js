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
                            <div className="box-padding bg-postjob">
                                <h5 className="icon-edu">Tell us about your role</h5>
                                <div className="row mt-30">
                                <div className="col-lg-9">
                                    <div className="row">
                                    <div className="col-lg-12">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Job title *
                                        </label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            placeholder="e.g. Senior Product Designer"
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Add your job description *
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="message"
                                            rows={8}
                                            defaultValue={
                                            " Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at sem id enim suscipit commodo nec in ante. Sed viverra vel leo vitae pharetra. Morbi viverra venenatis neque, eu porttitor diam blandit nec. Etiam et volutpat magna, id molestie quam. Vestibulum vel libero gravida, scelerisque arcu eu, maximus mi. Suspendisse eu dolor lobortis, posuere enim venenatis, posuere quam.\n\n                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at sem id enim suscipit commodo nec in ante. Sed viverra vel leo vitae pharetra. Morbi viverra venenatis neque, eu porttitor diam blandit nec. Etiam et volutpat magna, id molestie quam. Vestibulum vel libero gravida, scelerisque arcu eu, maximus mi. Suspendisse eu dolor lobortis, posuere enim venenatis, posuere quam."
                                            }
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Job location
                                        </label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            placeholder='e.g. "New York City" or "San Francisco”'
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Workplace type *
                                        </label>
                                        <select className="form-control">
                                            <option value={1}>Remote</option>
                                            <option value={1}>Office</option>
                                        </select>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Salary
                                        </label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            placeholder="$2200 - $2500"
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <label className="font-sm color-text-mutted mb-10">
                                            Tags (optional)
                                        </label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            placeholder="Figma, UI/UX, Sketch..."
                                        />
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30">
                                        <div className="box-upload">
                                            <div className="add-file-upload">
                                            <input
                                                className="fileupload"
                                                type="file"
                                                name="file"
                                            />
                                            </div>
                                            <a className="btn btn-default">Upload File</a>
                                        </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6">
                                        <div className="form-group mb-30 box-file-uploaded d-flex align-items-center">
                                        <span>Job_required.pdf</span>
                                        <a className="btn btn-delete">Delete</a>
                                        </div>
                                    </div>
                                    <div className="col-lg-12">
                                        <div className="form-group mt-10">
                                        <button className="btn btn-default btn-brand icon-tick">
                                            Post New Job
                                        </button>
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