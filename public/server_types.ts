
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

export interface CreditCardInfo{
    number: string
    exp_date: string // mm/yy
    cvv: string
}

export interface Session{
    token: string;
    user:User;
    // other data
}
