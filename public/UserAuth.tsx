import {useState, type ReactNode, createContext, useContext} from "react";
import {Navigate} from "react-router-dom";

export interface User{
    token: string;
    name: string;
    type: ('admin'|'user')
    // other data
}
interface AuthContextType{
    user: User | null;
    login: (data:User) => void;
    logout: () => void;

}
const AuthContext = createContext<AuthContextType | undefined>(undefined)
export function AuthProvider({children}:{children:ReactNode}){
    const [user, setUser] = useState<User | null>(null);

    const login = (data: User) => setUser(data);
    const logout = () => setUser(null);

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// przenosi do strony tylko i wyłącznie użytkowników danego typu
export function ProtectedRoute( props:{mode:('admin'|'user'|null), children: ReactNode, reroute_path?: (string | undefined)}){

    let user = useContext(AuthContext)?.user
    let user_mode = user != null ? user.type : null

    let protection_mode = props.mode
    let reroute = <Navigate to={props.reroute_path == undefined ? '/' : props.reroute_path}/>
    if(protection_mode != user_mode )
        return reroute
    else
        return props.children

}




