import aboutIcon from "/assets/local_library.svg"
import { type JSX } from "react"
import NavSidebar from "./general_elements/NavSidebar";

/**
 * Komponent funkcyjny renderujący stronę "O bibliotece".
 * Zawiera statyczne informacje o misji biblioteki, funkcjonalnościach systemu
 * oraz panelu użytkownika.
 *
 * @returns {JSX.Element} Widok strony informacyjnej.
 */
function AboutUs(): JSX.Element {
    return <>
        <NavSidebar></NavSidebar>
        <h1><img src={aboutIcon} alt="icon" /> O bibliotece</h1>
        <main className="login-panel" style={{ margin: "auto", width: "auto", textAlign: "justify" }}>

            <p>Witamy w miejscu, gdzie tradycyjna pasja do czytania spotyka się z nowoczesną technologią. Nasza biblioteka to nie tylko regały pełne książek, to innowacyjny system zaprojektowany z myślą o Twojej wygodzie i oszczędności czasu. Stawiamy na samoobsługę, przejrzystość i łatwy dostęp do wiedzy.</p>

            <h3>Nowoczesne rozwiązania dla Czytelników</h3>
            <p>Nasz system biblioteczny został stworzony tak, aby maksymalnie uprościć proces wypożyczania i oddawania książek. Dzięki zintegrowanej platformie online oferujemy:</p>
            <ul>
                <li><strong>Inteligentny katalog online:</strong> Przeszukuj nasze zbiory bez wychodzenia z domu. Zaawansowana wyszukiwarka pozwala filtrować wyniki nie tylko po tytule czy autorze, ale także po gatunkach, wydawcach, języku, a nawet specyficznych tagach.</li>
                <li><strong>Samoobsługa i kody QR:</strong> Dzięki systemowi kodów QR możesz samodzielnie wypożyczać i zwracać książki w bibliotece, a także błyskawicznie odbierać zarezerwowane egzemplarze.</li>
                <li><strong>System rezerwacji:</strong> Znalazłeś interesującą pozycję, ale wszystkie egzemplarze są zajęte? A może chcesz mieć pewność, że książka będzie na Ciebie czekać? Zarezerwuj ją online i odbierz w dogodnym terminie.</li>
            </ul>

            <h3>Twoje Centrum Dowodzenia</h3>
            <p>Każdy zarejestrowany czytelnik otrzymuje dostęp do osobistego profilu, który daje pełną kontrolę nad wypożyczeniami:</p>
            <ul>
                <li><strong>Transparentność terminów:</strong> W każdej chwili możesz sprawdzić, do kiedy musisz zwrócić książkę. System wyraźnie informuje o zbliżających się terminach oraz ewentualnych przeterminowaniach.</li>
                <li><strong>Zarządzanie kontem:</strong> Masz możliwość samodzielnego przedłużania terminów wypożyczeń oraz zarządzania swoimi danymi, w tym zmianą hasła czy aktualizacją danych karty płatniczej.</li>

            </ul>

            <p>Dołącz do nas! Zarejestruj się w kilka minut i ciesz się nieograniczonym dostępem do świata literatury.</p>
        </main>
    </>
}

export default AboutUs;