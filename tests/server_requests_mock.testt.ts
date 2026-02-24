import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    fetchAuthorsRequest,
    fetchTagsRequest,
    fetchGenresRequest,
    fetchPublishersRequest,
    fetchLanguagesRequest,
    fetchUserCatalogRequest,
    fetchUserBookRequest,
    fetchAdminCatalogRequest,
    fetchAdminBookRequest,
    reserveBookRequest,
    rentBookRequest,
    cancelReservationRequest,
    claimReservationRequest,
    extendRentRequest,
    returnBookRequest,
    fetchUserListRequest,
    removeUserRequest,
    blockUserRequest,
    unblockUserRequest,
    addAdminRequest,
    removeBookInstanceRequest,
    markDamagedBookInstanceRequest,
    markMendedBookInstanceRequest,
    addBookInstanceRequest,
    addBookRequest,
    editBookRequest,
    removeBookRequest,
    fetchRentLog,
    InvalidRequestDataError,
    TargetNotFoundError,
    RequestError
} from '../src/server/server_requests';

/* =========================
   PEŁNY MOCK LOCALSTORAGE
========================= */
class LocalStorageMock implements Storage {
    private store: Record<string, string> = {};

    get length() {
        return Object.keys(this.store).length;
    }

    clear() {
        this.store = {};
    }

    getItem(key: string): string | null {
        return this.store[key] ?? null;
    }

    setItem(key: string, value: string) {
        this.store[key] = value;
    }

    removeItem(key: string) {
        delete this.store[key];
    }

    key(index: number): string | null {
        const keys = Object.keys(this.store);
        return keys[index] ?? null;
    }
}

global.localStorage = new LocalStorageMock();
global.localStorage.setItem("token", "session-token-123");

/* =========================
   MOCK FETCH
========================= */
global.fetch = vi.fn();

/* =========================
   TESTY
========================= */

describe('Kompleksowe testy API (wszystkie funkcje)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /* =========================
       SŁOWNIKI
    ======================== */
    it('fetchAuthorsRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => ['Author1', 'Author2'] });
        const result = await fetchAuthorsRequest();
        expect(result).toEqual(['Author1', 'Author2']);
    });

    it('fetchTagsRequest - server error', async () => {
        (fetch as any).mockResolvedValue({ ok: false });
        await expect(fetchTagsRequest()).rejects.toBeInstanceOf(RequestError);
    });

    it('fetchGenresRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => ['Genre1'] });
        const result = await fetchGenresRequest();
        expect(result).toEqual(['Genre1']);
    });

    it('fetchPublishersRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => ['Publisher1'] });
        const result = await fetchPublishersRequest();
        expect(result).toEqual(['Publisher1']);
    });

    it('fetchLanguagesRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true, json: async () => ['PL'] });
        const result = await fetchLanguagesRequest();
        expect(result).toEqual(['PL']);
    });

    /* =========================
       KATALOG
    ======================== */
    it('fetchUserCatalogRequest - empty search returns results', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ result: ['Book1'], totalPages: 1, totalResults: 1 }),
        });
        const result = await fetchUserCatalogRequest('');
        expect(result.result).toEqual(['Book1']);
    });

    it('fetchUserCatalogRequest - success', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ result: [], totalPages: 1, totalResults: 0 }),
        });
        const result = await fetchUserCatalogRequest('Harry Potter');
        expect(result.totalPages).toBe(1);
    });

    it('fetchUserBookRequest - not found', async () => {
        (fetch as any).mockResolvedValue({ status: 400 });
        await expect(fetchUserBookRequest(1)).rejects.toBeInstanceOf(TargetNotFoundError);
    });

    it('fetchAdminCatalogRequest - success', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ result: [], totalPages: 1, totalResults: 0 }),
        });
        const result = await fetchAdminCatalogRequest(1, 10);
        expect(result.totalPages).toBe(1);
    });

    it('fetchAdminBookRequest - missing id', async () => {
        await expect(fetchAdminBookRequest(0)).rejects.toBeInstanceOf(InvalidRequestDataError);
    });

    /* =========================
       USER ACTIONS
    ======================== */
    it('reserveBookRequest - missing id', async () => {
        await expect(reserveBookRequest(0)).rejects.toBeInstanceOf(InvalidRequestDataError);
    });

    it('rentBookRequest - server error', async () => {
        (fetch as any).mockResolvedValue({ ok: false });
        await expect(rentBookRequest(1)).rejects.toBeInstanceOf(RequestError);
    });

    it('cancelReservationRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(cancelReservationRequest(1)).resolves.toBeUndefined();
    });

    it('claimReservationRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(claimReservationRequest(1)).resolves.toBeUndefined();
    });

    it('extendRentRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(extendRentRequest(1)).resolves.toBeUndefined();
    });

    it('returnBookRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(returnBookRequest(1)).resolves.toBeUndefined();
    });

    /* =========================
       ADMIN USERS
    ======================== */
    it('removeUserRequest - missing email', async () => {
        await expect(removeUserRequest('')).rejects.toBeInstanceOf(InvalidRequestDataError);
    });

    it('fetchUserListRequest - success', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ result: [], totalPages: 1, totalResults: 0 }),
        });
        const result = await fetchUserListRequest(undefined, 1);
        expect(result.totalPages).toBe(1);
    });

    it('blockUserRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(blockUserRequest('a@b.pl')).resolves.toBeUndefined();
    });

    it('unblockUserRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(unblockUserRequest('a@b.pl')).resolves.toBeUndefined();
    });

    it('addAdminRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(addAdminRequest('a@b.pl')).resolves.toBeUndefined();
    });

    /* =========================
       ADMIN COPIES
    ======================== */
    it('removeBookInstanceRequest - missing id', async () => {
        await expect(removeBookInstanceRequest(0)).rejects.toBeInstanceOf(InvalidRequestDataError);
    });

    it('markDamagedBookInstanceRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(markDamagedBookInstanceRequest(1)).resolves.toBeUndefined();
    });

    it('markMendedBookInstanceRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(markMendedBookInstanceRequest(1)).resolves.toBeUndefined();
    });

    it('addBookInstanceRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(addBookInstanceRequest(1)).resolves.toBeUndefined();
    });

    /* =========================
       ADMIN BOOKS
    ======================== */
    it('removeBookRequest - missing id', async () => {
        await expect(removeBookRequest(0)).rejects.toBeInstanceOf(InvalidRequestDataError);
    });

    it('addBookRequest - server error', async () => {
        (fetch as any).mockResolvedValue({ ok: false });
        await expect(addBookRequest({} as any)).rejects.toBeInstanceOf(RequestError);
    });

    it('editBookRequest - success', async () => {
        (fetch as any).mockResolvedValue({ ok: true });
        await expect(editBookRequest({ book_id: 1 } as any)).resolves.toBeUndefined();
    });

    /* =========================
       RENT LOG
    ======================== */
    it('fetchRentLog - success', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ result: [], totalPages: 1, totalResults: 0 }),
        });
        const result = await fetchRentLog(undefined, 1); // filter opcjonalny
        expect(result.totalPages).toBe(1);
    });

});
