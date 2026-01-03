/**
 * Zbiór wyrażeń regularnych wykorzystywanych do walidacji danych wejściowych.
 * @authors Dawid Filipek, Szymon Doba
*/
export const regex = {
    /** Walidacja imienia: 2-60 znaków, obsługa polskich znaków, dopuszcza spacje, apostrofy i myślniki. */
    firstName: /^(?=.{2,60}$)\p{L}+(?:[ '\-][\p{L}]+)*$/u,
    /** Walidacja nazwiska: 2-80 znaków, obsługa polskich znaków, dopuszcza spacje, apostrofy i myślniki. */
    lastName: /^(?=.{2,80}$)\p{L}+(?:[ '\-][\p{L}]+)*$/u,
    /** Standardowa walidacja formatu e-mail. */
    email: /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,63}$/,
    /** Walidacja polskiego numeru telefonu (opcjonalny prefiks +48, 9 cyfr). */
    phone: /^(?:(?:\+48)?\s?)?(?:\d{9}|\d{3}[\s-]\d{3}[\s-]\d{3})$/,
    /** Walidacja ulicy: 1-100 znaków, litery, cyfry i znaki specjalne adresu. */
    street: /^(?=.{1,100}$)[\p{L}\d]+(?:[ .,'-\/]*\s*[\p{L}\d]+)*$/u,
    /** Walidacja numeru domu/lokalu: np. 12, 12/4, 15A. */
    houseNo: /^(?=.{1,10}$)[A-Za-z0-9]+(?:\/[A-Za-z0-9]+)?$/,
    /** Walidacja nazwy miasta: 1-80 znaków, obsługa myślników i spacji. */
    city: /^(?=.{1,80}$)\p{L}+(?:[ \-]\p{L}+)*$/u,
    /** Walidacja polskiego kodu pocztowego (format 00-000). */
    postal: /^\d{2}-\d{3}$/,
    /** Walidacja długości numeru karty kredytowej (13-19 cyfr). */
    cardNum: /^\d{13,19}$/,
    /** Walidacja daty ważności karty w formacie MM/YY lub MM/YYYY. */
    cardExp: /^([1-9]|0[1-9]|1[0-2])\/(\d{2}|\d{4})$/,
    /** Walidacja kodu CVV (3 lub 4 cyfry). */
    cvv: /^\d{3,4}$/,
    /** Walidacja hasła: min. 12 znaków, jedna wielka litera, jedna mała litera, jedna cyfra i jeden znak specjalny. */
    password: /^(?=.{12,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_:;=+\[\]{}|'",<.>\/?`~]).+$/,
    /** Walidacja tytułu książki: 1-255 znaków, zaczyna się od litery lub cyfry. */
    title: /^(?=.{1,255}$)[\p{L}0-9][\p{L}0-9\s!?:;,. '"()\[\]{}/&+-]*$/u,
    /** Walidacja autora: dopuszcza format tekstowy lub numeryczny (ID). */
    author: /^(?=.{1,200}$)(\p{L}+(?:[ '\-]\p{L}+)*(?:\s*,\s*\p{L}+(?:[ '\-]\p{L}+)*)*$|^(\d+)$)/u,
    /** Walidacja nazwy wydawcy: 1-150 znaków. */
    publisher: /^(?=.{1,150}$)[\p{L}0-9][\p{L}0-9\s&,.'-]*$/u,
    /** Walidacja formatu numeru ISBN (10 lub 13). */
    isbnFmt: /^(?:ISBN(?:-1[03])?:?\s*)?(?:\d{9}[\dXx]|\d{13}|\d{1,5}-\d{1,7}-\d{1,7}-[\dXx]?)$/,
    /** Walidacja słów kluczowych: do 20 fraz oddzielonych przecinkami, max. 500 znaków. */
    keywords: /^(?=.{0,500}$)[^\s,]{1,50}(?:\s*,\s*[^\s,]{1,50}){0,19}$/,
    /** Walidacja liczby stron: od 1 do 10000. */
    pages: /^(?:[1-9][0-9]{0,3}|10000)$/
};

/**
 * Reprezentuje wynik operacji walidacji.
 * @prop
 */
export interface ValidationResult {
    /** Czy walidacja zakończyła się sukcesem */
    ok: boolean;
    /** Opcjonalny opis błędu w przypadku niepowodzenia. */
    reason?: string;
}

/**
 * Implementacja algorytmu Luhna do sprawdzania poprawności numerów kart płatniczych.
 * @param cardNumber - Numer karty do sprawdzenia.
 * @returns {boolean} true, jeśli suma kontrolna jest poprawna.
 */
export function luhnCheck(cardNumber: string | number | null | undefined): boolean {
    if (!cardNumber) return false;
    const s = String(cardNumber).replace(/\D/g, '');
    if (!/^\d{13,19}$/.test(s)) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = s.length - 1; i >= 0; i--) {
        let digit = parseInt(s[i], 10);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
}

/**
 * Parsuje ciąg znaków daty ważności karty na obiekt z miesiącem i rokiem.
 * @param mmyy - Data w formacie "MM/YY" lub "MM/YYYY".
 * @returns Obiekt {month, year} lub null, jeśli format jest niepoprawny.
 */
export function parseExpiry(mmyy: string | unknown): { month: number; year: number } | null {
    if (typeof mmyy !== 'string') return null;
    if (!regex.cardExp.test(mmyy)) return null;

    const m = mmyy.split('/');
    if (!m || m.length !== 2) return null;

    const mm = parseInt(m[0], 10);
    let yy = m[1];

    if (!/^(\d{2}|\d{4})$/.test(yy)) return null;
    if (yy.length === 2) yy = '20' + yy;

    const y = parseInt(yy, 10);
    if (Number.isNaN(mm) || Number.isNaN(y)) return null;

    return { month: mm, year: y };
}

/**
 * Sprawdza, czy karta płatnicza nie straciła ważności względem podanej daty.
 * @param mmyy - Data ważności karty (MM/YY).
 * @param now - Data odniesienia (domyślnie aktualna data).
 * @returns true, jeśli karta jest ważna.
 */
export function isCardExpiryValid(
    mmyy: string | unknown,
    now: Date = new Date()
): boolean {
    const parsed = parseExpiry(mmyy);
    if (!parsed) return false;

    const { month, year } = parsed;
    if (month < 1 || month > 12) return false;

    const expiry = new Date(year, month - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return expiry >= currentMonth;
}

/**
 * Usuwa z numeru ISBN wszystkie znaki poza cyframi oraz znakiem 'X'.
 * @param isbn - Surowy ciąg znaków ISBN.
 * @returns Znormalizowany ciąg znaków lub null.
 */
export function isbnNormalize(isbn: unknown): string | null {
    if (typeof isbn !== 'string') return null;
    return isbn.replace(/[^0-9Xx]/g, '');
}

/**
 * Sprawdza sumę kontrolną numeru ISBN-10.
 * @param isbn10 - Znormalizowany 10-cyfrowy numer ISBN.
 */
export function isbn10Check(isbn10: string): boolean {
    if (!/^\d{9}[\dXx]$/.test(isbn10)) return false;

    let sum = 0;
    for (let i = 0; i < 10; i++) {
        const ch = isbn10[i];
        const val = ch === 'X' || ch === 'x' ? 10 : parseInt(ch, 10);
        sum += val * (10 - i);
    }
    return sum % 11 === 0;
}

/**
 * Sprawdza sumę kontrolną numeru ISBN-13.
 * @param isbn13 - Znormalizowany 13-cyfrowy numer ISBN.
 */
export function isbn13Check(isbn13: string): boolean {
    if (!/^\d{13}$/.test(isbn13)) return false;

    let sum = 0;
    for (let i = 0; i < 13; i++) {
        const digit = parseInt(isbn13[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    return sum % 10 === 0;
}

/**
 * Kompleksowa walidacja numeru ISBN (obsługuje ISBN-10 i ISBN-13).
 * @param isbn - Numer ISBN w dowolnym formacie tekstowym.
 * @returns true, jeśli numer jest poprawny.
 */
export function isbnValidate(isbn: unknown): boolean {
    if (typeof isbn !== 'string') return false;

    const norm = isbnNormalize(isbn);
    if (!norm) return false;

    if (norm.length === 10) return isbn10Check(norm);
    if (norm.length === 13) return isbn13Check(norm);

    return false;
}

/**
 * Sprawdza, czy hasło spełnia wymagania polityki bezpieczeństwa (regex + brak spacji).
 * @param pwd - Hasło do sprawdzenia.
 */
export function passwordMeetsPolicy(pwd: unknown): boolean {
    if (typeof pwd !== 'string') return false;
    if (!regex.password.test(pwd)) return false;
    return !/\s/.test(pwd);
}

/**
 * Pomocnicza funkcja usuwająca białe znaki z początku i końca ciągu.
 * @param input - dana dowolnego typu danych.
 * @template T - typ parametru input
 * @returns Przycięty ciąg znaków, jeśli wejście było stringiem, w przeciwnym razie oryginał.
 */
export function sanitizeTrim<T>(input: T): T | string {
    if (typeof input !== 'string') return input;
    return input.trim();
}

/**
 * Obiekt zawierający gotowe walidatory dla poszczególnych pól formularzy.
 * Każda metoda zwraca obiekt `ValidationResult`.
 * @prop {(val:unknown)=> ValidationResult} firstName walidacja imienia
 */
export const validators = {
    /** Waliduje imię. */
    firstName(val: unknown): ValidationResult {
        if (val === null || val === undefined) {
            return { ok: false, reason: 'Value cannot be null/undefined' };
        }
        const v = sanitizeTrim(val) as string;
        if (v === '') return { ok: false, reason: 'Value cannot be empty' };
        if (!regex.firstName.test(v)) return { ok: false, reason: 'Invalid first name' };
        return { ok: true };
    },

    /** Waliduje nazwisko. */
    lastName(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.lastName.test(v)) return { ok: false, reason: 'Invalid last name' };
        return { ok: true };
    },

    /** Waliduje adres e-mail. */
    email(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.email.test(v)) return { ok: false, reason: 'Invalid email' };
        return { ok: true };
    },

    /** Waliduje numer telefonu. */
    phone(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.phone.test(v)) return { ok: false, reason: 'Invalid phone' };
        return { ok: true };
    },

    /** Waliduje nazwę ulicy. */
    street(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.street.test(v)) return { ok: false, reason: 'Invalid street' };
        return { ok: true };
    },

    /** Waliduje numer domu/lokalu. */
    houseNo(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.houseNo.test(v))
            return { ok: false, reason: 'Invalid house number' };
        return { ok: true };
    },

    /** Waliduje nazwę miasta. */
    city(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.city.test(v)) return { ok: false, reason: 'Invalid city' };
        return { ok: true };
    },

    /** Waliduje kod pocztowy. */
    postal(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.postal.test(v)) return { ok: false, reason: 'Invalid postal code' };
        return { ok: true };
    },

    /** Waliduje numer karty (format + algorytm Luhna). */
    cardNum(val: unknown): ValidationResult {
        const v = String(val).replace(/\D/g, '');
        if (!regex.cardNum.test(v))
            return { ok: false, reason: 'Invalid card number format' };
        if (!luhnCheck(v)) return { ok: false, reason: 'Failed Luhn check' };
        return { ok: true };
    },

    /** Waliduje datę ważności karty. */
    cardExp(val: unknown, now?: Date): ValidationResult {
        const v = String(val);
        if (!regex.cardExp.test(v)) return { ok: false, reason: 'Invalid expiry format' };
        if (!isCardExpiryValid(v, now)) return { ok: false, reason: 'Card expired' };
        return { ok: true };
    },

    /** Waliduje kod CVV. */
    cvv(val: unknown): ValidationResult {
        const v = String(val).trim();
        if (!regex.cvv.test(v)) return { ok: false, reason: 'Invalid CVV' };
        return { ok: true };
    },

    /** Waliduje hasło zgodnie z polityką bezpieczeństwa. */
    password(val: unknown): ValidationResult {
        if (!passwordMeetsPolicy(val))
            return { ok: false, reason: 'Password does not meet policy' };
        return { ok: true };
    },

    /** Waliduje tytuł. */
    title(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.title.test(v)) return { ok: false, reason: 'Invalid title' };
        return { ok: true };
    },

    /** Waliduje autora. */
    author(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.author.test(v)) return { ok: false, reason: 'Invalid author' };
        return { ok: true };
    },

    /** Waliduje nazwę wydawcy. */
    publisher(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.publisher.test(v))
            return { ok: false, reason: 'Invalid publisher' };
        return { ok: true };
    },

    /** Waliduje numer ISBN (format + suma kontrolna). */
    isbn(val: unknown): ValidationResult {
        const v = String(val);
        if (!regex.isbnFmt.test(v))
            return { ok: false, reason: 'Invalid ISBN format' };
        if (!isbnValidate(v))
            return { ok: false, reason: 'Invalid ISBN checksum' };
        return { ok: true };
    },

    /** Waliduje listę słów kluczowych (opcjonalne). */
    keywords(val: unknown): ValidationResult {
        if (val === undefined || val === null || String(val).trim() === '')
            return { ok: true }; // opcjonalne
        if (!regex.keywords.test(String(val)))
            return { ok: false, reason: 'Invalid keywords' };
        return { ok: true };
    },

    /** Waliduje liczbę stron. */
    pages(val: unknown): ValidationResult {
        if (!regex.pages.test(String(val)))
            return { ok: false, reason: 'Invalid page count' };
        return { ok: true };
    }
};