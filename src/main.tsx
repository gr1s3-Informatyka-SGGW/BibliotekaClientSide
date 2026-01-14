import {StrictMode, useContext, useState} from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import UserProfileView from "./elements_user/UserProfileView.tsx";
import ProfileInfoPanel from "./general_elements/ProfileInfoPanel.tsx";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App/>
    </StrictMode>
)
