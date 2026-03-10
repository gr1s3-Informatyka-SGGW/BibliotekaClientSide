/**
 * @file Plik implementujący możliwość edycji i dodawania nowych książek do systemu.
 * Implementuje stronę /add-book oraz specjalny formularz używany na tej stronie, oraz
 * w widoku edycji na stronie /catalog
 * @author Szymon Doba
 */
import React, {useState, Component, type FormEvent} from "react";
import {fetchFiltersRequest, addBookRequest} from "../server/server_requests.ts";
import {type Book} from "../server/server_types.ts";
import {validators} from "../server/validators.ts";

import type IFormComponent from "../custom_components/IFormComponent.tsx";
import DynamicSelect from "../custom_components/DynamicSelect.tsx";
import InstanceQR from "./InstanceQR.tsx";
import NavSidebar from "../general_elements/NavSidebar.tsx";

import AddBoxIcon from "/assets/add_box.svg";
import BookIcon from "/assets/book.svg";
import SaveIcon from "/assets/save.svg";
import "./AddBookView.css";

/**
 * Pełen widok książki, z paskiem nawigacyjnym i formularzem dodawania książki
 * Obsługuje wysyłanie zapytania do API
 * @returns ReactNode
 * */
export default function AddBookView(){

    const [error, setError] = useState<string|null>(null)
    const [success, setSuccess] = useState<string|null>(null)
    const [isQRopen, setIsQRopen] = useState(false);
    const [instanceIds, setInstanceIds] = useState<number[] | null>(null);
    const [bookTitle, setBookTitle] = useState<string>("[Nie znaleziono tytułu książki]");



    async function sendForm(book: Book, copies: number) {

        setError(null);
        setSuccess(null);

        try {
            const response = await addBookRequest(book, copies);

            const ids: number[] = response.instance_ids;

            setInstanceIds(ids);
            setBookTitle(book.title)
            setIsQRopen(true);
        } catch (e: any) {
            setError(e.message);
        }
    }

    return <>
        <NavSidebar/>
        <main>
            <h1>
                <img src={AddBoxIcon} alt=''/>
                Dodaj książkę
            </h1>

            <div className="panel book-info">
                <h3 className="header">
                    <img src={BookIcon} alt=''/>
                    Informacje o książce
                </h3>

                <AddBookForm
                    mode="create"
                    onSubmit={sendForm}
                />
            </div>

            {error && <div className="error-box">{error}</div>}
            {success && <div className="success-box">{success}</div>}
            <InstanceQR
                instance_id={instanceIds ?? []}
                book_title={bookTitle}
                isOpen={isQRopen}
                setIsOpen={setIsQRopen}
                onClose={() => setInstanceIds(null)}
            />
        </main>
    </>
}


/**
 * Komponent obsługujący formularz dodawania lub edycji książek w systemie.
 * @extends Component
 * @implements IFormComponent<Book>
 *
 * @property {Book} [props.info] - informacje o książce podane przy tworzeniu obiektu w trybie edycji. Komponent automatycznie wypełnia nimi formularz przy renderowaniu
 * @property {'edit'|'create'} props.mode - sygnalizuje czy formularz jest w trybie edycji, czy dodawania nowej książki
 * @property {(b:Book)=>void} props.onSubmit - funkcja wywołana po zatwierdzeniu formularza, obsługuje zamknięcie komponentu, jeśli potrzebne
 * @property {(b:Book)=>void} [props.close] - komponent używa jej, aby zamknąć się, bez zapisania zmian
 * */
export class AddBookForm
    extends Component<{
        info?: Book
        mode: "create"|"edit"
        onSubmit: (b: Book, copies: number) => void,
        close?: () => void
    }>

    implements IFormComponent<Book>
{
    info?: Book
    mode: 'edit'|'create'


    formError: string | null = null;

    availableAuthors: string[] = [];
    availableGenres: string[] = [];
    availableTags: string[] = [];
    availablePublishers: string[] = [];
    availableLanguages: string[] = [];

    authorsRef = React.createRef<DynamicSelect>();
    genresRef = React.createRef<DynamicSelect>();
    tagsRef = React.createRef<DynamicSelect>();
    publisherRef = React.createRef<DynamicSelect>();
    languageRef = React.createRef<DynamicSelect>();

    constructor(props: {info?: Book, mode: "create"|"edit", onSubmit: (b:Book)=>void, close?: () => void }) {
        super(props)

        // info i mode
        this.info = props.info;
        this.mode = props.mode;

        // chipy na podstawie info
        this.authorsRef = React.createRef<DynamicSelect>();
        this.genresRef = React.createRef<DynamicSelect>();
        this.tagsRef = React.createRef<DynamicSelect>();

    }

    getCopiesCount(): number {  
        return Number(this.getVal("copies"));
    }

    async componentDidMount() {
        const filters = await fetchFiltersRequest();
        this.availableAuthors = filters.author ?? []
        this.availableGenres = filters.genre ?? []
        this.availableTags = filters.tags ?? []
        this.availablePublishers = filters.publisher ?? []
        this.availableLanguages = filters.language ?? []
        this.forceUpdate();
    }

    private getVal(id:string){
        return (document.getElementById(id) as HTMLInputElement).value.trim()
    }

    /**
     * @implements IFormComponent<Book>
     * Pobiera wartości z formularza
     * @returns Book
     * */
    getValue():Book {
        return {
            book_id: this.info?.book_id,
            title: this.getVal("title"),
            isbn_number: this.getVal("isbn"),
            publisher: this.publisherRef.current?.getValue() as string,
            language: this.languageRef.current?.getValue() as string,
            publish_year: Number(this.getVal("publish_year")),
            length: Number(this.getVal("length")),
            authors: this.authorsRef.current?.getValue() as string[],
            keywords: this.tagsRef.current?.getValue() as string[],
            genre: this.genresRef.current?.getValue() as string[]
        }
    }

    private validate(b:Book):string|null{
        if (!validators.title(b.title).ok) return "Niepoprawny tytuł"
        if (!validators.isbn(b.isbn_number).ok) return "Niepoprawny ISBN"
        if (!validators.publisher(b.publisher).ok) return "Niepoprawny wydawca"
        return null
    }
    private submit = (e: FormEvent) => {
        e.preventDefault();

        const data = this.getValue();
        const valid = this.validate(data);
        if (valid) {
            this.formError = valid;
            this.forceUpdate();
            return;
        }

        this.formError = null;
        this.props.onSubmit(data, this.getCopiesCount());
    }

    render() {
        const b = this.info;

        return (
            <form className="form-grid" onSubmit={this.submit}>

                {/* RZĄD 1: Tytuł + ISBN */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Tytuł:</label>
                        <input id="title" type="text" defaultValue={b?.title}/>
                    </div>

                    <div className="form-group">
                        <label>ISBN:</label>
                        <div id="isbn-container">
                            <input
                            id="isbn"
                            type="text"
                            defaultValue={b?.isbn_number}
                            onInput={(e) => {
                                let val = e.currentTarget.value.replace(/[^0-9Xx]/gi, "");

                                if (val.length <= 9) {
                                    // ISBN-10
                                    val = val.replace(/^(\d{1,5})(\d{0,4})(\d{0,4})([\dXx]?)$/, "$1-$2-$3-$4");
                                } else if (val.length === 13) {
                                    // ISBN-13
                                    val = val.replace(/^(\d{3})(\d{1,5})(\d{1,7})(\d{1,1})$/, "$1-$2-$3-$4");
                                } else {
                                    // wszystko inne
                                    val = val.replace(/^(.{1,5})(.{1,7})(.{1,7})(.{1})$/, "$1-$2-$3-$4");
                                }
                                val = val.replace(/--+/g, "-").replace(/-$/, "");
                                e.currentTarget.value = val;
                            }}
                            />
                        </div>
                    </div>
                </div>

                {/* RZĄD 2: Autorzy */}
                <div className="form-group">
                    <DynamicSelect
                        ref={this.authorsRef}
                        id="authors"
                        label="Autorzy"
                        allow_multiple
                        children={this.availableAuthors}
                        default_value={b?.authors}
                    />
                </div>

                {/* RZĄD 3: Gatunki */}
                <div className="form-group">
                    <DynamicSelect
                        ref={this.genresRef}
                        id="genres"
                        label="Gatunki"
                        allow_multiple
                        children={this.availableGenres}
                        default_value={b?.genre}
                    />
                </div>

                {/* RZĄD 4: Tagi */}
                <div className="form-group">
                    <DynamicSelect
                        ref={this.tagsRef}
                        id="tags"
                        label="Tagi"
                        allow_multiple
                        children={this.availableTags}
                        default_value={b?.keywords}
                    />
                </div>

                {/* RZĄD 5: Rok wydania + ilośc egzemplarzy + ilość stron */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Rok wydania:</label>
                        <input
                            id="publish_year"
                            type="number"
                            min={0}
                            max={2100}
                            defaultValue={b?.publish_year}
                        />
                    </div>

                    <div className="form-group">
                        <label>Liczba egzemplarzy:</label>
                        <input
                            id="copies"
                            type="number"
                            min={1}
                            defaultValue={1}
                        />
                    </div>

                    <div className="form-group">
                        <label>Liczba stron:</label>
                        <input
                            id="length"
                            type="number"
                            min={1}
                            defaultValue={b?.length || 100}
                        />
                    </div>
                </div>

                {/* RZĄD 6: Wydawca + język */}
                <div className="form-row">
                    <div className="form-group">
                        <DynamicSelect
                            ref={this.publisherRef}
                            id="publisher"
                            label="Wydawca"
                            allow_multiple={false}
                            children={this.availablePublishers}
                            default_value={b?.publisher}
                        />
                    </div>

                    <div className="form-group">
                        <DynamicSelect
                            ref={this.languageRef}
                            id="language"
                            label="Język"
                            allow_multiple={false}
                            children={this.availableLanguages}
                            default_value={b?.language}
                        />
                    </div>
                </div>

                {this.formError && (
                    <div className="error-box">
                        {this.formError}
                    </div>
                )}
                <div className="add-container" style={{display: 'flex', flexWrap: 'nowrap', gap: '1em'}}>
                    <button type="submit">
                        <img src={SaveIcon} alt=''/> {this.mode === 'edit' ? 'Edytuj książkę' : 'Dodaj książkę'}
                    </button>
                    { this.props.close && <button type="button" onClick={this.props.close}>Anuluj</button>}
                </div>

            </form>
        );
    }
}
