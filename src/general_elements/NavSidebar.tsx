/**
 * @file  Komponent nawigacji bocznej (Sidebar). Obsługuje widok mobilny (zwijanie),
 * renderowanie linków na podstawie roli użytkownika (Admin/User) oraz wylogowywanie.
 * @author Aleksander Grzegrzułka
 */

import { useContext, useEffect, useState, type JSX } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../public/UserAuth.tsx";

import "./sidebar.css";

import logoIcon from "../assets/logo.svg";
import personIcon from "../assets/person.svg";
import newsstandIcon from "../assets/newsstand.svg";
import accountCircleIcon from "../assets/account_circle.svg";
import groupIcon from "../assets/group.svg";
import addBookIcon from "../assets/add_box.svg";
import borrowIcon from "../assets/borrow.svg";
import libraryIcon from "../assets/local_library.svg";
import logoutIcon from "../assets/logout.svg";
import {Alert} from "../../public/custom_components/Popup.tsx";

/**
 * Interfejs opisujący pojedynczy element nawigacyjny w menu.
 * @prop {string} label - Tekst wyświetlany w menu.
 * @prop {string} path - Ścieżka, do której prowadzi link.
 * @prop {string} icon - Ikona importowana z assets.
 * @prop {string} [id] - Unikalny identyfikator (opcjonalny).
 */
interface NavItem {
    label: string;
    path: string;
    icon: string;
    id?: string;
}

/**
 * Komponent bocznego paska nawigacji.
 * Funkcjonalności:
 * - Responsywność (zwijanie na mobilkach).
 * - Ukrywanie przycisku menu podczas scrollowania w dół.
 * - Wyświetlanie linków zależnie od roli (Admin/User).
 * - Obsługa wylogowania.
 * @returns {JSX.Element} Wyrenderowany sidebar.
 */
function NavSidebar(): JSX.Element {
    const auth = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Stan otwarcia menu (dla mobile)
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Stan widoczności przycisku toggle (zależny od scrolla)
    const [showToggle, setShowToggle] = useState<boolean>(true);

    // Widoczność popupu ostrzeżenia dla wylogowania
    const [showAlert, setShowAlert] = useState<boolean>(false);

    // Pobranie danych sesji
    const user = auth?.session?.user;
    const role = auth?.session?.access;

    /**
     * Obsługa wylogowania.
     * Czyści sesję i przekierowuje do strony logowania.
     */
    const handleLogout = () => {
        auth?.logout();
        navigate("/login");
        window.location.reload();
    };

    /**
     * Przełącza stan otwarcia menu mobilnego.
     */
    const toggleMenu = () => {
        setIsOpen((prev) => !prev);
    };

    /**
     * Efekt obsługujący chowanie/pokazywanie przycisku hamburgera podczas scrollowania.
     */
    useEffect(() => {
        let lastY = window.scrollY;
        let ticking = false;
        const threshold = 4;

        const onScroll = () => {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(() => {
                const currentY = window.scrollY;

                // Jeśli menu jest otwarte, zawsze pokazuj przycisk
                if (isOpen) {
                    setShowToggle(true);
                    ticking = false;
                    return;
                }

                const delta = currentY - lastY;
                if (Math.abs(delta) > threshold) {
                    if (delta > 0) {
                        // Scroll w dół -> ukryj
                        setShowToggle(false);
                    } else {
                        // Scroll w górę -> pokaż
                        setShowToggle(true);
                    }
                    lastY = currentY;
                }
                ticking = false;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [isOpen]);

    const adminLinks: NavItem[] = [
        { label: "Katalog", path: "/catalog", icon: newsstandIcon, id: "sidebar-button-catalog" },
        { label: "Twój profil", path: "/profile-admin", icon: accountCircleIcon, id: "sidebar-button-profile" },
        { label: "Użytkownicy", path: "/users-view", icon: groupIcon, id: "sidebar-button-users" },
        { label: "Dodaj książkę", path: "/add-book", icon: addBookIcon, id: "sidebar-button-add-book" },
        { label: "Wypożyczenia", path: "/rented-books", icon: borrowIcon, id: "sidebar-button-loans" },
    ];

    const userLinks: NavItem[] = [
        { label: "Katalog", path: "/catalog", icon: newsstandIcon, id: "sidebar-button-catalog" },
        { label: "Twój profil", path: "/profile-user", icon: accountCircleIcon, id: "sidebar-button-profile" },
    ];

    // Wybór odpowiedniego zestawu linków
    const currentLinks = role === "admin" ? adminLinks : userLinks;

    /**
     * Helper sprawdzający, czy dany link jest aktywny.
     * @param {string} path - Ścieżka linku.
     * @returns {boolean}
     */
    const isActive = (path: string): boolean => location.pathname === path;

    // Jeśli użytkownik nie jest zalogowany, nie wyświetlamy Sidebara (zgodnie z logiką, ProtectedRoute i tak wyrzuci, ale dla bezpieczeństwa UI)
    if (!auth?.session) return <></>;

    return (
        <>
            {/* Tło przyciemniające (Backdrop) dla mobile */}
            <div
                id="sidebar-bg"
                style={{
                    display: isOpen ? "block" : "none",
                    opacity: isOpen ? "1.0" : "0",
                }}
                onClick={() => setIsOpen(false)}
            />

            {/* Przycisk Hamburger */}
            <button
                id="menu-toggle"
                className={isOpen ? "open" : ""}
                onClick={toggleMenu}
                style={{
                    top: isOpen ? "1.5em" : showToggle ? "1.5em" : "-3.55em",
                }}
                aria-label="Otwórz menu"
            >
                <span className="bar bar-top"></span>
                <span className="bar bar-middle"></span>
                <span className="bar bar-bottom"></span>
            </button>

            {/* Główny kontener Sidebar */}
            <nav className={`sidebar ${isOpen ? "open" : ""}`} id="sidebar">

                {/* Header: Logo */}
                <div style={{ display: "flex", margin: "auto", alignItems: "center", gap: "0.5em", color: "#891E49", marginBottom: "0.75em" }}>
                    <div id="menu-toggle-padding"></div>
                    <Link to="/catalog" style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: "0.5em", padding: 0, background: "none" }}>
                        <img src={logoIcon} style={{ height: "2.5em", width: "auto" }} className="brightness-1000" alt="Logo" />
                        <h2 style={{ margin: 0, color: "white" }}>Biblioteka</h2>
                    </Link>
                    <div style={{ flexGrow: 1 }}></div>
                </div>

                {/* User Info Widget */}
                <div
                    className="login-info"
                    onClick={() => navigate(role === "admin" ? "/profile-admin" : "/profile-user")}
                    style={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        background: "rgba(255, 255, 255, 0.2)",
                        padding: "10px",
                        borderRadius: "8px",
                    }}
                >
                    <img
                        src={personIcon}
                        alt="User avatar"
                        style={{ height: "40px", width: "auto", filter: "invert(1.0) brightness(500%)" }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: "1.2" }}>
                        <span style={{ fontWeight: "bold", color: "#ffffff" }}>
                            {user ? `${user.name} ${user.surname}` : "Użytkownik"}
                        </span>
                        <span style={{ fontSize: "0.9em", color: "#ffffff90" }}>
                            {user?.email || ""}
                        </span>
                    </div>
                </div>

                <hr style={{ width: "100%", color: "#ffffff20", borderColor: "#ffffff20" }} />

                {/* Linki nawigacyjne */}
                <div style={{ overflowY: "auto" }}>
                    {currentLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`sidebar-elem ${isActive(link.path) ? "selected" : ""}`}
                            id={link.id}
                            onClick={() => setIsOpen(false)} // Zamknij menu po kliknięciu (mobile)
                        >
                            <img src={link.icon} alt="" /> {link.label}
                        </Link>
                    ))}
                </div>

                <div style={{ flex: "1 1 auto" }}></div>

                {/* Footer: O bibliotece i Wyloguj */}
                <Link
                    to="/about-us"
                    className={`sidebar-elem ${isActive("/about-us") ? "selected" : ""}`}
                    id="sidebar-button-about"
                    onClick={() => setIsOpen(false)}
                >
                    <img src={libraryIcon} alt="" /> O bibliotece
                </Link>

                <hr style={{ width: "100%", color: "#ffffff20", borderColor: "#ffffff20" }} />

                <a
                    className="sidebar-elem"
                    onClick={()=> setShowAlert(true)}
                >
                    <img src={logoutIcon} className="invert" alt="" /> Wyloguj się
                </a>
            </nav>
            <Alert message={"Czy na pewno chcesz się wylogować?"} title={"Czy na pewno chcesz się wylogować?"} isOpen={showAlert} setIsOpen={setShowAlert} onAccept={handleLogout}/>
        </>
    );
}

export default NavSidebar;