
export interface Rent{
    book: Book;
    borrow_data: Date;
    return_date: Date;
}
export interface Reservation{

}
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
    instances: {total: number, available: number}


}
export interface User{
    type: ('admin'|'user')
    name: string;
    email: string;

}

export interface Adres{
    city: string;
    postal_code: string;
    street_name: string;
    house_number: string;
}
export interface FullUserInfo{
    basic: User,
    adres: Adres,
    card_last_numbers: string
}
export interface Session{
    token: string;
    user:User;
    // other data
}
