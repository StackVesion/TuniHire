import Preloader from "@/components/elements/Preloader"
import { useEffect, useState } from "react"
import { Toaster } from 'react-hot-toast'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
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
                <ToastContainer position="top-right" autoClose={5000} />
                <Component {...pageProps} />
            </>
        ) : (
            <Preloader />
        )}
    </>)
}

export default MyApp
