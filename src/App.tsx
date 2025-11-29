import {useState} from 'react'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'

import Login from "./Login/Login";
import PasswordReset from "./Login/PasswordReset";
import Register from "./Login/Register";

// import {default as UserCatalogView} from './User/CatalogView'
// import {default as UserProfileView} from './User/ProfileView'


import AboutUs from './AboutUs'
import Error404 from "./error404.tsx";

import {AuthContext, ProtectedRoute, type User} from "../public/UserAuth.tsx";




function App(){


    const [user, setUser] = useState<User | null>(null);

    const login = (data: User) => setUser(data);
    const logout = () => setUser({token:'', name:'', type:'user'});


    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            <BrowserRouter>
                <Routes>
                    <Route path='/:invalid_path' element={<Error404/>}/>
                    <Route path='/about-us' element={<AboutUs/>} />

                    <Route path='/' element={
                        <Navigate to='/katalog'/>
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