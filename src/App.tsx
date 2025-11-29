
import {BrowserRouter, Routes, Route, } from 'react-router-dom'

import Login from "./Login/Login";
import PasswordReset from "./Login/PasswordReset";
import Register from "./Login/Register";

import AboutUs from './AboutUs.tsx'
import {AuthProvider} from "../public/UserAuth.tsx";



function App(){


    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path={'/about-us'} element={<AboutUs/>} />

                    <Route path={'/'} element={<Login/>}/>
                    <Route path={'/login'} element={<Login/>}/>
                    <Route path={'/register'} element={<Register/>}/>
                    <Route path={'/password-reset'} element={<PasswordReset/>}/>


                </Routes>

            </BrowserRouter>
        </AuthProvider>

    )
}

export default App;