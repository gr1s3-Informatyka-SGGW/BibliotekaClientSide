import {StrictMode, useContext, useState} from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import Collapsible from "../public/custom_components/Collapsible.tsx";


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Collapsible header={"Abba"}>
            <ul>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
                <li>a</li>
            </ul>
        </Collapsible>
    </StrictMode>
)
