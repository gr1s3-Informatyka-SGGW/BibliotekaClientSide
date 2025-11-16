const regex = {
    firstName: /^(?=.{2,60}$)[\p{L}]+(?:[ '\-][\p{L}]+)*$/u,
    lastName: /^(?=.{2,80}$)[\p{L}]+(?:[ '\-][\p{L}]+)*$/u,
    email: /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,63}$/, // pragmatic
    phone: /^(?:(?:\+48)?\s?)?(?:\d{9}|(?:\d{3}[\s-]\d{3}[\s-]\d{3}))$/,
    street: /^(?=.{1,100}$)[\p{L}\d]+(?:[ .,'-\/]*\s*[\p{L}\d]+)*$/u,
    houseNo: /^(?=.{1,10}$)[A-Za-z0-9]+(?:\/[A-Za-z0-9]+)?$/,
    city: /^(?=.{1,80}$)[\p{L}]+(?:[ \-][\p{L}]+)*$/u,
    postal: /^\d{2}-\d{3}$/,
    cardNum: /^\d{13,19}$/, // format only; Luhn separately
    cardExp: /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/,
    cvv: /^\d{3,4}$/,
    password: /^(?=.{12,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#\$%\^&\*\(\)\-_:;\=\+\[\]\{\}\|;:'",<\.>\/\?`~]).+$/,
    title: /^(?=.{1,255}$)[\p{L}0-9][\p{L}0-9\s!?:;,. '"()\[\]{}/&+-]*$/u,
    author: /^(?=.{1,200}$)[\p{L}]+(?:[ '\-][\p{L}]+)*(?:\s*,\s*[\p{L}]+(?:[ '\-][\p{L}]+)*)*$/u,
    publisher: /^(?=.{1,150}$)[\p{L}0-9][\p{L}0-9\s&,.'-]*$/u,
    isbnFmt: /^(?:ISBN(?:-1[03])?:?\s*)?(?:\d{9}[\dXx]|\d{13}|\d{1,5}-\d{1,7}-\d{1,7}-[\dXx]?)$/,
    keywords: /^(?=.{0,500}$)(?:[^\s,]{1,50})(?:\s*,\s*[^\s,]{1,50}){0,19}$/,
    pages: /^(?:[1-9][0-9]{0,3}|10000)$/
};

// ---- Helpers ----
function luhnCheck(cardNumber) {
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

function parseExpiry(mmyy) {
    if (typeof mmyy !== 'string') return null;
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

function isCardExpiryValid(mmyy, now = new Date()) {
    const parsed = parseExpiry(mmyy);
    if (!parsed) return false;
    const { month, year } = parsed;
    if (month < 1 || month > 12) return false;
    // Card valid through end of expiry month
    const expiry = new Date(year, month - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return expiry >= currentMonth;
}

// ISBN helpers: remove hyphens and spaces then checksum
function isbnNormalize(isbn) {
    if (typeof isbn !== 'string') return null;
    return isbn.replace(/[^0-9Xx]/g, '');
}

function isbn10Check(isbn10) {
    if (!/^\d{9}[\dXx]$/.test(isbn10)) return false;
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        let ch = isbn10[i];
        const val = (ch === 'X' || ch === 'x') ? 10 : parseInt(ch, 10);
        sum += val * (10 - i);
    }
    return sum % 11 === 0;
}

function isbn13Check(isbn13) {
    if (!/^\d{13}$/.test(isbn13)) return false;
    let sum = 0;
    for (let i = 0; i < 13; i++) {
        const digit = parseInt(isbn13[i], 10);
        sum += (i % 2 === 0) ? digit : digit * 3;
    }
    return sum % 10 === 0;
}

function isbnValidate(isbn) {
    if (typeof isbn !== 'string') return false;
    const norm = isbnNormalize(isbn);
    if (!norm) return false;
    if (norm.length === 10) return isbn10Check(norm);
    if (norm.length === 13) return isbn13Check(norm);
    return false;
}

// Password common checks (basic). For breached-check use external service (not included here).
function passwordMeetsPolicy(pwd) {
    if (typeof pwd !== 'string') return false;
    if (!regex.password.test(pwd)) return false;
    // disallow whitespace
    if (/\s/.test(pwd)) return false;
    // could add banned-list check here
    return true;
}

// Generic sanitizers
function sanitizeTrim(input) {
    if (typeof input !== 'string') return input;
    return input.trim();
}

// Field validators - return { ok: boolean, reason?: string }
const validators = {
    firstName(val) {
        if (val === null || val === undefined) {
            return { ok: false, reason: 'Value cannot be null/undefined' };
        }

        const v = sanitizeTrim(val);
        if (v === '') {
            return { ok: false, reason: 'Value cannot be empty' };
        }

        if (!regex.firstName.test(v)) return { ok: false, reason: 'Invalid first name' };
        return { ok: true };
    },
// ...
    lastName(val) {
        const v = sanitizeTrim(val);
        if (!regex.lastName.test(v)) return { ok: false, reason: 'Invalid last name' };
        return { ok: true };
    },
    email(val) {
        const v = sanitizeTrim(val);
        if (!regex.email.test(v)) return { ok: false, reason: 'Invalid email' };
        return { ok: true };
    },
    phone(val) {
        const v = sanitizeTrim(val);
        if (!regex.phone.test(v)) return { ok: false, reason: 'Invalid phone' };
        return { ok: true };
    },
    street(val) {
        const v = sanitizeTrim(val);
        if (!regex.street.test(v)) return { ok: false, reason: 'Invalid street' };
        return { ok: true };
    },
    houseNo(val) {
        const v = sanitizeTrim(val);
        if (!regex.houseNo.test(v)) return { ok: false, reason: 'Invalid house number' };
        return { ok: true };
    },
    city(val) {
        const v = sanitizeTrim(val);
        if (!regex.city.test(v)) return { ok: false, reason: 'Invalid city' };
        return { ok: true };
    },
    postal(val) {
        const v = sanitizeTrim(val);
        if (!regex.postal.test(v)) return { ok: false, reason: 'Invalid postal code' };
        return { ok: true };
    },
    cardNum(val) {
        const v = String(val).replace(/\D/g, '');
        if (!regex.cardNum.test(v)) return { ok: false, reason: 'Invalid card number format' };
        if (!luhnCheck(v)) return { ok: false, reason: 'Failed Luhn check' };
        return { ok: true };
    },
    cardExp(val, now) {
        if (!regex.cardExp.test(String(val))) return { ok: false, reason: 'Invalid expiry format' };
        if (!isCardExpiryValid(String(val), now)) return { ok: false, reason: 'Card expired' };
        return { ok: true };
    },
    cvv(val) {
        const v = String(val).trim();
        if (!regex.cvv.test(v)) return { ok: false, reason: 'Invalid CVV' };
        return { ok: true };
    },
    password(val) {
        if (!passwordMeetsPolicy(val)) return { ok: false, reason: 'Password does not meet policy' };
        return { ok: true };
    },
    title(val) {
        const v = sanitizeTrim(val);
        if (!regex.title.test(v)) return { ok: false, reason: 'Invalid title' };
        return { ok: true };
    },
    author(val) {
        const v = sanitizeTrim(val);
        if (!regex.author.test(v)) return { ok: false, reason: 'Invalid author' };
        return { ok: true };
    },
    publisher(val) {
        const v = sanitizeTrim(val);
        if (!regex.publisher.test(v)) return { ok: false, reason: 'Invalid publisher' };
        return { ok: true };
    },
    isbn(val) {
        if (!regex.isbnFmt.test(String(val))) return { ok: false, reason: 'Invalid ISBN format' };
        if (!isbnValidate(String(val))) return { ok: false, reason: 'Invalid ISBN checksum' };
        return { ok: true };
    },
    keywords(val) {
        if (val === undefined || val === null || String(val).trim() === '') return { ok: true }; // optional
        if (!regex.keywords.test(String(val))) return { ok: false, reason: 'Invalid keywords' };
        return { ok: true };
    },
    pages(val) {
        if (!regex.pages.test(String(val))) return { ok: false, reason: 'Invalid page count' };
        return { ok: true };
    }
};

module.exports = { regex, validators, luhnCheck, isCardExpiryValid, isbnValidate, passwordMeetsPolicy };
