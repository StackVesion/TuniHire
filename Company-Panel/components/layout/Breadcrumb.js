import Link from "next/link"

export default function Breadcrumb({ breadcrumbTitle, breadcrumbActive }) {
    return (
        <>
            <div className="box-heading">
                <div className="box-title">
                    <h3 className="mb-35">{breadcrumbTitle}</h3>
                </div>
                <div className="box-breadcrumb">
                    <div className="breadcrumbs">
                        <ul>
                            <li> <Link className="icon-home" href="/">Admin</Link></li>
                            <li><span>{breadcrumbActive}</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    )
}
