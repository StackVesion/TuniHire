import Recruter from "@/components/elements/Recruter"
import Pagination from "@/components/filter/Pagination"
import ShowSelect from "@/components/filter/ShowSelect"
import Layout from "@/components/layout/Layout"
import BrandSlider from "@/components/slider/BrandSlider"
import { useEffect, useState } from "react"
import data from "../public/static/recruter"

export default function Recruters() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')
    const [filteredData, setFilteredData] = useState(data)
    const [active, setActive] = useState("")
    function handleClick(letter) {
        const newData = data.filter(item => item.title.toLowerCase().startsWith(letter));
        setFilteredData(newData);
        setActive(letter)
    }
    let [currentPage, setCurrentPage] = useState(1);
    let showLimit = 8,
        showPagination = 3

    let [pagination, setPagination] = useState([]);
    let [limit, setLimit] = useState(showLimit);
    let [pages, setPages] = useState(Math.ceil(filteredData.length / limit));

    useEffect(() => {
        cratePagination()
    }, [limit, pages, filteredData.length])

    const cratePagination = () => {
        // set pagination
        let arr = new Array(Math.ceil(filteredData.length / limit))
            .fill()
            .map((_, idx) => idx + 1);

        setPagination(arr);
        setPages(Math.ceil(filteredData.length / limit));
    };

    const startIndex = currentPage * limit - limit;
    const endIndex = startIndex + limit;

    const getPaginatedProducts = filteredData.slice(startIndex, endIndex);


    let start = Math.floor((currentPage - 1) / showPagination) * showPagination;
    let end = start + showPagination;
    const getPaginationGroup = pagination.slice(start, end);

    const next = () => {
        setCurrentPage((page) => page + 1)
    };

    const prev = () => {
        setCurrentPage((page) => page - 1)
    };

    const handleActive = (item) => {
        setCurrentPage(item);
    };

    const selectChange = (e) => {
        setLimit(Number(e.target.value));
        setPages(Math.ceil(filteredData.length / Number(e.target.value)))
    };

    function reset() {
        setFilteredData(data);
        setActive("")
    }
    return (
        <>
            <Layout breadcrumbTitle="Recruiters" breadcrumbActive="Recruiters">
                <div className="col-lg-12">
                    <div className="section-box">
                        <div className="container">
                            <div className="panel-white mb-30">
                                <div className="box-padding">
                                    <div className="row mb-30">
                                        <div className="col-12">
                                            <div className="box-list-character mb-15">
                                                <ul>
                                                    {alphabet.map(letter => (
                                                        <li key={letter} onClick={() => handleClick(letter)}>
                                                            <a className={active === letter ? "active" : ""}> {letter}</a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="d-flex justify-content-end">
                                                <button className="btn btn-default hover-up" onClick={reset}>Reset</button>
                                                <div className="select-box">
                                                    <ShowSelect
                                                        selectChange={selectChange}
                                                        showLimit={showLimit}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {getPaginatedProducts.length === 0 && (
                                        <span>No Item Found </span>
                                    )}
                                    <div className="row">
                                        {getPaginatedProducts.map((item, i) => (
                                            <div className="col-xl-3 col-lg-3 col-md-4 col-sm-12 col-12" key={i}>
                                                <Recruter item={item}/>
                                            </div>

                                        ))}
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