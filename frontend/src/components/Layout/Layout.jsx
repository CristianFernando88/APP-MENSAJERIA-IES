import Header from "../Header/Header";
import SideBar from "../SideBar/SideBar";
import Footer from "../Footer/Footer";
import "./Layout.css";

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Header />
      <SideBar />
      <main className="layout__main">{children}</main>
      <Footer />
    </div>
  );
}