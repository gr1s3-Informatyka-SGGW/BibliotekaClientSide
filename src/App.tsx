import {useState, lazy, Suspense} from 'react'
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom'
// general
const AboutUs = lazy(()=>import('./AboutUs'))
import {Error404, AccessDeniedError} from "./Errors.tsx" // named exports nie działa dla lazy
import {type User, type Session} from '../public/db_types.ts'
import {AuthContext, ProtectedRoute} from "../public/UserAuth";

// login
const Login = lazy(()=> import("./login/Login"));
const PasswordReset = lazy(()=> import("./login/PasswordReset"))
const Register = lazy(()=>import("./login/Register"));

// shared
const CatalogView = lazy(()=> import('./general_elements/CatalogView'))

// user only
const UserProfileView = lazy(()=> import("./elements_user/UserProfileView"))

// admin only
const AdminProfileView = lazy(()=> import("./elements_admin/AdminProfileView.tsx"))
const UsersListView = lazy(()=> import("./elements_admin/UsersListView.tsx"))
const AddBookView = lazy(()=> import("./elements_admin/AddBookView.tsx"))
const RentedBooksListView = lazy(()=> import("./elements_admin/RentedBooksListView.tsx"))



export default function App(){


    const [session, setSession] = useState<Session | null>(null);
    const login = (user: User) => setSession({token:'', user: user, });
    const logout = () => setSession(null);

    return (
        <AuthContext.Provider value={{ session, login, logout }}>
            <Suspense fallback={<h1>Loading</h1>}>
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
            </Suspense>
        </AuthContext.Provider>

    )
}
