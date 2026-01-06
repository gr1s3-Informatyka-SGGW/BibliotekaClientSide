/**
 * @file Implementuje komponent reprezentujący pojedynczego użytkownika na liście (UserComponent).
 * Odpowiada za wizualizację danych osobowych, statusu konta oraz historii wypożyczeń.
 * * Funkcjonalności komponentu:
 * - Wizualizacja statusu użytkownika (admin, user, blocked).
 * - Wyświetlanie panelu akcji dostosowanego do obecnego statusu (np. usuń, blokuj/odblokuj).
 * - Prezentacja szczegółowej historii wypożyczeń i rezerwacji w rozwijanym panelu (używając Collapsible).
 * - Obliczanie i wyświetlanie naliczonych kar za przetrzymanie książek.
 * - Interaktywne elementy pozwalające na podgląd szczegółów książki.
 * @author Aleksander Grzegrzułka
 */

import React, {type JSX } from 'react';
import type { UserInfo, Book, Rent, Reservation } from "../../public/server_types.ts";
import CustomTooltip from "../../public/custom_components/CustomTooltip.tsx";
import iconAccount from "../assets/account_circle.svg";
import iconAccountFilled from "../assets/account_circle_filled.svg";
import iconMail from "../assets/mail.svg";
import iconBlock from "../assets/block.svg";
import iconDelete from "../assets/delete.svg";
import iconCalendar from "../assets/calendar.svg";
import iconCheck from "../assets/check.svg";
import iconError from "../assets/error.svg";
import iconBookmark from "../assets/bookmark.svg";
import Collapsible from '../../public/custom_components/Collapsible.tsx';

/**
 * Interfejs właściwości komponentu UserComponent
 * @interface UserComponentProps
 * @property userInfo - Obiekt zawierający pełne dane użytkownika wraz z aktywnymi wypożyczeniami i rezerwacjami
 * @property onBlockUser - Funkcja wywoływana przy próbie zablokowania użytkownika
 * @property onUnblockUser - Funkcja wywoływana przy próbie odblokowania użytkownika
 * @property onRemoveUser - Funkcja wywoływana przy próbie usunięcia użytkownika/bibliotekarza
 * @property onBookClick - Funkcja wywoływana po kliknięciu tytuł książki w celu pokazania szczegółów
 */
interface UserComponentProps {
  userInfo: UserInfo;
  onBlockUser: (user: UserInfo) => void;
  onUnblockUser: (user: UserInfo) => void;
  onRemoveUser: (user: UserInfo) => void;
  onBookClick: (book: Book) => void;
}

/**
 * Komponent wyświetlający kartę pojedynczego użytkownika.
 * Zawiera nagłówek z danymi osobowymi i akcjami oraz zwijaną sekcję ze szczegółami aktywności.
 * @component
 * @param {UserComponentProps} props - Właściwości komponentu.
 * @returns {JSX.Element} Wyrenderowany panel użytkownika.
 */
export default function UserComponent({ userInfo, onBlockUser, onUnblockUser, onRemoveUser, onBookClick }: UserComponentProps): JSX.Element {
  // Helper: Ustalanie klasy CSS panelu
  const getPanelClass = () => {
    if (userInfo.status === 'admin') return 'panel librarian';
    if (userInfo.status === 'blocked') return 'panel blocked';
    return 'panel';
  };

  // Helper: Ikona awatara
  const getAvatarIcon = () => {
    return userInfo.status === 'admin' ? iconAccountFilled : iconAccount;
  };

  // Helper: Nazwa wyświetlana
  const getDisplayName = () => {
    let name = `${userInfo.name} ${userInfo.surname}`;
    if (userInfo.status === 'blocked') name += " (zablokowany)";
    if (userInfo.status === 'admin') name += " (bibliotekarz)";
    return name;
  };

  const hasRents = userInfo.currently_rented.length !== 0;
  const hasReservations = userInfo.currently_reserved.length !== 0;
  const rentAndReservationsCount = userInfo.currently_rented.length + userInfo.currently_reserved.length;

  return (
    <div className={getPanelClass()}>
      <div className="user-header-row">
        <div className="user-panel-header">
          <span className="header name-display" style={{ border: "none" }}>
            <img src={getAvatarIcon()} alt="Avatar" />
            {getDisplayName()}
          </span>
          <span className="email-display">
            <img src={iconMail} className="email-icon" alt="Email" />
            <span>{userInfo.email}</span>
          </span>
        </div>

        <div className="user-actions">
          {/* Przyciski akcji zależne od statusu */}
          {userInfo.status === 'user' && (
            <button className="action-block" onClick={() => onBlockUser(userInfo)}>
              <img src={iconBlock} alt="" /> Zablokuj
            </button>
          )}

          {userInfo.status === 'blocked' && (
            <button className="action-block" onClick={() => onUnblockUser(userInfo)}>
              <img src={iconBlock} alt="" /> Odblokuj
            </button>
          )}

          <button className="action-delete" onClick={() => onRemoveUser(userInfo)}>
            <img src={iconDelete} alt="" />
            {userInfo.status === 'admin' ? "Usuń bibliotekarza" : "Usuń użytkownika"}
          </button>
        </div>
      </div>

      {userInfo.status !== 'admin' && (
        <>
          {(!hasRents && !hasReservations)
            ?
            <h4 className="italic text-neutral-600">Brak aktywnych wypożyczeń i rezerwacji</h4>
            :
            <Collapsible header={`Wypożyczenia i rezerwacje (${rentAndReservationsCount})`}>
              <div className="loan-reservation-wrapper">

                {/* TABELA WYPOŻYCZEŃ */}
                <h4>Wypożyczone książki</h4>
                {(!hasRents) ? (
                  <p className="empty-table-placeholder" style={{ marginTop: '1em', color: '#555', fontStyle: 'italic' }}>
                    Brak aktywnych wypożyczeń.
                  </p>
                ) : (
                  <table className="loans-table">
                    <thead>
                      <tr>
                        <th>Tytuł</th>
                        <th>Data wypożyczenia</th>
                        <th>Termin zwrotu</th>
                        <th>Status</th>
                        <th>Naliczone koszty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userInfo.currently_rented.map((rent, idx) => (
                        <RentRow key={idx} rent={rent} onBookClick={onBookClick} />
                      ))}
                    </tbody>
                  </table>
                )}

                {/* TABELA REZERWACJI */}
                <h4>Rezerwacje</h4>
                {(!hasReservations) ? (
                  <p className="empty-table-placeholder" style={{ marginTop: '1em', color: '#555', fontStyle: 'italic' }}>
                    Brak aktywnych rezerwacji.
                  </p>
                ) : (
                  <table className="loans-table">
                    <thead>
                      <tr>
                        <th>Tytuł</th>
                        {/* <th>Data rezerwacji</th> */}
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userInfo.currently_reserved.map((res, idx) => (
                        <ReservationRow key={idx} reservation={res} onBookClick={onBookClick} />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Collapsible>}
        </>
      )}
    </div>
  );
}

/**
 * Komponent pomocniczy renderujący wiersz tabeli wypożyczeń.
 * Oblicza automatycznie status przeterminowania oraz koszt kary (15 zł za dzień zwłoki).
 * @component
 * @param {Object} props
 * @param {Rent} props.rent - Obiekt reprezentujący pojedyncze wypożyczenie.
 * @param {function(Book): void} props.onBookClick - Callback do wyświetlenia szczegółów książki.
 * @returns {JSX.Element} Wiersz tabeli (tr).
 */
function RentRow({ rent, onBookClick }: { rent: Rent, onBookClick: (b: Book) => void }): JSX.Element {
  const today = new Date();
  const isOverdue = today > new Date(rent.return_date);
  const daysOverdue = isOverdue ? Math.floor((today.getTime() - new Date(rent.return_date).getTime()) / (1000 * 3600 * 24)) : 0;
  // Prosta logika kosztów: 15 zł za dzień
  const cost = isOverdue ? (daysOverdue * 15.00).toFixed(2) : "0.00";

  return (
    <tr className={isOverdue ? 'bg-rose-200' : ''}>
      <td>
        <CustomTooltip title="Zobacz szczegóły">
          <a href="#" onClick={(e) => { e.preventDefault(); onBookClick(rent.book); }}>
            „{rent.book.title}”
          </a>
        </CustomTooltip>
      </td>
      <td>
        <div className="date-cell">
          <img src={iconCalendar} className="date-icon-small" alt="" />
          <span>{new Date(rent.borrow_date).toLocaleDateString()}</span>
        </div>
      </td>
      <td>
        <div className="date-cell">
          <img src={iconCalendar} className="date-icon-small" alt="" />
          <span>{new Date(rent.return_date).toLocaleDateString()}</span>
        </div>
      </td>
      <td>
        {isOverdue ? (
          <span className="status-badge status-overdue">
            <img src={iconError} className="status-icon-small" alt="" />
            Przeterminowane ({daysOverdue} dni)
          </span>
        ) : (
          <span className="status-badge status-active">
            <img src={iconCheck} className="status-icon-small" alt="" />
            Aktywne
          </span>
        )}
      </td>
      <td>
        {isOverdue ? (
          <div><span className="cost-unpaid">Niezapłacone:</span> {cost} zł</div>
        ) : (
          <span className="status-badge status-neutral">Termin nie upłynął</span>
        )}
      </td>
    </tr>
  );
}

/**
 * Komponent pomocniczy renderujący wiersz tabeli rezerwacji.
 * Wyświetla informacje o tytule i dacie wygaśnięcia rezerwacji.
 * @component
 * @param {Object} props
 * @param {Reservation} props.reservation - Obiekt reprezentujący rezerwację.
 * @param {function(Book): void} props.onBookClick - Callback do wyświetlenia szczegółów książki.
 * @returns {JSX.Element} Wiersz tabeli (tr).
 */
function ReservationRow({ reservation, onBookClick }: { reservation: Reservation, onBookClick: (b: Book) => void }): JSX.Element {
  return (
    <tr>
      <td>
        <CustomTooltip title="Zobacz szczegóły">
          <a href="#" onClick={(e) => { e.preventDefault(); onBookClick(reservation.book); }}>
            „{reservation.book.title}”
          </a>
        </CustomTooltip>
      </td>
      {/* <td>
        <div className="date-cell">
          <img src={iconCalendar} className="date-icon-small" alt="" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </td> */}
      <td>
        <span className="status-badge status-reserved">
          <img src={iconBookmark} className="status-icon-small" style={{ filter: "invert(100%)", marginRight: "0.1em" }} alt="" />
          Zarezerwowana do {new Date(reservation.reserve_to).toLocaleDateString()}
        </span>
      </td>
    </tr>
  );
}