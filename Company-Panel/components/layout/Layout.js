import { useEffect, useState } from "react";
import Breadcrumb from "./Breadcrumb";
import BurgerIcon from "./BurgerIcon";
import Footer from "./Footer";
import Header from "./Header";
import MobileMenu from "./MobileMenu";
import PageHead from "./PageHead";
import Sidebar from "./Sidebar";

export default function Layout({ headTitle, breadcrumbTitle, breadcrumbActive, children }) {
  const [isToggled, setToggled] = useState(false);

  const handleToggle = () => {
    setToggled(!isToggled);
    if (!isToggled) {
      document.body.classList.add("mobile-menu-active");
    } else {
      document.body.classList.remove("mobile-menu-active");
    }
  };

  useEffect(() => {
    // Ensure we're running on the client where window is defined
    if (typeof window !== "undefined") {
      // Dynamically import wowjs and extract the named export WOW
      import("wowjs").then(({ WOW }) => {
        // Initialize WOW.js animations
        new WOW({ live: false }).init();
      }).catch((err) => {
        console.error("Failed to load WOW.js", err);
      });
    }
  }, []);

  return (
    <>
      <PageHead headTitle={headTitle} />
      <div className="body-overlay-1" onClick={handleToggle} />
      <Header />
      <BurgerIcon handleToggle={handleToggle} isToggled={isToggled} />
      <MobileMenu handleToggle={handleToggle} isToggled={isToggled} />
      <main className="main">
        <Sidebar />
        <div className="box-content">
          {breadcrumbTitle && (
            <Breadcrumb breadcrumbTitle={breadcrumbTitle} breadcrumbActive={breadcrumbActive} />
          )}
          <div className="row">{children}</div>
          <Footer />
        </div>
      </main>
    </>
  );
}
