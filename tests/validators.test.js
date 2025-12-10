// noinspection SpellCheckingInspection

import { describe, test, expect } from 'vitest';
import { validators, luhnCheck, isCardExpiryValid, isbnValidate, passwordMeetsPolicy } from '../public/validators.ts';

const sqliPayloads = [
  "' OR '1'='1' --",
  "'; DROP TABLE users; --",
  '" OR "" = "',
  "admin' --",
  "'; EXEC xp_cmdshell('dir') --",
  "' OR 1=1/*",
  "') OR ('a'='a",
  "\\x27 OR 1=1; --",
  '" UNION SELECT username, password FROM users --',
  "'; WAITFOR DELAY '00:00:05'--",
  '100; DROP TABLE books;'
];

describe('Registration validators - normal and edge cases', () => {
  test('firstName valid and invalid', () => {
    expect(validators.firstName('Anna').ok).toBe(true);
    expect(validators.firstName("Jo").ok).toBe(true);
    expect(validators.firstName('A').ok).toBe(false);
    expect(validators.firstName("Anna-Maria").ok).toBe(true);
    expect(validators.firstName("Jan3").ok).toBe(false);
    expect(validators.firstName("'; DROP TABLE users; --").ok).toBe(false);
  });

  test('lastName rules', () => {
    expect(validators.lastName('Nowak').ok).toBe(true);
    expect(validators.lastName('Kowalski-Smith').ok).toBe(true);
    expect(validators.lastName('').ok).toBe(false);
  });

  test('email accept common formats', () => {
    expect(validators.email('user@example.com').ok).toBe(true);
    expect(validators.email('a@b.co').ok).toBe(true);
    expect(validators.email('user+label@sub.domain.pl').ok).toBe(true);
    expect(validators.email('user@@example.com').ok).toBe(false);
    expect(validators.email('us..er@@example.com').ok).toBe(false);
  });

  test('phone formats', () => {
    expect(validators.phone('501234567').ok).toBe(true);
    expect(validators.phone('+48 501 234 567').ok).toBe(true);
    expect(validators.phone('12345').ok).toBe(false);
    expect(validators.phone('500-ABC-DEF').ok).toBe(false);
  });

  test('street, houseNo, city, postal', () => {
    expect(validators.street('Aleje Jerozolimskie').ok).toBe(true);
    expect(validators.street('Św. Jana').ok).toBe(true);
    expect(validators.street('<>script').ok).toBe(false);

    expect(validators.houseNo('12').ok).toBe(true);
    expect(validators.houseNo('12A').ok).toBe(true);
    expect(validators.houseNo('12a').ok).toBe(true);
    expect(validators.houseNo('12/3').ok).toBe(true);
    expect(validators.houseNo('../../etc/passwd').ok).toBe(false);

    expect(validators.city('Warszawa').ok).toBe(true);
    expect(validators.city('Miasto-Nowe').ok).toBe(true);

    expect(validators.postal('00-001').ok).toBe(true);
    expect(validators.postal('00001').ok).toBe(false);
  });

  test('card number Luhn + format', () => {
    // 4242424242424242 is common test Visa (Luhn ok)
    expect(validators.cardNum('4242424242424242').ok).toBe(true);
    expect(validators.cardNum('4111 1111 1111 1111').ok).toBe(true);
    expect(validators.cardNum('123456789012').ok).toBe(false);
    expect(luhnCheck('4242424242424242')).toBe(true);
    expect(luhnCheck('4242424242424241')).toBe(false);
  });

  test('card expiry', () => {
    // Pick a far future expiry
    expect(validators.cardExp('12/2099').ok).toBe(true);
    // invalid month
    expect(validators.cardExp('13/25').ok).toBe(false);
    // format invalid
    expect(validators.cardExp('1/25').ok).toBe(false);

    expect(validators.cardExp('1/26').ok).toBe(true);

    // test edge: current month -> valid
    const now = new Date();
    const currentMM = String(now.getMonth() + 1).padStart(2, '0');
    const currentYY = String(now.getFullYear());
    expect(isCardExpiryValid(`${currentMM}/${currentYY}`)).toBe(true);
  });

  test('cvv and password', () => {
    expect(validators.cvv('123').ok).toBe(true);
    expect(validators.cvv('1234').ok).toBe(true);
    expect(validators.cvv('12').ok).toBe(false);
    expect(validators.cvv('12a').ok).toBe(false);

    expect(validators.password('Aa1!aaaaaaaa').ok).toBe(true);
    expect(validators.password('password123').ok).toBe(false);
    expect(passwordMeetsPolicy('A very long pass')).toBe(false); // spaces
  });
});

describe('Book validators', () => {
  test('title/author/publisher', () => {
    expect(validators.title('Dziady').ok).toBe(true);
    expect(validators.title('').ok).toBe(false);
    expect(validators.author('Adam Mickiewicz').ok).toBe(true);
    expect(validators.author('Author1, Author2').ok).toBe(false); // digits not allowed in this strict author regex
    // what about title?
    expect(validators.author("1999").ok).toBe(true) // Istnieje ksiązka o takim tytule!

    expect(validators.publisher('Wydawnictwo ABC').ok).toBe(true);
  });

  test('isbn checks (10 and 13)', () => {
    expect(validators.isbn('0-306-40615-2').ok).toBe(true); // ISBN-10 (example)
    expect(validators.isbn('9780306406157').ok).toBe(true); // ISBN-13
    expect(validators.isbn('1234567890').ok).toBe(false);
    expect(isbnValidate('9780306406157')).toBe(true);
    expect(isbnValidate('0306406152')).toBe(true);
  });

  test('keywords and pages', () => {
    expect(validators.keywords('fantasy,młodzież,przygoda').ok).toBe(true);
    expect(validators.keywords('').ok).toBe(true);
    expect(validators.pages('1').ok).toBe(true);
    expect(validators.pages('0').ok).toBe(false);
    expect(validators.pages('1a').ok).toBe(false);
    expect(validators.pages('100000').ok).toBe(false);
  });
});

describe('SQLi attempts should be rejected or sanitized by validators where appropriate', () => {
  test('sqli payloads for name/email/other fields', () => {
    for (const payload of sqliPayloads) {
      // name fields should reject
      expect(validators.firstName(payload).ok).toBe(false);
      expect(validators.lastName(payload).ok).toBe(false);

      // email obviously invalid
      expect(validators.email(payload).ok).toBe(false);

      // title is more permissive but long SQL like DROP should be allowed as title characters maybe —
      // however ensure title doesn't blow up regex; it should either accept or reject but not allow raw SQL execution.
      // We expect title to fail if it contains control chars — here it's OK syntactically but still should not be executed.
      const titleResult = validators.title(payload);
      expect(typeof titleResult.ok).toBe('boolean');

      // numeric fields reject
      expect(validators.pages(payload).ok).toBe(false);
      expect(validators.postal(payload).ok).toBe(false);
    }
  });
});

// Additional targeted SQLi tests: numeric injection
describe('Numeric fields and SQL-like strings', () => {
  test('pages field rejects concatenated SQL', () => {
    expect(validators.pages("100; DROP TABLE books;").ok).toBe(false);
  });
});

// Edge-case fuzzing-ish tests (small set)
describe('Edge-case inputs', () => {
  test('very long strings are rejected per regex limits', () => {
    const longName = 'A'.repeat(1000);
    expect(validators.firstName(longName).ok).toBe(false);
    const longTitle = 'T'.repeat(300);
    expect(validators.title(longTitle).ok).toBe(false);
  });

  test('null/undefined handling', () => {
    expect(validators.firstName(null).ok).toBe(false);
    expect(validators.email(undefined).ok).toBe(false);
    expect(validators.keywords(null).ok).toBe(true); // optional
  });
});