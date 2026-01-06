import { SAMPLE_BOOKS } from "./fake_catalog_data";
import type { UserInfo } from "./server_types";

// Helper to keep dates consistent based on an offset from "now"
const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export const SAMPLE_USERS: UserInfo[] = [
  {
    "user_id": 111,
    "name": "Anna",
    "surname": "Kowalski",
    "email": "anna.kowalski0@example.com",
    "status": "admin",
    "currently_rented": [],
    "currently_reserved": []
  },
  {
    "user_id": 1,
    "name": "Maria",
    "surname": "Zając",
    "email": "maria.zając1@example.com",
    "status": "admin",
    "currently_rented": [],
    "currently_reserved": []
  },
  {
    "user_id": 7,
    "name": "Magdalena",
    "surname": "Zając",
    "email": "magdalena.zając7@example.com",
    "status": "user",
    "currently_rented": [
      { book: SAMPLE_BOOKS[0], borrow_date: daysFromNow(-10), return_date: daysFromNow(4) },
      { book: SAMPLE_BOOKS[1], borrow_date: daysFromNow(-20), return_date: daysFromNow(-5) } // Overdue
    ],
    "currently_reserved": [
      { book: SAMPLE_BOOKS[2], reserve_to: daysFromNow(5) }
    ]
  },
  {
    "user_id": 2,
    "name": "Marek",
    "surname": "Wójcik",
    "email": "marek.wójcik2@example.com",
    "status": "admin",
    "currently_rented": [],
    "currently_reserved": []
  },
  {
    "user_id": 9,
    "name": "Ewa",
    "surname": "Wieczorek",
    "email": "ewa.wieczorek9@example.com",
    "status": "blocked",
    "currently_rented": [
      { book: SAMPLE_BOOKS[3], borrow_date: daysFromNow(-5), return_date: daysFromNow(10) }
    ],
    "currently_reserved": []
  },
  {
    "user_id": 1,
    "name": "Anna",
    "surname": "Nowak",
    "email": "anna.nowak1@example.com",
    "status": "user",
    "currently_rented": [
      { book: SAMPLE_BOOKS[4], borrow_date: daysFromNow(-30), return_date: daysFromNow(-10) }, // Overdue
      { book: SAMPLE_BOOKS[5], borrow_date: daysFromNow(-15), return_date: daysFromNow(2) },
      { book: SAMPLE_BOOKS[6], borrow_date: daysFromNow(-2), return_date: daysFromNow(8) }
    ],
    "currently_reserved": [
      { book: SAMPLE_BOOKS[7], reserve_to: daysFromNow(1) }
    ]
  },
  {
    "user_id": 3,
    "name": "Maria",
    "surname": "Wójcik",
    "email": "maria.wójcik3@example.com",
    "status": "user",
    "currently_rented": [],
    "currently_reserved": [
      { book: SAMPLE_BOOKS[8], reserve_to: daysFromNow(30) }
    ]
  },
  {
    "user_id": 2,
    "name": "Piotr",
    "surname": "Zieliński",
    "email": "piotr.zieliński2@example.com",
    "status": "user",
    "currently_rented": [
      { book: SAMPLE_BOOKS[9], borrow_date: daysFromNow(-12), return_date: daysFromNow(-2) }, // Overdue
      { book: SAMPLE_BOOKS[10], borrow_date: daysFromNow(-7), return_date: daysFromNow(3) }
    ],
    "currently_reserved": []
  },
  {
    "user_id": 0,
    "name": "Jan",
    "surname": "Kowalski",
    "email": "jan.kowalski0@example.com",
    "status": "blocked",
    "currently_rented": [
      { book: SAMPLE_BOOKS[11], borrow_date: daysFromNow(-25), return_date: daysFromNow(-8) } // Blocked user with overdue
    ],
    "currently_reserved": []
  },
  {
    "user_id": 4,
    "name": "Krzysztof",
    "surname": "Mazur",
    "email": "krzysztof.mazur4@example.com",
    "status": "blocked",
    "currently_rented": [
      { book: SAMPLE_BOOKS[12], borrow_date: daysFromNow(-4), return_date: daysFromNow(6) }
    ],
    "currently_reserved": [
      { book: SAMPLE_BOOKS[13], reserve_to: daysFromNow(12) }
    ]
  },
  {
    "user_id": 6,
    "name": "Marek",
    "surname": "Kamiński",
    "email": "marek.kamiński6@example.com",
    "status": "user",
    "currently_rented": [
      { book: SAMPLE_BOOKS[14], borrow_date: daysFromNow(-18), return_date: daysFromNow(-1) }, // Overdue
      { book: SAMPLE_BOOKS[15], borrow_date: daysFromNow(-1), return_date: daysFromNow(9) },
      { book: SAMPLE_BOOKS[16], borrow_date: daysFromNow(-10), return_date: daysFromNow(0) } // Due today
    ],
    "currently_reserved": []
  },
  {
    "user_id": 8,
    "name": "Tomasz",
    "surname": "Król",
    "email": "tomasz.król8@example.com",
    "status": "user",
    "currently_rented": [
      { book: SAMPLE_BOOKS[17], borrow_date: daysFromNow(-3), return_date: daysFromNow(7) }
    ],
    "currently_reserved": [
      { book: SAMPLE_BOOKS[18], reserve_to: daysFromNow(3) }
    ]
  },
  {
    "user_id": 99,
    "name": "Barbara",
    "surname": "Kaczmarek",
    "email": "barbara.kaczmarek5@example.com",
    "status": "user",
    "currently_rented": [],
    "currently_reserved": []
  },
  {
    "user_id": 22,
    "name": "Ewa",
    "surname": "Wójcik",
    "email": "ewa.wójcik3@example.com",
    "status": "admin",
    "currently_rented": [],
    "currently_reserved": []
  }
];