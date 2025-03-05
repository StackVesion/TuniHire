import Link from "next/link"

export default function Recruter({ item }) {
    return (
        <>
            <div className="card-grid-1 hover-up wow animate__animated animate__fadeIn">
                <div className="image-box">
                    <Link href="/company-details">
                        <img src={`assets/imgs/brands/${item.img}`} alt="jobBox" />
                    </Link></div>
                <div className="info-text mt-10">
                    <h5 className="font-bold"><Link href="#">{item.title}</Link>
                    </h5>
                    <div className="mt-5">
                        <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                        <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                        <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                        <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                        <img alt="jobBox" src="assets/imgs/template/icons/star.svg" />
                        <span className="font-xs color-text-mutted ml-10">
                            <span>
                                (</span><span>{item.rating}</span><span>)
                            </span>
                        </span>
                    </div>
                    <span className="card-location">{item.location}</span>
                    <div className="mt-30"><Link className="btn btn-grey-big" href="/jobs-grid"><span>{item.open}</span><span> Jobs Open
                    </span></Link></div>
                </div>
            </div>

        </>
    )
}
