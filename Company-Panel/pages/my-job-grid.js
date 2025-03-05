import GridView from "@/components/elements/GridView"
import ListView from "@/components/elements/ListView"
import Pagination from "@/components/filter/Pagination"
import ShowSelect from "@/components/filter/ShowSelect"
import Layout from "@/components/layout/Layout"
import BrandSlider from "@/components/slider/BrandSlider"
import { useEffect, useState } from "react"
import data from "../public/static/product"

export default function JobGrid() {
    const [sortType, setSortType] = useState('name')
    const [sortedData, setSortedData] = useState([])
    let [currentPage, setCurrentPage] = useState(1)
    let showLimit = 8,
        showPagination = 3

    let [pagination, setPagination] = useState([])
    let [limit, setLimit] = useState(showLimit)
    let [pages, setPages] = useState(Math.ceil(sortedData.length / limit))


    useEffect(() => {
        cratePagination();
        const sortArray = type => {
            const types = {
                title: 'title',
                date: 'date',
                salary: 'salary'
            }
            const sortProperty = types[type]
            const sorted = [...data].sort((a, b) => {
                if (sortProperty === 'date') {
                    return new Date(b[sortProperty]) - new Date(a[sortProperty])
                } else {
                    return a[sortProperty] > b[sortProperty] ? 1 : -1
                }
            })
            setSortedData(sorted)
        }
        sortArray(sortType)
    }, [limit, pages, sortedData.length, sortType]);

    const cratePagination = () => {
        // set pagination
        let arr = new Array(Math.ceil(sortedData.length / limit))
            .fill()
            .map((_, idx) => idx + 1);

        setPagination(arr);
        setPages(Math.ceil(sortedData.length / limit));
    };

    const startIndex = currentPage * limit - limit;
    const endIndex = startIndex + limit;

    const getPaginatedProducts = sortedData.slice(startIndex, endIndex);


    let start = Math.floor((currentPage - 1) / showPagination) * showPagination;
    let end = start + showPagination;
    const getPaginationGroup = pagination.slice(start, end);

    const next = () => {
        setCurrentPage((page) => page + 1);
    };

    const prev = () => {
        setCurrentPage((page) => page - 1);
    };

    const handleActive = (item) => {
        setCurrentPage(item);
    };

    const selectChange = (e) => {
        setLimit(Number(e.target.value));
        setPages(Math.ceil(sortedData.length / Number(e.target.value)));
    };

    // List view and grid view tab

    const [activeTab, setActiveTab] = useState(1);
    const handleTab = (index) => {
        setActiveTab(index); // remove the curly braces
    };

    return (
        <>
            <Layout breadcrumbTitle="My Jobs" breadcrumbActive="My Jobs">
                <div className="col-lg-12">
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white mb-30">
                                <div className="box-padding">
                                    <div className="box-filters-job">
                                        <div className="row mb-30">
                                            <div className="col-xl-6 col-lg-5">
                                                {getPaginationGroup.length <= 0 ? null : (
                                                    <span className="font-sm text-showing color-text-paragraph">
                                                        Showing {currentPage} of {pages} Pages
                                                    </span>
                                                )}
                                            </div>

                                            <div className="col-xl-6 col-lg-7 text-lg-end mt-sm-15">
                                                <div className="d-flex justify-content-end">
                                                    <div className="mr-10"><span className="text-sortby">Show:</span>
                                                        <ShowSelect
                                                            selectChange={selectChange}
                                                            showLimit={showLimit}
                                                        />
                                                    </div>
                                                    <div className="box2"><span className="text-sortby">Sort by:</span>
                                                        <select onChange={e => setSortType(e.target.value)}>
                                                            <option value="title">Title</option>
                                                            <option value="date">Date</option>
                                                            <option value="salary">Salary</option>
                                                        </select>
                                                    </div>
                                                    <div className="box-view-type">
                                                        <a className="view-type" onClick={() => handleTab(2)}>
                                                            <img src="assets/imgs/template/icons/icon-list.svg" alt="jobBox" />
                                                        </a>
                                                        <a className="view-type" onClick={() => handleTab(1)}>
                                                            <img src="assets/imgs/template/icons/icon-grid-hover.svg" alt="jobBox" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {activeTab === 1 &&
                                            <div className="row">
                                                {getPaginatedProducts.map((job, i) => (
                                                    <div
                                                        className="col-xl-3 col-lg-4 col-md-6 col-sm-12 col-12"
                                                        key={i}
                                                    >
                                                        <GridView job={job} />
                                                    </div>
                                                ))}
                                            </div>
                                        }
                                        {activeTab === 2 &&
                                            <div className="row display-list">
                                                {getPaginatedProducts.map((job, i) => (

                                                    <div
                                                        className="col-lg-6"
                                                        key={i}
                                                    >
                                                        <ListView job={job} />
                                                    </div>


                                                ))}
                                            </div>
                                        }
                                    </div>

                                    <div className="paginations">
                                        <Pagination
                                            getPaginationGroup={
                                                getPaginationGroup
                                            }
                                            currentPage={currentPage}
                                            pages={pages}
                                            next={next}
                                            prev={prev}
                                            handleActive={handleActive}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10">
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white pt-30 pb-30 pl-15 pr-15">
                                <div className="box-swiper">
                                    <div className="swiper-container swiper-group-10">
                                        <BrandSlider />
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