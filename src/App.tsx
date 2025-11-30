import {useState} from 'react'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'

import Login from "./login/Login";
import PasswordReset from "./login/PasswordReset";
import Register from "./login/Register";


import AboutUs from './AboutUs'
import Error404 from "./error404.tsx";

import {type User, type Session} from '../public/db_types.ts'
import {AuthContext, ProtectedRoute} from "../public/UserAuth.tsx";

function App(){


    const [session, setSession] = useState<User | null>(null);

    const login = (data: Session) => setUser(Session);
    const logout = () => setUser({token:'', name:'', type:'user'});


    return (
        <AuthContext.Provider value={{ user, login, logout }}>
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

export default App;