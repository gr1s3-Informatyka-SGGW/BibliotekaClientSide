/**
 * @file Implementuje widok zarządzania użytkownikami dla administratora (UsersListView).
 * Komponent ten umożliwia przeglądanie, filtrowanie oraz modyfikację statusów użytkowników biblioteki.
 * * Funkcjonalności widoku:
 * - Wyświetlanie listy użytkowników z podziałem na role (użytkownik, bibliotekarz, zablokowany).
 * - Zaawansowane filtrowanie według statusu konta (wielokrotny wybór).
 * - Sortowanie wyników według nazwiska (A-Z, Z-A), liczby wypożyczeń lub zaległości.
 * - Wyszukiwanie użytkowników po nazwisku lub innych danych.
 * - Obsługa akcji administracyjnych: blokowanie, odblokowywanie oraz trwałe usuwanie użytkowników.
 * - Wyświetlanie szczegółów dotyczących wypożyczonych książek w oknie modalnym.
 * @author Aleksander Grzegrzułka
 */
import "./UsersListView.css"
import type { UserInfo, Book, SearchSort, UserListSearchFilter } from "../server/server_types.ts";
import {
    removeUserRequest,
    blockUserRequest,
    unblockUserRequest,
    fetchUserListRequest,
    addAdminRequest
} from '../server/server_requests.ts'
import NavSidebar from "../general_elements/NavSidebar.tsx";
import SearchPanel, { type SearchPanelReturn } from "../general_elements/SearchPanel.tsx";
import { CustomSelect, CustomOption, FilterResetButton } from "../custom_components/CustomSelect.tsx";
import Popup from "../custom_components/Popup.tsx";
import { Pagination } from '../general_elements/Pagination.tsx';
import React, { useState, useEffect, type JSX } from "react";
import UserComponent from './UserComponent.tsx';
import { useSearchParams } from "react-router-dom";
import iconGroup from "../../public/assets/group.svg";
import iconAdd from "../../public/assets/add.svg";
import iconError from "../../public/assets/error.svg";
import { validators, type ValidationResult } from "../server/validators.ts";
import BookDetailsPopup from "./BookDetailsPopup.tsx";

/**
 * Główny komponent widoku listy użytkowników.
 * Zarządza stanem aplikacji w kontekście wyszukiwania, sortowania i filtrowania użytkowników,
 * a także obsługuje logikę okien modalnych (popupów) dla akcji.
 * @component
 * @returns {JSX.Element} Wyrenderowany widok z panelem bocznym, panelem wyszukiwania i listą użytkowników.
 */
export default function UsersListView(): JSX.Element {
    // URL Params
    const [searchParams, setSearchParams] = useSearchParams();

    // State - Dane
    const [users, setUsers] = useState<UserInfo[]>([]);

    // State - Paginacja
    const [currentPage, setCurrentPage] = useState(() => {
        const p = searchParams.get("page");
        return p ? parseInt(p) : 1;
    });

    const [totalPages, setTotalPages] = useState(1);

    // State — Wyszukiwanie i Filtry
    const [search, setSearch] = useState<SearchPanelReturn | undefined>(() => {
        const q = searchParams.get("q");
        return q ? { search: q } : undefined;
    });

    const [sorting, setSorting] = useState<SearchSort>(() => ({
        key: searchParams.get("sort_key") || "surname",
        direction: (searchParams.get("sort_dir") as 'ASC' | 'DESC') || "ASC"
    }));

    const [statusFilter, setStatusFilter] = useState<('user' | 'admin' | 'blocked')[]>(() => {
        return searchParams.getAll("status") as ('user' | 'admin' | 'blocked')[];
    });

    const [resetToken, setResetToken] = useState(0);

    // State - Popupy
    const [shownPopup, setShownPopup] = useState<
        undefined | "addLibrarian" | "blockConfirm" | "unblockConfirm" | "deleteConfirm" | "bookDetails" | "success" | "error"
    >(undefined);

    interface PopupData {
        user?: UserInfo;
        book?: Book;
        title?: string;
        message?: string;
    }
    const [popupData, setPopupData] = useState<PopupData>({});

    // === Logika ===

    // Synchronizacja URL
    useEffect(() => {
        const params = new URLSearchParams();
        if (search?.search) params.set("q", search.search);
        if (currentPage > 1) params.set("page", currentPage.toString());

        params.set("sort_key", sorting.key);
        params.set("sort_dir", sorting.direction);

        statusFilter.forEach(s => params.append("status", s));

        setSearchParams(params, { replace: true });
    }, [search, currentPage, sorting, statusFilter, setSearchParams]);

    // Pobieranie danych
    useEffect(() => {
        const fetchData = async () => {
            try {
                const filter: UserListSearchFilter = { status: statusFilter };

                const result = await fetchUserListRequest(search?.search, sorting, filter, currentPage);

                setUsers(result.result);
                setTotalPages(result.totalPages);
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e ?? "W wyniku nieznanego błędu nie udało się pobrać listy użytkowników.");
                setPopupData({ title: "Błąd", message: msg })
                setShownPopup("error")
                setUsers([]);
            }


            await new Promise(resolve => setTimeout(resolve, 100));
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };
        void fetchData();
    }, [search, sorting, statusFilter, currentPage, resetToken]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, sorting, search])

    const handleResetFilters = () => {
        setSearch({ search: "" });
        setSorting({ key: "surname", direction: "ASC" });
        setStatusFilter([]);
        setCurrentPage(1);
        setResetToken(prev => prev + 1);
    };

    // Obsługa akcji użytkownika
    const onBlockUserPressed = (user: UserInfo) => {
        setPopupData({ user });
        setShownPopup("blockConfirm");
    };

    const onUnblockUserPressed = (user: UserInfo) => {
        setPopupData({ user });
        setShownPopup("unblockConfirm");
    };

    const onRemoveUserPressed = (user: UserInfo) => {
        setPopupData({ user });
        setShownPopup("deleteConfirm");
    };

    const onBookDetailsPressed = (book: Book) => {
        setPopupData({ book });
        setShownPopup("bookDetails");
    };

    // Wykonanie requestów
    const executeBlockUser = async () => {
        if (!popupData.user?.user_id) return;
        setShownPopup(undefined); // Zamknij confirm
        try {
            await blockUserRequest(popupData.user.user_id);
            setPopupData({ title: "Zablokowano użytkownika", message: `Użytkownik ${popupData.user.name} ${popupData.user.surname} został zablokowany.` });
            setShownPopup("success");
            setResetToken(prev => prev + 1); // Odśwież listę
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "Wystąpił nieznany błąd");
            setPopupData({ title: "Błąd blokowania", message: msg });
            setShownPopup("error");
        }
    };

    const executeUnblockUser = async () => {
        if (!popupData.user?.user_id) return;
        setShownPopup(undefined);
        try {
            await unblockUserRequest(popupData.user.user_id);
            setPopupData({ title: "Odblokowano użytkownika", message: `Użytkownik ${popupData.user.name} ${popupData.user.surname} został odblokowany.` });
            setShownPopup("success");
            setResetToken(prev => prev + 1);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "Wystąpił nieznany błąd");
            setPopupData({ title: "Błąd odblokowania", message: msg });
            setShownPopup("error");
        }
    };

    const executeRemoveUser = async () => {
        if (!popupData?.user) return;
        setShownPopup(undefined);
        try {
            await removeUserRequest(popupData.user.email);
            setPopupData({ title: "Usunięto użytkownika", message: `Użytkownik ${popupData.user.name} ${popupData.user.surname} został usunięty.` });
            setShownPopup("success");
            setResetToken(prev => prev + 1);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e ?? "Wystąpił nieznany błąd");
            setPopupData({ title: "Błąd usuwania", message: msg });
            setShownPopup("error");
        }
    };

    const hidePopups = () => {
        setShownPopup(undefined);
        setPopupData({});
    };

    const notFoundText = ((): string => {
        const hasSearch = search?.search && search.search.trim().length > 0;
        const hasFilters = statusFilter.length > 0;

        if (hasSearch && hasFilters) {
            return `Nie znaleziono użytkownika dla frazy „${search?.search}” przy wybranych filtrach.`;
        }

        if (hasSearch) {
            return `Brak wyników pasujących do frazy „${search?.search}”.`;
        }

        if (hasFilters) {
            return "Żaden użytkownik nie spełnia wybranych kryteriów filtrowania.";
        }

        return "Lista użytkowników jest obecnie pusta.";
    })();

    return (
        <>
            {/* Block User Confirm */}
            <Popup isOpen={shownPopup === "blockConfirm"} setIsOpen={(v:boolean) => !v && hidePopups()} title="Zablokuj użytkownika" onClose={hidePopups}>
                <p>Czy na pewno chcesz zablokować użytkownika <strong>{popupData.user?.name} {popupData.user?.surname}</strong>?</p>
                <div className="flex flex-row *:flex-1 mt-6 gap-2">
                    <button onClick={hidePopups} className="boring">Anuluj</button>
                    <button onClick={executeBlockUser} className="bg-amber-600 hover:bg-amber-500">Zablokuj</button>
                </div>
            </Popup>

            {/* Unblock User Confirm */}
            <Popup isOpen={shownPopup === "unblockConfirm"} setIsOpen={(v: boolean) => !v && hidePopups()} title="Odblokuj użytkownika" onClose={hidePopups}>
                <p>Czy na pewno chcesz odblokować użytkownika <strong>{popupData.user?.name} {popupData.user?.surname}</strong>?</p>
                <div className="flex flex-row *:flex-1 mt-6 gap-2">
                    <button onClick={hidePopups} className="boring">Anuluj</button>
                    <button onClick={executeUnblockUser}>Odblokuj</button>
                </div>
            </Popup>

            {/* Delete User Confirm */}
            <Popup isOpen={shownPopup === "deleteConfirm"} setIsOpen={(v: boolean) => !v && hidePopups()} title="Usuń użytkownika" onClose={hidePopups}>
                <p>Czy na pewno chcesz trwale usunąć użytkownika <strong>{popupData.user?.name} {popupData.user?.surname}</strong>?</p>
                <p><strong>Tej operacji nie można cofnąć.</strong></p>
                <div className="flex flex-row *:flex-1 mt-6 gap-2">
                    <button onClick={hidePopups} className="boring">Anuluj</button>
                    <button onClick={executeRemoveUser} className="bg-red-700 hover:bg-red-600">Usuń trwale</button>
                </div>
            </Popup>

            {/* Generic Success */}
            <Popup isOpen={shownPopup === "success"} setIsOpen={(v: boolean) => !v && hidePopups()} title={popupData.title || "Sukces"} onClose={hidePopups}>
                <p>{popupData.message}</p>
                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>

            {/* Generic Error - Dynamic Title/Content */}
            <Popup isOpen={shownPopup === "error"} setIsOpen={(v: boolean) => !v && hidePopups()} title={popupData.title || "Błąd"} icon={iconError} onClose={hidePopups}>
                <p className="text-justify italic"><strong>{popupData.message}</strong></p>
                <div className="flex flex-row *:flex-1 mt-6">
                    <button onClick={hidePopups} className="boring">Zamknij</button>
                </div>
            </Popup>

            {/* Add Librarian */}
            <AddAdminForm isOpen={shownPopup === "addLibrarian"} setIsOpen={(v: boolean) => !v && hidePopups()} onClose={hidePopups}/>

            {/* Book Details Popup */}
            <BookDetailsPopup isOpen={shownPopup === "bookDetails"} setIsOpen={(v: boolean) => !v && hidePopups()} onClose={hidePopups} book={popupData.book} />

            <NavSidebar />
            {/* === GŁÓWNY LAYOUT === */}
            <main id='UserListView'>
            <h1 style={{ textAlign: "center", marginBottom: "1em" }}>
                <img src={iconGroup} alt="" style={{ verticalAlign: 'middle', marginRight: '0.5em' }} />
                Lista użytkowników
            </h1>


            <div>

                {/* Panel Wyszukiwania */}
                <SearchPanel
                    placeholder="Szukaj użytkownika po nazwisku, wypożyczeniu..."
                    onSearch={(data: SearchPanelReturn) => setSearch(data)}
                    defaultValue={search?.search ?? ""}
                >
                    <FilterResetButton activeCount={statusFilter.length} onReset={handleResetFilters} />

                    {/* Sortowanie */}
                    <CustomSelect
                        filterKey="sort"
                        label="Sortuj"
                        initialValues={(() => sorting ? [`${sorting.key}-${sorting.direction}`] : ['name_ASC'])()}
                        onChange={(v: string[]) => {
                            // value w CustomSelect ma format [index]_[ASC|DESC]
                            const val = v[0].split('-');
                            setSorting({ key: val[0], direction: val[1] == "ASC" ? "ASC" : "DESC" });
                        }}
                    >
                        <CustomOption value="name-ASC">Imie (A-Z)</CustomOption>
                        <CustomOption value="name-DESC">Imie (Z-A)</CustomOption>
                        <CustomOption value="surname-ASC">Nazwisko (A-Z)</CustomOption>
                        <CustomOption value="surname-DESC">Nazwisko (Z-A)</CustomOption>
                        <CustomOption value='email-ASC'>E-mail (A-Z)</CustomOption>
                        <CustomOption value='email-DESC'>E-mail (Z-A)</CustomOption>
                    {/* <CustomOption value="Liczba wypożyczeń (malejąco)">Liczba wypożyczeń (malejąco)</CustomOption>*/}
                    {/* <CustomOption value="Liczba zaległości (rosnąco)">Liczba zaległości (rosnąco)</CustomOption>*/}
                    {/* <CustomOption value="Liczba zaległości (malejąco)">Liczba zaległości (malejąco)</CustomOption>*/}
                    </CustomSelect>

                    {/* Status Filter */}
                    <CustomSelect
                        filterKey="status"
                        label="Status"
                        key={`status-${resetToken}`}
                        initialValues={statusFilter}
                        onChange={(v: string[]) => setStatusFilter(v as ('user' | 'admin' | 'blocked')[])}
                    >
                        <CustomOption value="user">Użytkownik</CustomOption>
                        <CustomOption value="admin">Bibliotekarz</CustomOption>
                        <CustomOption value="blocked">Zablokowany</CustomOption>
                    </CustomSelect>
                </SearchPanel>

                {/* Zarządzaj Bibliotekarzami Panel */}
                <div className="panel librarian add">
                    <h3 className="header">Zarządzaj bibliotekarzami</h3>
                    <button onClick={() => setShownPopup("addLibrarian")} >
                        <img src={iconAdd} alt="" style={{ marginRight: '0.5em' }} /> Dodaj nowego bibliotekarza
                    </button>
                </div>

                {/* Lista Użytkowników */}
                <div className="users-list">
                    {users.map((user, idx) => (
                        <UserComponent
                            key={idx}
                            userInfo={user}
                            onBlockUser={onBlockUserPressed}
                            onUnblockUser={onUnblockUserPressed}
                            onRemoveUser={onRemoveUserPressed}
                            onBookClick={onBookDetailsPressed}
                        />
                    ))}

                    {users.length === 0 && (
                        <div className="text-center">
                            <h3 className="mt-8 mb-3">{notFoundText}</h3>
                            <a onClick={handleResetFilters}>Pokaż wszystkich użytkowników</a>
                        </div>
                    )}
                </div>

                {/* Paginacja */}
                {users.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(p) => setCurrentPage(p)}
                    />
                )}

            </div>
            </main>
        </>
    );
}
/**
 * @interface AddAdminPopupProps
 * @property {boolean} isOpen - wartość hook'a obsługującego zamykanie i otwieranie okna
 * @property {React.Dispatch<React.SetStateAction<boolean>> | ((isOpen: boolean) => void)} setIsOpen - setter isOpen
 * @property {()=>void} [onClose] - event wywołany przy zamknięciu okna poprzez kliknięcie escape lub poza komponent
 */
export interface AddAdminPopupProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>> | ((isOpen: boolean) => void);
    onClose?: () => void;
}

/**
 * Komponent formularza dodania nowego bibliotekarza.
 * Waliduje dane wejściowe i wysyła żądanie addAdminRequest.
 * @component
 * @param {AddAdminPopupProps} props - Właściwości przekazywane do komponentu.
 * @returns {JSX.Element}
 */
function AddAdminForm(props: AddAdminPopupProps): JSX.Element {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repPassword, setRepPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        const validate: ValidationResult[] = [validators.firstName(firstName), validators.lastName(lastName), validators.email(email)];
        const error = validate.find((v: ValidationResult) => !v.ok);
        if (error) {
            setError(error.reason || "Nieznany błąd");
            return;
        }

        setIsSubmitting(true);
        try {
            if(password !== repPassword){
                throw new Error("Hasła nie są takie same");
            }

            await addAdminRequest(firstName, lastName, email, password);

            setSuccessMsg("Bibliotekarz został pomyślnie dodany. Hasło zostało wysłane na e-mail.");

            setFirstName("");
            setLastName("");
            setEmail("");

        } catch (er) {
            const err = er as Error;
            setError(err.message ?? "Wystąpił błąd podczas dodawania bibliotekarza.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Popup title="Dodaj bibliotekarza" isOpen={props.isOpen} setIsOpen={props.setIsOpen} onClose={props.onClose}>
            <form onSubmit={handleSubmit} className="add-admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '1em' }}>
                <div className="row">
                    <div style={{flex: 1}}>
                        <label htmlFor="firstName">Imię</label>
                        <input
                            id="firstName"
                            type="text"
                            placeholder="Imię"
                            autoComplete="given-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                        />
                    </div>

                    <div style={{flex: 1}}>
                        <label htmlFor="lastName">Nazwisko</label>
                        <input
                            id="lastName"
                            type="text"
                            placeholder="Nazwisko"
                            autoComplete="family-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="email">E-mail</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="adres@example.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="password">Hasło</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="Hasło"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="password_rep">Powtórz hasło</label>
                    <input
                        id="password_rep"
                        type="password"
                        placeholder="Powtórz hasło"
                        autoComplete="new-password"
                        value={repPassword}
                        onChange={(e) => setRepPassword(e.target.value)}
                    />
                </div>

                {error && <p style={{color: "red", marginTop: 10}}>{error}</p>}
                {successMsg && <p style={{color: "green", marginTop: 10}}>{successMsg}</p>}
                <button type="submit">Zarejestruj się</button>
            </form>
        </Popup>
    );
}
