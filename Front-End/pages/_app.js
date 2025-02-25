import "../public/assets/css/style.css";
import "../styles/globals.css";
import { useEffect } from "react";

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        require("../public/assets/js/bootstrap.bundle.min.js");
    }, []);

    return <Component {...pageProps} />;
}

export default MyApp;
