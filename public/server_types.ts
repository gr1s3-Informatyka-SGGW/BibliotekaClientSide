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
    book_id?: number;
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
 * @type BookUser - używany przy pobieraniu informacji o książce w widoku użytkownika strony /catalog
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
 * @prop {string|undefined} credit_card_number - Używany tylko przy pobieraniu danych na rzecz strony /profile dla użytkownika, są to cztery ostatnie cyfry karty płatniczej
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
 * @interface IFilter - jest implementowany przez wszystkie typy filtrowania aplikacji co ułatwia generalizacje filtrowania
 * */
export interface IFilter{

}
/**
 * @type BookSearchFilter - typ zbierający informacje o filtrach nałożonych na wyświetlaną listę
 * @prop {string[]|undefined} author - Lista dozwolonych autorów
 * @prop {string[]|undefined} genre -  Lista dozwolonych gatunków
 * @prop {string[]|undefined} publisher - Lista dozwolonych wydawców
 * @prop {string[]|undefined} tags - Lista tagów, które mają zawierać zwrócone książki
 * @prop {string[]|undefined} language - Lista dozwolonych języków
 * @prop {object|undefined} release_date - zakres dat wydania
 * @prop {Date} release_date.from - dolna granica
 * @prop {Date} release_date.to - górna granica
 * @extends IFilter
 * */
export interface BookSearchFilter extends IFilter{
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
 * @type RentLogSearchFilter - typ używany do określania filtrów na nałożonych na wynik wyszukiwania na stronie /rented-books
 * @prop {'active'|'returned'|'un-payed'|undefined} states - status wypożyczenia
 * @prop {boolean|undefined} isOverdue - czy została naliczona kara w ramach tego wyporzyczenia
 * */
export interface RentLogSearchFilter extends IFilter{
    states?: 'active'|'returned'|'un-payed'
    isOverdue?: boolean
}
/**
 * @type UserListSearchFilter - nakłada filtr na wynik wyszukiwania na stronie /users-view
 * @prop {('user'|'admin'|'blocked')[]|undefined} status - jaki status ma użytkownika zostanie wyświetlony
 * */
export interface UserListSearchFilter extends IFilter{
    status?: ('user'|'admin'|'blocked')[]
}
/**
 * @type CatalogResponse - generyczny interfejs odpowiedzi serwera dla widoku katalogu
 * @prop {T[]} books - lista obiektów książek (BookUser[] lub BookAdmin[]) zwrócona dla bieżącej strony
 * @prop {number} totalPages - całkowita liczba stron dostępnych dla wybranych kryteriów wyszukiwania
 * @prop {number} totalBooks - łączna liczba wszystkich książek w bazie danych spełniających nałożone filtry
 * */
export interface CatalogResponse<T extends Book> {
    books: T[];
    totalPages: number;
    totalBooks: number;
}

/**
 * @type SearchSort
 * @prop {string} key - po którym atrybucie będzie dokonywane sortowanie
 * @prop {'DESC'|'ASC'} direction - czy sortowanie będzie się odbywać rosnąco (ASC) czy malejąco (DESC)
 * */
export interface SearchSort{
    key: string
    direction: 'DESC'|'ASC'
}


/**
 * @type UserInfo - informacje pobierane o użytkowniku na rzecz widoku /users-view dla administratora
 * @prop {string} name
 * @prop {string} surname
 * @prop {string} email
 * @prop {'user'|'admin'|'blocked'} status - informuje o poziomie dostępu użytkownika
 * @prop {Rent[]} currently_rented - lista historii wypożyczeń użytkownika
 * @prop {Reservation[]} currently_reserved - lista historii rezerwacji użytkownika
 * */
export interface UserInfo{
    name: string
    surname: string
    email: string
    status: 'user'|'admin'|'blocked'
    currently_rented: Rent[]
    currently_reserved: Reservation[]
}


/**
 * @type RentFullInfo - szczegółowe informacje o archiwalnym wypożyczeniu na rzecz widoku /rented-books
 * @param {User} user - użytkownik, który wypożyczył książkę
 * @param {Book} book - wypożyczona książka
 * @param {Date} borrow_date - data wypożyczenia
 * @param {Date} return_date - data zwrotu
 * */
export interface RentFullInfo{
    user:User
    book: Book
    borrow_date: Date
    return_date: Date
}