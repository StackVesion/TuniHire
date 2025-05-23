import "../public/assets/css/style.css";
import "../styles/globals.css";
import "../styles/verification-badge.css";  // Import our custom verification badge styles
import { useEffect } from "react";
import 'sweetalert2/dist/sweetalert2.min.css';
import 'animate.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        require("../public/assets/js/bootstrap.bundle.min.js");
    }, []);

    return (
        <>
            <Component {...pageProps} />
            <ToastContainer />
        </>
    );
}

export default MyApp;
