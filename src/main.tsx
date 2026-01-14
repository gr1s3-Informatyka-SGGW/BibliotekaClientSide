import {StrictMode, useContext, useState} from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import UserProfileView from "./elements_user/UserProfileView.tsx";
import ProfileInfoPanel from "./general_elements/ProfileInfoPanel.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ProfileInfoPanel info={{name: "Jan", surname: "Cydejko", email: "Jan.cydejko@email.com", credit_card_number: '5786'}}/>
    </StrictMode>
)
