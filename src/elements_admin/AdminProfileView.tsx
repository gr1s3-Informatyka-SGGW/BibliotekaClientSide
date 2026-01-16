/**
 * @file Plik obsługujący stronę /profile-admin
 * @author Natalia Bardadyn
 * */

import React, { useContext, useState, useEffect } from 'react'; import { AuthContext } from "../../public/UserAuth.tsx";
import ProfileInfoPanel from '../general_elements/ProfileInfoPanel';
import accountCircleIcon from '../assets/account_circle.svg';

import { fetchUserInfoRequest } from '../../public/server_requests.ts';
import type { User } from '../../public/server_types.ts'

/**
 * Komponent widoku profilu administratora.
 * Pobiera dane użytkownika z API przy montowaniu i wyświetla panel informacyjny.
 * W przypadku błędu lub braku danych z serwera, wyświetla dane przykladowe.
 */
export default function AdminProfileView() {
    const session = useContext(AuthContext);
    const [adminData, setAdminData] = useState<User | null>(session?.session?.user || null);
    const [isLoading, setIsLoading] = useState(!adminData);

    useEffect(() => {
        const getAdminData = async () => {
            if (!adminData) {
                try {
                    setIsLoading(true);
                    const data = await fetchUserInfoRequest();
                    if (data) {
                        setAdminData(data);
                    } else {
                        setAdminData({
                            name: "Admin",
                            surname: "Systemu",
                            email: "admin@library.com"
                        });
                    }
                } catch (error) {
                    console.error("Błąd pobierania danych admina, ustawiam dane testowe:", error);
                    setAdminData({
                        name: "Admin",
                        surname: "Systemu",
                        email: "admin@library.com"
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        };
        getAdminData();
    }, []);

    if (!adminData) return <div>Ładowanie danych administratora...</div>;
    return (
        <div className="admin-profile-view" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0px 2em',
            width: '100%',
            boxSizing: 'border-box',
            paddingLeft: '10em'
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
                        alt="Profile"
                    />
                    Twój profil
                </h1>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '0px'
            }}>
                <div style={{
                    flex: '0 0 auto',
                    width: '30em'
                }}>
                    <ProfileInfoPanel info={adminData} />
                </div>
            </div>
        </div>
    );
}
