import type { BookAdmin, BookSearchFilter, BookUser, SearchSort } from "../src/server/server_types.ts";

export const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
export const randDelay = () => 100 + Math.floor(Math.random() * 401); // 100-500 ms

// Prosty filter / search
export const matchesFilter = (b: BookAdmin, search: string | undefined, filter?: BookSearchFilter) => {
    if (search) {
        const q = search.toLowerCase();
        const inTitle = b.title.toLowerCase().includes(q);
        const inAuthors = b.authors.join(" ").toLowerCase().includes(q);
        const inKeywords = b.keywords.join(" ").toLowerCase().includes(q);
        if (!(inTitle || inAuthors || inKeywords)) return false;
    }
    if (!filter) return true;
    if (filter.author && filter.author.length > 0) {
        const ok = filter.author.some(a => b.authors.map(x => x.toLowerCase()).includes(a.toLowerCase()));
        if (!ok) return false;
    }
    if (filter.genre && filter.genre.length > 0) {
        const ok = filter.genre.some(g => b.genre.map(x => x.toLowerCase()).includes(g.toLowerCase()));
        if (!ok) return false;
    }
    if (filter.publisher && filter.publisher.length > 0) {
        if (!filter.publisher.map(p => p.toLowerCase()).includes(b.publisher.toLowerCase())) return false;
    }
    if (filter.tags && filter.tags.length > 0) {
        const ok = filter.tags.some(t => b.keywords.map(k => k.toLowerCase()).includes(t.toLowerCase()));
        if (!ok) return false;
    }
    if (filter.language && filter.language.length > 0) {
        if (!filter.language.map(l => l.toLowerCase()).includes(b.language.toLowerCase())) return false;
    }
    if (filter.release_date) {
        const from = filter.release_date.from;
        const to = filter.release_date.to;
        const year = b.publish_year;
        if (from && year < from.getFullYear()) return false;
        if (to && year > to.getFullYear()) return false;
    }
    return true;
};

export const applySort = (arr: BookAdmin[], sort?: SearchSort) => {
    if (!sort) return arr;
    const { key, direction } = sort;
    const dir = direction === "ASC" ? 1 : -1;
    return [...arr].sort((a, b) => {
        const va: any = (a as any)[key];
        const vb: any = (b as any)[key];
        if (va == null && vb == null) return 0;
        if (va == null) return -1 * dir;
        if (vb == null) return 1 * dir;
        if (typeof va === "string") return va.localeCompare(vb) * dir;
        if (typeof va === "number") return (va - vb) * dir;
        return 0;
    });
};

// Transform helper: BookAdmin -> BookUser
export const toBookUser = (b: BookAdmin): BookUser => {
    const total = b.instances.length;
    const available = b.instances.filter(i => i.status === "available").length;
    const copy: BookUser = {
        book_id: b.book_id,
        title: b.title,
        authors: b.authors,
        publish_year: b.publish_year,
        isbn_number: b.isbn_number,
        length: b.length,
        language: b.language,
        publisher: b.publisher,
        keywords: b.keywords,
        genre: b.genre,
        instances: { available, total }
    };
    return copy;
};

// Pagination helper
export const paginate = <T>(items: T[], page: number, perPage = 10) => {
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    const p = Math.max(1, Math.min(page, totalPages));
    const start = (p - 1) * perPage;
    return { page: p, totalPages, items: items.slice(start, start + perPage) };
};

export const SAMPLE_AUTHORS = [
    "Olga Tokarczuk", "Stanisław Lem", "Zygmunt Miłoszewski", "Małgorzata Musierowicz",
    "Remigiusz Mróz", "Andrzej Sapkowski", "Szczepan Twardoch", "Joanna Bator",
    "Jakub Małecki", "Stephen King", "J.K. Rowling", "George R.R. Martin",
    "Haruki Murakami", "Jo Nesbø", "Agatha Christie", "Brandon Sanderson",
    "Frank Herbert", "Isaac Asimov", "Fiodor Dostojewski", "Harlan Coben"
];

export const SAMPLE_TAGS = [
    "fantastyka", "kryminał", "romans", "non-fiction", "historyczna",
    "thriller", "psychologiczna", "biografia", "klasyka", "cyberpunk",
    "reportaż", "esej", "magiczny realizm", "postapo", "kosmos", "religia"
];

export const SAMPLE_GENRES = [
    "Fantasy", "Kryminał", "Romans", "Literatura faktu", "Sci-Fi",
    "Thriller", "Horror", "Literatura piękna", "Dramat", "Młodzieżowa"
];

export const SAMPLE_PUBLISHERS = [
    "Znak", "W.A.B.", "Czarne", "Agora", "Nasza Księgarnia",
    "Wydawnictwo Literackie", "Muza", "Prószyński i S-ka", "Albatros", "Rebis", "Powergraph"
];

export const SAMPLE_LANGUAGES = [
    "polski", "angielski", "niemiecki", "francuski", "hiszpański", "japoński", "rosyjski"
];

export const SAMPLE_BOOKS: BookAdmin[] = [
    {
        book_id: 1,
        title: "Lśnienie",
        authors: ["Stephen King"],
        publish_year: 1977,
        isbn_number: "9780450040184",
        length: 447,
        language: "angielski",
        publisher: "Albatros",
        keywords: ["horror", "psychologia"],
        genre: ["Horror"],
        instances: [{ id: 101, status: "available" }, { id: 102, status: "rented" }]
    },
    {
        book_id: 2,
        title: "Bieguni",
        authors: ["Olga Tokarczuk"],
        publish_year: 2007,
        isbn_number: "9788308041234",
        length: 360,
        language: "polski",
        publisher: "Wydawnictwo Literackie",
        keywords: ["podróż", "esej", "magiczny realizm"],
        genre: ["Literatura piękna"],
        instances: [{ id: 301, status: "available" }]
    },
    {
        book_id: 3,
        title: "Solaris",
        authors: ["Stanisław Lem"],
        publish_year: 1961,
        isbn_number: "9788308050000",
        length: 296,
        language: "polski",
        publisher: "Wydawnictwo Literackie",
        keywords: ["kosmos", "psychologia", "sci-fi"],
        genre: ["Sci-Fi"],
        instances: [{ id: 401, status: "available" }, { id: 402, status: "available" }]
    },
    {
        book_id: 4,
        title: "Ziarno prawdy",
        authors: ["Zygmunt Miłoszewski"],
        publish_year: 2011,
        isbn_number: "9788374149587",
        length: 440,
        language: "polski",
        publisher: "W.A.B.",
        keywords: ["kryminał", "sandomierz", "śledztwo"],
        genre: ["Kryminał"],
        instances: [{ id: 501, status: "rented" }]
    },
    {
        book_id: 5,
        title: "Opium w rosole",
        authors: ["Małgorzata Musierowicz"],
        publish_year: 1986,
        isbn_number: "9788323112341",
        length: 220,
        language: "polski",
        publisher: "Nasza Księgarnia",
        keywords: ["poznań", "jeżycjada", "rodzina"],
        genre: ["Młodzieżowa"],
        instances: [{ id: 601, status: "available" }]
    },
    {
        book_id: 6,
        title: "Kasacja",
        authors: ["Remigiusz Mróz"],
        publish_year: 2015,
        isbn_number: "9788380750011",
        length: 480,
        language: "polski",
        publisher: "Czwarta Strona",
        keywords: ["prawo", "thriller", "chyłka"],
        genre: ["Thriller", "Kryminał"],
        instances: [{ id: 701, status: "available" }]
    },
    {
        book_id: 7,
        title: "Ostatnie życzenie",
        authors: ["Andrzej Sapkowski"],
        publish_year: 1993,
        isbn_number: "9788375900989",
        length: 332,
        language: "polski",
        publisher: "SuperNOWA",
        keywords: ["wiedźmin", "potwory", "miecze"],
        genre: ["Fantasy"],
        instances: [{ id: 801, status: "available" }, { id: 802, status: "rented" }]
    },
    {
        book_id: 8,
        title: "Król",
        authors: ["Szczepan Twardoch"],
        publish_year: 2016,
        isbn_number: "9788321119821",
        length: 430,
        language: "polski",
        publisher: "Wydawnictwo Literackie",
        keywords: ["warszawa", "boks", "historia"],
        genre: ["Literatura piękna", "historyczna"],
        instances: [{ id: 901, status: "available" }]
    },
    {
        book_id: 9,
        title: "Piaskowa Góra",
        authors: ["Joanna Bator"],
        publish_year: 2009,
        isbn_number: "9788324587123",
        length: 450,
        language: "polski",
        publisher: "Znak",
        keywords: ["rodzina", "wałbrzych", "kobiety"],
        genre: ["Literatura piękna"],
        instances: [{ id: 1001, status: "available" }]
    },
    {
        book_id: 10,
        title: "Dygot",
        authors: ["Jakub Małecki"],
        publish_year: 2015,
        isbn_number: "9788379244512",
        length: 320,
        language: "polski",
        publisher: "SQN",
        keywords: ["wieś", "przeznaczenie", "polska"],
        genre: ["Literatura piękna"],
        instances: [{ id: 1101, status: "available" }]
    },
    {
        book_id: 11,
        title: "Harry Potter i Kamień Filozoficzny",
        authors: ["J.K. Rowling"],
        publish_year: 1997,
        isbn_number: "9780747532699",
        length: 320,
        language: "angielski",
        publisher: "Media Rodzina",
        keywords: ["magia", "szkoła", "hogwart"],
        genre: ["Fantasy", "Młodzieżowa"],
        instances: [{ id: 1201, status: "available" }, { id: 1202, status: "available" }]
    },
    {
        book_id: 12,
        title: "Gra o Tron",
        authors: ["George R.R. Martin"],
        publish_year: 1996,
        isbn_number: "9780553103540",
        length: 835,
        language: "angielski",
        publisher: "Zysk i S-ka",
        keywords: ["smoki", "tron", "zima"],
        genre: ["Fantasy"],
        instances: [{ id: 1301, status: "rented" }]
    },
    {
        book_id: 13,
        title: "Norwegian Wood",
        authors: ["Haruki Murakami"],
        publish_year: 1987,
        isbn_number: "9784062035613",
        length: 380,
        language: "japoński",
        publisher: "Muza",
        keywords: ["miłość", "tokio", "smutek"],
        genre: ["Literatura piękna", "Romans"],
        instances: [{ id: 1401, status: "available" }]
    },
    {
        book_id: 14,
        title: "Pierwszy śnieg",
        authors: ["Jo Nesbø"],
        publish_year: 2007,
        isbn_number: "9788203192451",
        length: 450,
        language: "norweski",
        publisher: "Wydawnictwo Dolnośląskie",
        keywords: ["harry hole", "morderstwo", "oslo"],
        genre: ["Kryminał", "Thriller"],
        instances: [{ id: 1501, status: "available" }]
    },
    {
        book_id: 15,
        title: "Morderstwo w Orient Expressie",
        authors: ["Agatha Christie"],
        publish_year: 1934,
        isbn_number: "9780007119318",
        length: 256,
        language: "angielski",
        publisher: "Wydawnictwo Dolnośląskie",
        keywords: ["herkules poirot", "pociąg", "zagadka"],
        genre: ["Kryminał", "Klasyka"],
        instances: [{ id: 1601, status: "available" }]
    },
    {
        book_id: 16,
        title: "Z mgły zrodzony",
        authors: ["Brandon Sanderson"],
        publish_year: 2006,
        isbn_number: "9780765311788",
        length: 541,
        language: "angielski",
        publisher: "Mag",
        keywords: ["allomancja", "imperium", "mgła"],
        genre: ["Fantasy"],
        instances: [{ id: 1701, status: "available" }]
    },
    {
        book_id: 17,
        title: "Diuna",
        authors: ["Frank Herbert"],
        publish_year: 1965,
        isbn_number: "9780441172719",
        length: 612,
        language: "angielski",
        publisher: "Rebis",
        keywords: ["pustynia", "przyprawa", "imperium"],
        genre: ["Sci-Fi"],
        instances: [{ id: 1801, status: "available" }, { id: 1802, status: "damaged" }]
    },
    {
        book_id: 18,
        title: "Fundacja",
        authors: ["Isaac Asimov"],
        publish_year: 1951,
        isbn_number: "9780553293357",
        length: 255,
        language: "angielski",
        publisher: "Rebis",
        keywords: ["galaktyka", "psychohistoria", "przyszłość"],
        genre: ["Sci-Fi"],
        instances: [{ id: 1901, status: "available" }]
    },
    {
        book_id: 19,
        title: "Zbrodnia i kara",
        authors: ["Fiodor Dostojewski"],
        publish_year: 1866,
        isbn_number: "9788382021234",
        length: 550,
        language: "rosyjski",
        publisher: "MG",
        keywords: ["sumienie", "morderstwo", "petersburg"],
        genre: ["Klasyka", "Dramat"],
        instances: [{ id: 2001, status: "available" }]
    },
    {
        book_id: 20,
        title: "Nie mów nikomu",
        authors: ["Harlan Coben"],
        publish_year: 2001,
        isbn_number: "9780440236689",
        length: 370,
        language: "angielski",
        publisher: "Albatros",
        keywords: ["tajemnica", "zaginięcie", "thriller"],
        genre: ["Thriller"],
        instances: [{ id: 2101, status: "available" }]
    },
    {
        book_id: 21,
        title: "Księgi Jakubowe",
        authors: ["Olga Tokarczuk"],
        publish_year: 2014,
        isbn_number: "9788308054000",
        length: 912,
        language: "polski",
        publisher: "Wydawnictwo Literackie",
        keywords: ["historia", "religia", "podole"],
        genre: ["Literatura piękna", "historyczna"],
        instances: [{ id: 2201, status: "available" }]
    },
    {
        book_id: 22,
        title: "Cyberiada",
        authors: ["Stanisław Lem"],
        publish_year: 1965,
        isbn_number: "9788308060001",
        length: 350,
        language: "polski",
        publisher: "Wydawnictwo Literackie",
        keywords: ["roboty", "humor", "wynalazki"],
        genre: ["Sci-Fi"],
        instances: [{ id: 2301, status: "available" }]
    },
    {
        book_id: 23,
        title: "Gniew",
        authors: ["Zygmunt Miłoszewski"],
        publish_year: 2014,
        isbn_number: "9788328012345",
        length: 480,
        language: "polski",
        publisher: "W.A.B.",
        keywords: ["olsztyn", "prokurator", "zemsta"],
        genre: ["Kryminał"],
        instances: [{ id: 2401, status: "available" }]
    },
    {
        book_id: 24,
        title: "To",
        authors: ["Stephen King"],
        publish_year: 1986,
        isbn_number: "9780450411434",
        length: 1104,
        language: "angielski",
        publisher: "Albatros",
        keywords: ["klan", "strach", "derry"],
        genre: ["Horror"],
        instances: [{ id: 2501, status: "rented" }]
    },
    {
        book_id: 25,
        title: "Morfina",
        authors: ["Szczepan Twardoch"],
        publish_year: 2012,
        isbn_number: "9788308049822",
        length: 580,
        language: "polski",
        publisher: "Wydawnictwo Literackie",
        keywords: ["warszawa", "wojna", "tożsamość"],
        genre: ["Literatura piękna"],
        instances: [{ id: 2601, status: "available" }]
    },
    {
        book_id: 26,
        title: "Krew elfów",
        authors: ["Andrzej Sapkowski"],
        publish_year: 1994,
        isbn_number: "9788375900996",
        length: 340,
        language: "polski",
        publisher: "SuperNOWA",
        keywords: ["ciri", "kaer morhen", "magia"],
        genre: ["Fantasy"],
        instances: [{ id: 2701, status: "available" }]
    },
    {
        book_id: 27,
        title: "Ciemno, prawie noc",
        authors: ["Joanna Bator"],
        publish_year: 2012,
        isbn_number: "9788324590001",
        length: 500,
        language: "polski",
        publisher: "W.A.B.",
        keywords: ["wałbrzych", "mrok", "tajemnica"],
        genre: ["Literatura piękna", "Kryminał"],
        instances: [{ id: 2801, status: "available" }]
    },
    {
        book_id: 28,
        title: "Rdza",
        authors: ["Jakub Małecki"],
        publish_year: 2017,
        isbn_number: "9788379248503",
        length: 280,
        language: "polski",
        publisher: "SQN",
        keywords: ["przyjaźń", "pociągi", "pamięć"],
        genre: ["Literatura piękna"],
        instances: [{ id: 2901, status: "available" }]
    },
    {
        book_id: 29,
        title: "Zaginięcie",
        authors: ["Remigiusz Mróz"],
        publish_year: 2015,
        isbn_number: "9788380750509",
        length: 500,
        language: "polski",
        publisher: "Czwarta Strona",
        keywords: ["dziecko", "sąd", "chyłka"],
        genre: ["Kryminał", "Thriller"],
        instances: [{ id: 3001, status: "available" }]
    },
    {
        book_id: 30,
        title: "Bracia Karamazow",
        authors: ["Fiodor Dostojewski"],
        publish_year: 1880,
        isbn_number: "9788382025001",
        length: 900,
        language: "rosyjski",
        publisher: "MG",
        keywords: ["ojciec", "wiara", "filozofia"],
        genre: ["Klasyka", "Dramat"],
        instances: [{ id: 3101, status: "available" }]
    }
];