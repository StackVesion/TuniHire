import MyTask from "@/components/elements/MyTask"
import Pagination from "@/components/filter/Pagination"
import Layout from "@/components/layout/Layout"
import BrandSlider from "@/components/slider/BrandSlider"
import { useEffect, useState } from "react"
import data from "../public/static/task"

export default function TaskList() {

    let [currentPage, setCurrentPage] = useState(1);
    let showLimit = 12,
        showPagination = 4;

    let [pagination, setPagination] = useState([]);
    let [limit, setLimit] = useState(showLimit);
    let [pages, setPages] = useState(Math.ceil(data.length / limit));

    useEffect(() => {
        cratePagination();
    }, [limit, pages, data.length]);

    const cratePagination = () => {
        // set pagination
        let arr = new Array(Math.ceil(data.length / limit))
            .fill()
            .map((_, idx) => idx + 1);

        setPagination(arr);
        setPages(Math.ceil(data.length / limit));
    };

    const startIndex = currentPage * limit - limit;
    const endIndex = startIndex + limit;

    const getPaginatedProducts = data.slice(startIndex, endIndex);


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
    return (
        <>
            <Layout breadcrumbTitle="My Task" breadcrumbActive="My Task">
                <div className="col-lg-12">
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white mb-30">
                                <div className="box-padding">
                                    <div className="row display-list">
                                        {getPaginatedProducts.length === 0 && (
                                            <span>No Products Found </span>
                                        )}
                                        <div className="row">
                                            {getPaginatedProducts.map((task, i) => (
                                                <div className="col-xl-3 col-lg-4 col-md-6" key={i}>
                                                    <MyTask task={task} />
                                                </div>
                                            ))}
                                        </div>
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