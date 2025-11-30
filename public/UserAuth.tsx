import {type ReactNode, createContext, useContext} from "react";
import {Navigate} from "react-router-dom";

import {type Session, type User} from './db_types.ts';


export interface AuthContextType{
    session: Session | null;
    login: (data:User) => void;
    logout: () => void;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined)


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




