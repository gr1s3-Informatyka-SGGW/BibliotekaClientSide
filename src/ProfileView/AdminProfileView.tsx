/**
 * @file Plik obsługujący stronę /profile-admin
 * @author Natalia Bardadyn
 * */

import React, { useContext, useState, useEffect } from 'react'; import { AuthContext } from "../server/UserAuth.tsx";
import ProfileInfoPanel from './ProfileInfoPanel.tsx';
import accountCircleIcon from '/assets/account_circle.svg';

import {fetchAdminCatalogRequest, fetchUserInfoRequest} from '../server/server_requests.ts';
import type { User } from '../server/server_types.ts'
import NavSidebar from "../general_elements/NavSidebar.tsx";
import {Alert} from "../custom_components/Popup.tsx";
import type {RequestError} from "../server/requests/connection.ts";

/**
 * Komponent widoku profilu administratora.
 * Pobiera dane użytkownika z API przy montowaniu i wyświetla panel informacyjny.
 * W przypadku błędu lub braku danych z serwera wyświetla dane przykładowe.
 */
export default function AdminProfileView() {
    const session = useContext(AuthContext);
    const [adminData, setAdminData] = useState<User | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const getAdminData = async () => {
            if (!adminData) {
                try {
                    const data = await fetchUserInfoRequest();
                    setAdminData(data);
                } catch (error: RequestError | any) {
                    console.error("Błąd pobierania danych admina:", error);
                    if(error.couse === 'Odmowa dostępu'){
                        window.location.href = '/access-denied';
                        return;
                    }
                    setErrorMessage(error.message);
                }
            }
        };
        void getAdminData();
    }, [adminData]);

    if (!adminData) return <div>Ładowanie danych administratora...</div>;
    return (
        <>
        <NavSidebar/>
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{
                textAlign: 'center',
                textDecoration: 'none',
                color: '#631433',
                transition: 'color 0.3s',
                marginRight: '0.15em',
                alignItems: 'center',
                gap: '0.5em'
            }}>
                <h1 style={{
                    fontSize: '2em',
                    marginBottom: '0.5em',
                    fontWeight: 'bold'
                }}>
                    <img
                        src={accountCircleIcon}
                        alt=""
                    />
                    Twój profil
                </h1>
            </div>

            <ProfileInfoPanel info={adminData} />
        </main>
            <Alert message={errorMessage}
                   title="Błąd Serwera"
                   isOpen={errorMessage !== ''}
                   setIsOpen={(v: boolean) => setErrorMessage('')}/>
        </>
    );
}
