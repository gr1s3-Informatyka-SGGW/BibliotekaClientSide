/**
 * @file Plik definiujący typy przechowujące dane z serwera lub wysyłane na serwer
 * @author Szymon Credo
 * */

/**
 * @type Session zawiera dane obecnej sesji przeglądarki
 * @prop {string} token - obecny token sesji
 * @prop {'user'|'admin'} access - poziom uprawnień użytkownika
 * @prop {User} user - obecnie zalogowany użytkownik
* */
export interface Session{
    token: string;
    access: 'user'|'admin'
    user:User;
}
/**
 * @type Book zawiera dane na temat konkretnej książki
 * @prop {string} book_id - niewymagany przy np. dodawaniu nowej książki
 * @prop {string} title
 * @prop {string[]} authors
 * @prop {number} publish_year
 * @prop {string} isbn_number
 * @prop {number} length
 * @prop {string} language
 * @prop {string} publisher
 * @prop {string[]} keywords
 * @prop {string[]} genre
 * */
export interface Book{
    book_id?: string;
    title: string;
    authors: string[];

    publish_year: number;
    isbn_number: string;

    length: number;
    language: string;
    publisher: string;

    keywords: string[];
    genre: string[];
}

/**
 * @type BookAdmin - używany przy pobieraniu informacji o książce w widoku administratora /catalog.
 * Zawiera bardziej szczegółowe dane o książce
 * @extends Book
 * @prop {object[]} instances - lista egzemplarzy danej książki
 * @prop instances.id
 * @prop instances.status
 * */
export interface BookAdmin extends Book{
    instances: {
        id: number;
        status: "damaged"|"available"|"rented"|"reserved"
    }[]
}
/**
 * @type BookUser - używany przy pobieraniu informacji o książce w widoku użytkownika strony /katalog
 * @extends Book
 * @prop instances - informacje na temat instancji książki
 * @prop {number} instances.available - ilość dostepnych książek
 * @prop {number} instances.total - ilość książek razem z niedostepnymi (niezniszczonymi)
 * */
export interface BookUser extends Book{
    instances: {
        available: number
        total: number
    }
}

/**
 * @type Rent zawiera dane na temat wypożyczenia książki
 * @prop {Book} book - informacje o wypożyczonej książce
 * @prop {Date} borrow_date
 * @prop {Date} return_date
 * */
export interface Rent{
    book: Book;
    borrow_date: Date;
    return_date: Date;
}
/**
 * @type Reservation zawiera dane na temat rezerwacji książki
 * @prop {Book} book - informacje o wypożyczonej książce
 * @prop {Date} reserve_to - data, do której obowiązuje rezerwacja
 * */
export interface Reservation{
    book: Book
    reserve_to: Date
}
/**
 * @type User zawiera dane użytkownika
 * @prop {string} name
 * @prop {string} surname
 * @prop {string} email
 * @prop {string} credit_card_number - nieobowiązkowy. Używany tylko przy pobieraniu danych na rzecz strony /profile dla użytkownika, są to cztery ostatnie cyfry karty płatniczej
 * */
export interface User{
    name: string;
    surname: string;
    email: string;
    credit_card_number?: string
}
/**
 * @type CreditCardInfo
 * @prop {string} number
 * @prop {string} exp_date - w formacie tekstowym jako: mm/yy
 * @prop {string} cvv
 * */
export interface CreditCardInfo{
    number: string
    exp_date: string
    cvv: string
}

/**
 * @type BookSearchFilter - typ zbierający informacje o filtrach nałożonych na wyświetlaną listę
 * @prop {string[]} author - nieobowiązkowy. Lista dozwolonych autorów
 * @prop {string[]} genre - nieobowiązkowy. Lista dozwolonych gatunków
 * @prop {string[]} publisher - nieobowiązkowy. Lista dozwolonych wydawców
 * @prop {string[]} tags - nieobowiązkowy. Lista tagów, które mają zawierać zwrócone książki
 * @prop {string[]} language - nieobowiązkowy. Lista dozwolonych języków
 * @prop release_date - nieobowiązkowy. zakres dat wydania
 * @prop {Date} release_date.from - dolna granica
 * @prop {Date} release_date.to - górna granica
 *
 * */
export interface BookSearchFilter{
    author?: string[]
    genre?: string[]
    publisher?: string[]
    tags?: string[]
    language?: string[]
    release_date?: {
        from: Date
        to: Date
    }
}

/**
 * @type BookSearchSort
 * @prop {'author'|'title'| 'release_date'} key - po którym atrybucie będzie dokonywane sortowanie
 * @prop {'DESC'|'ASC'} direction - czy sortowanie będzie się odbywać rosnąco (ASC) czy malejąco (DESC)
 * */
export interface BookSearchSort{
    key: 'author'|'title'| 'release_date'
    direction: 'DESC'|'ASC'
}
/**
 * @type UserSearch
 * @prop
 * */
