import React from 'react';
import ProfileInfoPanel from '../general_elements/ProfileInfoPanel';
import accountCircleIcon from '../assets/account_circle.svg';
import type { User } from '../../public/server_types.ts';

/**
 * Interfejs definiujący właściwości dla komponentu AdminProfileView.
 * * @interface AdminProfileProps
 * @property {User} adminData - Obiekt zawierający dane administratora do wyświetlenia.
 */
interface AdminProfileProps {
    adminData: User;
}

/**
 * Komponent funkcyjny wyświetlający profil administratora.
 * Prezentuje nagłówek z ikoną oraz panel szczegółowych informacji o użytkowniku.
 * * @param {AdminProfileProps} props - Właściwości komponentu.
 * @returns {JSX.Element} Element JSX reprezentujący widok profilu.
 */
export default function AdminProfileView({ adminData }: AdminProfileProps) {
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