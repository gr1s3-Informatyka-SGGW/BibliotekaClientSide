
export interface Book{
    book_id: string;
    title: string;
    authors: string[];

    publish_year: number;
    isbn_number: string;

    length: number;
    language: string;
    publisher: string;

    keywords: string[];
    genre: string[];
    instances: {total: number, available: number}[]


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
