import { useState } from "react";
import Header from "../Header/Header";
import SideBar from "../SideBar/SideBar";
import Footer from "../Footer/Footer";
import Overlay from "../ui/Overlay/Overlay";
import "./Layout.css";

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <div className="layout">
      <Header onMenuToggle={toggleMenu} menuOpen={menuOpen} />
      <SideBar isOpen={menuOpen} onClose={closeMenu} />
      {menuOpen && <Overlay onClick={closeMenu} />}
      <main className="layout__main">{children}</main>
      <Footer />
    </div>
  );
}