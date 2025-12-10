export const regex = {
    firstName: /^(?=.{2,60}$)[\p{L}]+(?:[ '\-][\p{L}]+)*$/u,
    lastName: /^(?=.{2,80}$)[\p{L}]+(?:[ '\-][\p{L}]+)*$/u,
    email: /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,63}$/,
    phone: /^(?:(?:\+48)?\s?)?(?:\d{9}|(?:\d{3}[\s-]\d{3}[\s-]\d{3}))$/,
    street: /^(?=.{1,100}$)[\p{L}\d]+(?:[ .,'-\/]*\s*[\p{L}\d]+)*$/u,
    houseNo: /^(?=.{1,10}$)[A-Za-z0-9]+(?:\/[A-Za-z0-9]+)?$/,
    city: /^(?=.{1,80}$)[\p{L}]+(?:[ \-][\p{L}]+)*$/u,
    postal: /^\d{2}-\d{3}$/,
    cardNum: /^\d{13,19}$/,
    cardExp: /^([1-9]|0[1-9]|1[0-2])\/(\d{2}|\d{4})$/,
    cvv: /^\d{3,4}$/,
    password: /^(?=.{12,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#\$%\^&\*\(\)\-_:;\=\+\[\]\{\}\|;:'",<\.>\/\?`~]).+$/,
    title: /^(?=.{1,255}$)[\p{L}0-9][\p{L}0-9\s!?:;,. '"()\[\]{}/&+-]*$/u,
    author: /^(?=.{1,200}$)([\p{L}]+(?:[ '\-][\p{L}]+)*(?:\s*,\s*[\p{L}]+(?:[ '\-][\p{L}]+)*)*$|^(\d+)$)/u,
    publisher: /^(?=.{1,150}$)[\p{L}0-9][\p{L}0-9\s&,.'-]*$/u,
    isbnFmt: /^(?:ISBN(?:-1[03])?:?\s*)?(?:\d{9}[\dXx]|\d{13}|\d{1,5}-\d{1,7}-\d{1,7}-[\dXx]?)$/,
    keywords: /^(?=.{0,500}$)(?:[^\s,]{1,50})(?:\s*,\s*[^\s,]{1,50}){0,19}$/,
    pages: /^(?:[1-9][0-9]{0,3}|10000)$/
};

export interface ValidationResult {
    ok: boolean;
    reason?: string;
}

// ---- Helpers ----

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

export function isbnNormalize(isbn: unknown): string | null {
    if (typeof isbn !== 'string') return null;
    return isbn.replace(/[^0-9Xx]/g, '');
}

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

export function isbn13Check(isbn13: string): boolean {
    if (!/^\d{13}$/.test(isbn13)) return false;

    let sum = 0;
    for (let i = 0; i < 13; i++) {
        const digit = parseInt(isbn13[i], 10);
        sum += i % 2 === 0 ? digit : digit * 3;
    }
    return sum % 10 === 0;
}

export function isbnValidate(isbn: unknown): boolean {
    if (typeof isbn !== 'string') return false;

    const norm = isbnNormalize(isbn);
    if (!norm) return false;

    if (norm.length === 10) return isbn10Check(norm);
    if (norm.length === 13) return isbn13Check(norm);

    return false;
}

export function passwordMeetsPolicy(pwd: unknown): boolean {
    if (typeof pwd !== 'string') return false;
    if (!regex.password.test(pwd)) return false;
    if (/\s/.test(pwd)) return false;
    return true;
}

export function sanitizeTrim<T>(input: T): T | string {
    if (typeof input !== 'string') return input;
    return input.trim();
}

export const validators = {
    firstName(val: unknown): ValidationResult {
        if (val === null || val === undefined) {
            return { ok: false, reason: 'Value cannot be null/undefined' };
        }
        const v = sanitizeTrim(val) as string;
        if (v === '') return { ok: false, reason: 'Value cannot be empty' };
        if (!regex.firstName.test(v)) return { ok: false, reason: 'Invalid first name' };
        return { ok: true };
    },

    lastName(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.lastName.test(v)) return { ok: false, reason: 'Invalid last name' };
        return { ok: true };
    },

    email(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.email.test(v)) return { ok: false, reason: 'Invalid email' };
        return { ok: true };
    },

    phone(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.phone.test(v)) return { ok: false, reason: 'Invalid phone' };
        return { ok: true };
    },

    street(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.street.test(v)) return { ok: false, reason: 'Invalid street' };
        return { ok: true };
    },

    houseNo(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.houseNo.test(v))
            return { ok: false, reason: 'Invalid house number' };
        return { ok: true };
    },

    city(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.city.test(v)) return { ok: false, reason: 'Invalid city' };
        return { ok: true };
    },

    postal(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.postal.test(v)) return { ok: false, reason: 'Invalid postal code' };
        return { ok: true };
    },

    cardNum(val: unknown): ValidationResult {
        const v = String(val).replace(/\D/g, '');
        if (!regex.cardNum.test(v))
            return { ok: false, reason: 'Invalid card number format' };
        if (!luhnCheck(v)) return { ok: false, reason: 'Failed Luhn check' };
        return { ok: true };
    },

    cardExp(val: unknown, now?: Date): ValidationResult {
        const v = String(val);
        if (!regex.cardExp.test(v)) return { ok: false, reason: 'Invalid expiry format' };
        if (!isCardExpiryValid(v, now)) return { ok: false, reason: 'Card expired' };
        return { ok: true };
    },

    cvv(val: unknown): ValidationResult {
        const v = String(val).trim();
        if (!regex.cvv.test(v)) return { ok: false, reason: 'Invalid CVV' };
        return { ok: true };
    },

    password(val: unknown): ValidationResult {
        if (!passwordMeetsPolicy(val))
            return { ok: false, reason: 'Password does not meet policy' };
        return { ok: true };
    },

    title(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.title.test(v)) return { ok: false, reason: 'Invalid title' };
        return { ok: true };
    },

    author(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.author.test(v)) return { ok: false, reason: 'Invalid author' };
        return { ok: true };
    },

    publisher(val: unknown): ValidationResult {
        const v = sanitizeTrim(val) as string;
        if (!regex.publisher.test(v))
            return { ok: false, reason: 'Invalid publisher' };
        return { ok: true };
    },

    isbn(val: unknown): ValidationResult {
        const v = String(val);
        if (!regex.isbnFmt.test(v))
            return { ok: false, reason: 'Invalid ISBN format' };
        if (!isbnValidate(v))
            return { ok: false, reason: 'Invalid ISBN checksum' };
        return { ok: true };
    },

    keywords(val: unknown): ValidationResult {
        if (val === undefined || val === null || String(val).trim() === '')
            return { ok: true }; // optional
        if (!regex.keywords.test(String(val)))
            return { ok: false, reason: 'Invalid keywords' };
        return { ok: true };
    },

    pages(val: unknown): ValidationResult {
        if (!regex.pages.test(String(val)))
            return { ok: false, reason: 'Invalid page count' };
        return { ok: true };
    }
};
