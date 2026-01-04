/**
 * Zbiór wyrażeń regularnych wykorzystywanych do walidacji danych wejściowych.
 * * @author Dawid Filipek
 * @author Szymon Doba
 * * @property {RegExp} firstName - Walidacja imienia (2-60 znaków, obsługa Unicode).
 * @property {RegExp} lastName - Walidacja nazwiska (2-80 znaków, obsługa Unicode).
 * @property {RegExp} email - Walidacja formatu e-mail.
 * @property {RegExp} phone - Polski numer telefonu (opcjonalny prefiks +48, 9 cyfr).
 * @property {RegExp} street - Nazwa ulicy (1-100 znaków, znaki specjalne adresu).
 * @property {RegExp} houseNo - Numer domu/lokalu (np. 12, 12A, 15/4).
 * @property {RegExp} city - Nazwa miasta (1-80 znaków, myślniki/spacje).
 * @property {RegExp} postal - Polski kod pocztowy (format 00-000).
 * @property {RegExp} cardNum - Długość numeru karty kredytowej (13-19 cyfr).
 * @property {RegExp} cardExp - Data ważności karty (MM/YY lub MM/YYYY).
 * @property {RegExp} cvv - Kod bezpieczeństwa CVV (3 lub 4 cyfry).
 * @property {RegExp} password - Polityka hasła (min. 12 znaków, duża/mała litera, cyfra, znak specjalny).
 * @property {RegExp} title - Tytuł książki (1-255 znaków).
 * @property {RegExp} author - Autor (tekstowo lub numeryczne ID).
 * @property {RegExp} publisher - Nazwa wydawcy (1-150 znaków).
 * @property {RegExp} isbnFmt - Surowy format numeru ISBN.
 * @property {RegExp} keywords - Lista słów kluczowych (do 20 fraz, max 500 znaków).
 * @property {RegExp} pages - Liczba stron (1-10000).
 */
export const regex = {
    firstName: /^(?=.{2,60}$)\p{L}+(?:[ '\-][\p{L}]+)*$/u,
    lastName: /^(?=.{2,80}$)\p{L}+(?:[ '\-][\p{L}]+)*$/u,
    email: /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,63}$/,
    phone: /^(?:(?:\+48)?\s?)?(?:\d{9}|\d{3}[\s-]\d{3}[\s-]\d{3})$/,
    street: /^(?=.{1,100}$)[\p{L}\d]+(?:[ .,'-\/]*\s*[\p{L}\d]+)*$/u,
    houseNo: /^(?=.{1,10}$)[A-Za-z0-9]+(?:\/[A-Za-z0-9]+)?$/,
    city: /^(?=.{1,80}$)\p{L}+(?:[ \-]\p{L}+)*$/u,
    postal: /^\d{2}-\d{3}$/,
    cardNum: /^\d{13,19}$/,
    cardExp: /^([1-9]|0[1-9]|1[0-2])\/(\d{2}|\d{4})$/,
    cvv: /^\d{3,4}$/,
    password: /^(?=.{12,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_:;=+\[\]{}|'",<.>\/?`~]).+$/,
    title: /^(?=.{1,255}$)[\p{L}0-9][\p{L}0-9\s!?:;,. '"()\[\]{}/&+-]*$/u,
    author: /^(?=.{1,200}$)(\p{L}+(?:[ '\-]\p{L}+)*(?:\s*,\s*\p{L}+(?:[ '\-]\p{L}+)*)*$|^(\d+)$)/u,
    publisher: /^(?=.{1,150}$)[\p{L}0-9][\p{L}0-9\s&,.'-]*$/u,
    isbnFmt: /^(?:ISBN(?:-1[03])?:?\s*)?(?:\d{9}[\dXx]|\d{13}|\d{1,5}-\d{1,7}-\d{1,7}-[\dXx]?)$/,
    keywords: /^(?=.{0,500}$)[^\s,]{1,50}(?:\s*,\s*[^\s,]{1,50}){0,19}$/,
    pages: /^(?:[1-9][0-9]{0,3}|10000)$/
};

/**
 * Reprezentuje wynik operacji walidacji.
 * * @interface ValidationResult
 * @prop {boolean} ok - Określa, czy walidacja zakończyła się sukcesem.
 * @prop {string} [reason] - Opis przyczyny błędu w przypadku niepowodzenia.
 */
export interface ValidationResult {
    ok: boolean;
    reason?: string;
}

/**
 * Implementacja algorytmu Luhna do sprawdzania poprawności numerów kart płatniczych.
 * * @param {string | number | null | undefined} cardNumber - Numer karty do sprawdzenia.
 * @returns {boolean} True, jeśli suma kontrolna jest poprawna.
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
 * * @param {string | unknown} mmyy - Data w formacie "MM/YY" lub "MM/YYYY".
 * @returns {{ month: number; year: number } | null} Obiekt daty lub null przy błędzie.
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
 * * @param {string | unknown} mmyy - Data ważności karty (MM/YY).
 * @param {Date} [now=new Date()] - Data odniesienia do porównania.
 * @returns {boolean} True, jeśli karta jest nadal ważna.
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
 * * @param {unknown} isbn - Surowy ciąg znaków ISBN.
 * @returns {string | null} Znormalizowany ciąg znaków lub null.
 */
export function isbnNormalize(isbn: unknown): string | null {
    if (typeof isbn !== 'string') return null;
    return isbn.replace(/[^0-9Xx]/g, '');
}

/**
 * Sprawdza sumę kontrolną numeru ISBN-10.
 * * @param {string} isbn10 - Znormalizowany 10-cyfrowy numer ISBN.
 * @returns {boolean} Wynik weryfikacji sumy kontrolnej.
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
 * * @param {string} isbn13 - Znormalizowany 13-cyfrowy numer ISBN.
 * @returns {boolean} Wynik weryfikacji sumy kontrolnej.
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
 * * @param {unknown} isbn - Numer ISBN w dowolnym formacie tekstowym.
 * @returns {boolean} True, jeśli numer i jego suma kontrolna są poprawne.
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
 * Sprawdza, czy hasło spełnia wymagania polityki bezpieczeństwa.
 * * @param {unknown} pwd - Hasło do sprawdzenia.
 * @returns {boolean} True, jeśli hasło jest zgodne z polityką i nie zawiera spacji.
 */
export function passwordMeetsPolicy(pwd: unknown): boolean {
    if (typeof pwd !== 'string') return false;
    if (!regex.password.test(pwd)) return false;
    return !/\s/.test(pwd);
}

/**
 * Pomocnicza funkcja usuwająca białe znaki z początku i końca ciągu.
 * * @template T
 * @param {T} input - Dana dowolnego typu.
 * @returns {T | string} Przycięty string lub oryginalna wartość.
 */
export function sanitizeTrim<T>(input: T): T | string {
    if (typeof input !== 'string') return input;
    return input.trim();
}

/**
 * Obiekt zawierający gotowe walidatory pól formularzy.
 * Każda metoda przyjmuje wartość i zwraca wynik walidacji.
 * * @property {function} firstName - Walidacja imienia.
 * @property {function} lastName - Walidacja nazwiska.
 * @property {function} email - Walidacja e-mail.
 * @property {function} phone - Walidacja telefonu.
 * @property {function} street - Walidacja ulicy.
 * @property {function} houseNo - Walidacja numeru domu.
 * @property {function} city - Walidacja miasta.
 * @property {function} postal - Walidacja kodu pocztowego.
 * @property {function} cardNum - Walidacja karty (format + Luhn).
 * @property {function} cardExp - Walidacja daty ważności karty.
 * @property {function} cvv - Walidacja kodu CVV.
 * @property {function} password - Walidacja hasła.
 * @property {function} title - Walidacja tytułu.
 * @property {function} author - Walidacja autora.
 * @property {function} publisher - Walidacja wydawcy.
 * @property {function} isbn - Walidacja ISBN (format + suma kontrolna).
 * @property {function} keywords - Walidacja słów kluczowych.
 * @property {function} pages - Walidacja liczby stron.
 */
export const validators = {
    /** @param {unknown} val @returns {ValidationResult} */
    firstName(val: unknown): ValidationResult {
        if (val === null || val === undefined) {
            return { ok: false, reason: 'Value cannot be null/undefined' };
        }
        const v = sanitizeTrim(val) as string;
        if (v === '') return { ok: false, reason: 'Value cannot be empty' };
        if (!regex.firstName.test(v)) return { ok: false, reason: 'Invalid first name' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    lastName(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.lastName.test(v)) return { ok: false, reason: 'Invalid last name' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    email(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.email.test(v)) return { ok: false, reason: 'Invalid email' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    phone(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.phone.test(v)) return { ok: false, reason: 'Invalid phone' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    street(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.street.test(v)) return { ok: false, reason: 'Invalid street' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    houseNo(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.houseNo.test(v))
            return { ok: false, reason: 'Invalid house number' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    city(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.city.test(v)) return { ok: false, reason: 'Invalid city' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    postal(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.postal.test(v)) return { ok: false, reason: 'Invalid postal code' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    cardNum(val: unknown): ValidationResult {
        const v = String(val).replace(/\D/g, '');
        if (!regex.cardNum.test(v))
            return { ok: false, reason: 'Invalid card number format' };
        if (!luhnCheck(v)) return { ok: false, reason: 'Failed Luhn check' };
        return { ok: true };
    },

    /** * @param {unknown} val 
     * @param {Date} [now]
     * @returns {ValidationResult} 
     */
    cardExp(val: unknown, now?: Date): ValidationResult {
        const v = String(val);
        if (!regex.cardExp.test(v)) return { ok: false, reason: 'Invalid expiry format' };
        if (!isCardExpiryValid(v, now)) return { ok: false, reason: 'Card expired' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    cvv(val: unknown): ValidationResult {
        const v = String(val).trim();
        if (!regex.cvv.test(v)) return { ok: false, reason: 'Invalid CVV' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    password(val: unknown): ValidationResult {
        if (!passwordMeetsPolicy(val))
            return { ok: false, reason: 'Password does not meet policy' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    title(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.title.test(v)) return { ok: false, reason: 'Invalid title' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    author(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.author.test(v)) return { ok: false, reason: 'Invalid author' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    publisher(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.publisher.test(v))
            return { ok: false, reason: 'Invalid publisher' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    isbn(val: unknown): ValidationResult {
        const v = String(val);
        if (!regex.isbnFmt.test(v))
            return { ok: false, reason: 'Invalid ISBN format' };
        if (!isbnValidate(v))
            return { ok: false, reason: 'Invalid ISBN checksum' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    keywords(val: unknown): ValidationResult {
        if (val === undefined || val === null || String(val).trim() === '')
            return { ok: true };
        if (!regex.keywords.test(String(val)))
            return { ok: false, reason: 'Invalid keywords' };
        return { ok: true };
    },

    /** @param {unknown} val @returns {ValidationResult} */
    pages(val: unknown): ValidationResult {
        if (!regex.pages.test(String(val)))
            return { ok: false, reason: 'Invalid page count' };
        return { ok: true };
    }
};