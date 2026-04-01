/**
 * @file Plik obsługujący stronę /profile-user
 * @author Natalia Bardadyn
 * */
import React, {useContext, useEffect, useState} from "react";
import NavSidebar from "../general_elements/NavSidebar.tsx";
import ProfileInfoPanel from './ProfileInfoPanel.tsx';
import ProfileBookList, { RentComponent, ReservationComponent } from "./ProfileBookList.tsx";
import { AuthContext } from "../server/UserAuth.tsx";

import {fetchBorrowedBooksRequest, fetchReservedBooksRequest, fetchUserInfoRequest} from '../server/server_requests.ts';
import {type Rent, type Reservation, type User} from '../server/server_types.ts';

import accountCircleIcon from '/assets/account_circle.svg';
import bookIcon from '/assets/book.svg';
import ribbonIcon from '/assets/book_ribbon.svg';
import {Alert} from "../custom_components/Popup.tsx";

/**
 * Komponent widoku profilu użytkownika.
 * Odpowiada za wyświetlanie paska nawigacyjnego, panelu informacji o użytkowniku oraz list aktualnych wypożyczeń i rezerwacji.
 * Komponent pobiera dane z API przy montowaniu. W przypadku, braku danych lub błędu serwera, ładowane są dane przykładowe.
 */
export default function UserProfileView() {
    const session = useContext(AuthContext);

    const [userInfo, setUserInfo] = useState<User | undefined>(undefined);
    const [userRents, setUserRents] = useState<Rent[] | undefined>(undefined);
    const [userReservations, setUserReservations] = useState<Reservation[] | undefined>(undefined);

    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isAPIError, setIsAPIError] = useState(false);
    useEffect(() => {
        const loadData = async () => {
            try {
                setUserInfo(await fetchUserInfoRequest())
                setUserRents(await fetchBorrowedBooksRequest())
                setUserReservations(await fetchReservedBooksRequest());
            }
            catch (error: any) {
                if(error.couse === 'Odmowa dostępu'){
                    window.location.href = '/access-denied';
                    return;
                }
                setIsAPIError(true);
                setErrorMessage(error.message);
            }
        };
        void loadData();
    }, []);


    return (
<>
    {/* Sidebar nawigacyjny */}
    <NavSidebar />

    <main className="user-profile-view">
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
            justifyContent: 'center',
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: '100%',
            gap: '1em',
            alignItems: 'flex-start'
        }}>

            {/* LEWA KOLUMNA: Panel profilu */}
            <div style={{ width: '22em'}}>
                {userInfo ? <ProfileInfoPanel info={userInfo} access={'user'} /> : <></>}
            </div>

            {/* PRAWA KOLUMNA: Listy książek */}
            <div style={{display: 'flex', flexDirection: 'column'}}>
            {userReservations &&
                <ProfileBookList
                    header="Zarezerwowane książki"
                    icon={ribbonIcon}
                >
                    {userReservations.map(((res: Reservation, index: number) => (
                        <ReservationComponent key={index} info={res} />
                    )))}
                </ProfileBookList>
            }
            {userRents &&
                <ProfileBookList
                    header="Wypożyczone książki"
                    icon={bookIcon}>
                        {userRents.map((rent: Rent, index: number) => (
                            <RentComponent key={index} info={rent}/>
                        ))}
                </ProfileBookList>
            }
            </div>
        </div>
    </main>
    <Alert message={errorMessage} title="Błąd API" isOpen={isAPIError} setIsOpen={setIsAPIError}/>
</>
    );
}

