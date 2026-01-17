/**
 * @file Plik obsługujący stronę /profile-user
 * @author Natalia Bardadyn
 * */
// todo: poprawić widok mobilny
import React, { useContext, useState, useEffect } from "react";
import NavSidebar from "../general_elements/NavSidebar.tsx";
import ProfileInfoPanel from '../general_elements/ProfileInfoPanel';
import ProfileBookList, { RentComponent, ReservationComponent } from "./ProfileBookList.tsx";
import { AuthContext } from "../../public/UserAuth.tsx";

import {fetchBorrowedBooksRequest, fetchReservedBooksRequest, RequestError} from '../../public/server_requests.ts';
import { type Rent, type Reservation } from '../../public/server_types.ts';

import accountCircleIcon from '../assets/account_circle.svg';
import bookIcon from '../assets/book.svg';
import ribbonIcon from '../assets/book_ribbon.svg';
import {Alert} from "../../public/custom_components/Popup.tsx";

/**
 * Komponent widoku profilu użytkownika.
 * Odpowiada za wyświetlanie paska nawigacyjnego, panelu informacji o użytkowniku oraz list aktualnych wypożyczeń i rezerwacji.
 * Komponent pobiera dane z API przy montowaniu. W przypadku, braku danych lub błędu serwera, ładowane są dane przykładowe.
 */
export default function UserProfileView() {
    const session = useContext(AuthContext);

    const [userRents, setUserRents] = useState<Rent[]>([]);
    const [userReservations, setUserReservations] = useState<Reservation[]>([]);

    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isAPIError, setIsAPIError] = useState(false);

    const loadData = async () => {
        try {
            setUserRents(await fetchBorrowedBooksRequest())
            setUserReservations(await fetchReservedBooksRequest());
        }
        catch (error: any) {
            setIsAPIError(true);
            setErrorMessage(error.message);
        }
    };

    return (
        <>
            <div className="user-profile-layout" onLoad={loadData} style={{ display: 'flex', width: '100%' }}>
                {/* Sidebar nawigacyjny */}
                <NavSidebar />

                <div className="user-profile-view" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '2em',
                }}>
                    {/* 1. Nagłówek: Ikona i Tytuł */}
                    <div style={{
                        textAlign: 'center',
                        textDecoration: 'none',
                        color: '#631433',
                        transition: 'color 0.3s',
                        alignItems: 'center',
                        gap: '0.5em'
                    }}>
                        <h1 style={{
                            fontSize: '2em',
                            marginTop: '0',
                            marginBottom: '0.5em',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5em'
                        }}>
                            <img
                                src={accountCircleIcon}
                                alt="Profile"
                            />
                            Twój profil
                        </h1>
                    </div>

                    {/* 2. Główny kontener dla układu Lewo-Prawo */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        width: '100%',
                        gap: '2em',
                        alignItems: 'flex-start'
                    }}>

                        {/* LEWA KOLUMNA: Panel profilu */}
                        <div style={{ flex: '0 0 auto', width: '22em', marginTop: '0.5em' }}>
                            <ProfileInfoPanel info={session?.session?.user || {
                                name: "Jan",
                                surname: "Kowalski",
                                email: "jan@example.com",
                                credit_card_number: "1234567812345678"
                            }} />
                        </div>

                        {/* PRAWA KOLUMNA: Listy książek */}
                        <div style={{
                            flex: '1',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <ProfileBookList
                                header="Zarezerwowane książki"
                                icon={ribbonIcon}
                            >
                                {userReservations.map(res => (
                                    <ReservationComponent key={res.book.book_id} info={res} />
                                ))}
                            </ProfileBookList>

                            <ProfileBookList
                                header="Wypożyczone książki"
                                icon={bookIcon}
                            >
                                {userRents.map(rent => (
                                    <RentComponent key={rent.book.book_id} info={rent} />
                                ))}
                            </ProfileBookList>
                        </div>
                    </div>
                </div>
            </div>
            <Alert message={errorMessage} title="Błąd API" isOpen={isAPIError} setIsOpen={setIsAPIError}/>
        </>
    );
}

