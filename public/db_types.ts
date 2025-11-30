
export interface BookInfo{
    // !!!
}
export interface User{
    type: ('admin'|'user')
    name: string;
    email: string;
}
export interface Session{
    token: string;
    user:User;
    // other data
}
