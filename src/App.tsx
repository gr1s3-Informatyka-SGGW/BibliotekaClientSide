import {useState} from 'react'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
// general
import AboutUs from './AboutUs'
import Error, {Error404, AccessDeniedError} from "./Errors.tsx";

// login
import Login from "./login/Login";
import PasswordReset from "./login/PasswordReset";
import Register from "./login/Register";

// shared
import CatalogView from "./general_elements/CatalogView";

// user only
import UserProfileView from "./elements_user/UserProfileView";

// admin only
import AdminProfileView from "./elements_admin/AdminProfileView.tsx";
import UsersListView from "./elements_admin/UsersListView.tsx";
import AddBookView from "./elements_admin/AddBookView.tsx";
import RentedBooksListView from "./elements_admin/RentedBooksListView.tsx";

// react
import {type User, type Session} from '../public/db_types.ts'
import {AuthContext, ProtectedRoute} from "../public/UserAuth";
import React from "react";

export default function App(){


    const [session, setSession] = useState<Session | null>(null);
    const login = (user: User) => setSession({token:'', user: user, });
    const logout = () => setSession(null);

    return (
        <AuthContext.Provider value={{ session, login, logout }}>
            <BrowserRouter>
                <Routes>
                    {/*Poprawić error 404*/}
                    <Route path='/:invalid_path' element={<Error404/>}/>
                    <Route path='/about-us' element={<AboutUs/>} />

                    <Route path='/' element={
                        <Navigate to='/login'/>
                    }/>


                    <Route path='/login' element={
                        <ProtectedRoute mode={null} reroute_path='/'><Login/></ProtectedRoute>
                    }/>
                    <Route path='/register' element={
                        <ProtectedRoute mode={null} reroute_path='/'><Register/></ProtectedRoute>
                    }/>
                    <Route path='/password-reset' element={
                        <ProtectedRoute mode={null} reroute_path='/'><PasswordReset/></ProtectedRoute>
                    }/>




                </Routes>

            </BrowserRouter>
        </AuthContext.Provider>

    )
}
