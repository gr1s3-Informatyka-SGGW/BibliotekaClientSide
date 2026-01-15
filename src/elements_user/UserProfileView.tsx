/**
 * @file Plik obsługujący stronę /profile-user
 * @author Natalia Bardadyn
 * */

import React, { useContext } from "react";
import NavSidebar from "../general_elements/NavSidebar.tsx";
import ProfileInfoPanel from '../general_elements/ProfileInfoPanel';
import ProfileBookList, { RentComponent, ReservationComponent } from "./ProfileBookList.tsx";
import { AuthContext } from "../../public/UserAuth.tsx";

import {fetchBorrowedBooksRequest, fetchReservedBooksRequest} from '../../public/server_requests.ts';
import { type Rent, type Reservation } from '../../public/server_types.ts';

import accountCircleIcon from '../assets/account_circle.svg';
import bookIcon from '../assets/book.svg';
import ribbonIcon from '../assets/book_ribbon.svg';

/**
 * Komponent widoku profilu użytkownika.
 * Łączy nawigację boczną, panel informacji o użytkowniku oraz listy wypożyczeń i rezerwacji.
 */
export default function UserProfileView() {
    const session = useContext(AuthContext);

    // Przykładowe dane z serwera
    const userRents: Rent[] = [getRent()];
    const userReservations: Reservation[] = [getRes()];

    return (
        <div className="user-profile-layout" style={{ display: 'flex', width: '100%' }}>
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
                        <ProfileInfoPanel info={{
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
    );
}

/**
 * Funkcja generująca przykładowe dane wypożyczenia.
 */
function getRent(): Rent {
    return {
        book: {
            book_id: 101,
            title: "Władca Pierścieni: Drużyna Pierścienia",
            authors: ["J.R.R. Tolkien"],
            isbn_number: "978-83-7298-953-6",
            publish_year: 1954,
            publisher: "George Allen & Unwin",
            genre: ["Fantasy", "Przygoda"],
            language: "Polski",
            length: 423,
            keywords: ["Pierścień", "Hobbit"]
        },
        borrow_date: new Date("2025-01-01"),
        return_date: new Date("2026-01-21")
    };
}



/**
 * Funkcja generująca przykładowe dane rezerwacji.
 */
function getRes(): Reservation {
    return {
        book: {
            book_id: 202,
            title: "Hobbit, czyli tam i z powrotem",
            authors: ["J.R.R. Tolkien"],
            isbn_number: "978-83-244-0308-0",
            publish_year: 1937,
            publisher: "SuperNowa",
            genre: ["Fantasy"],
            language: "Polski",
            length: 310,
            keywords: ["Smok", "Bilbo"]
        },
        reserve_to: new Date("2026-01-21"),
    };
}
