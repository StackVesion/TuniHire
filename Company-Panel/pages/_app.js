import Preloader from "@/components/elements/Preloader"
import { useEffect, useState } from "react"
import { Toaster } from 'react-hot-toast'
import "@/public/assets/css/style.css"
import '../styles/job-listings.css'
import '../styles/pdf-viewer.css'

function MyApp({ Component, pageProps }) {

    const [loading, setLoading] = useState(true)
    useEffect(() => {
        setTimeout(() => {
            setLoading(false)
        }, 1000)

    }, [])
    return (<>
        {!loading ? (
            <>
                <Toaster position="top-right" />
                <Component {...pageProps} />
            </>
        ) : (
            <Preloader />
        )}
    </>)
}

export default MyApp
