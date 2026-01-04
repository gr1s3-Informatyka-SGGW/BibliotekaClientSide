/**
 * @file Plik implementujący możliwość edycji i dodawania nowych książek do systemu.
 * Implementuje stronę /add-book oraz specjalny formularz używany na tej stronie, oraz
 * w widoku edycji na stronie /catalog
 * @author Szymon Doba
 */
import {useState, Component, type FormEvent} from "react";

import DynamicSelect from "../../public/custom_components/DynamicSelect.tsx";
import {validators} from "../../public/validators.ts";
import {addBookRequest, editBookRequest, addBookInstanceRequest} from "../../public/server_requests.ts";
import {type Book} from "../../public/server_types.ts";
import type IFormComponent from "../../public/custom_components/IFormComponent.tsx";
import { Alert } from "../../public/custom_components/Popup.tsx";
import InstanceQR from "./InstanceQR.tsx";
import Popup from "../../public/custom_components/Popup.tsx";
import AddBoxIcon from "../assets/add_box.svg";
import BookIcon from "../assets/book.svg";
import SaveIcon from "../assets/save.svg";
import "./add_book.css";
import NavSidebar from "../general_elements/NavSidebar.tsx";

/**
 * Pełen widok książki, z paskiem nawigacyjnym i formularzem dodawania książki
 * Obsługuje wysyłanie zapytania do API
 * @returns ReactNode
 * */
export default function AddBookView(){

    const [error, setError] = useState<string|null>(null)
    const [success, setSuccess] = useState<string|null>(null)
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [instanceIds, setInstanceIds] = useState<number[] | null>(null);
    


    async function sendForm(book: Book, copies: number) {
        console.log("Wysyłam:", book)
        setError(null);
        setSuccess(null);

        try {
            const createdBook = await addBookRequest(book);

            const ids: number[] = [];

            for (let i = 0; i < copies; i++) {
                const instance = await addBookInstanceRequest(createdBook.book_id);
                ids.push(instance.instance_id);
            }

            setInstanceIds(ids);
        } catch (e) {
            setError("Wystąpił błąd przy dodawaniu książki.");
        }
    }

    return <>
        <NavSidebar/>
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
        {instanceIds && (
            <InstanceQR
                instance_id={instanceIds}
                isOpen={}
                setIsOpen={}
                onClose={() => setInstanceIds(null)}
            />
        )}

    </>
}


/**
 * Komponent obsługujący formularz dodawania lub edycji książek w systemie.
 * @extends Component
 * @implements IFormComponent<Book>
 *
 * @property {Book} [props.info] - informacje o książce podane przy tworzeniu obiektu w trybie edycji. Komponent automatycznie wypełnia nimi formularz przy renderowaniu
 * @property {'edit'|'create'} props.mode - sygnalizuje czy formularz jest w trybie edycji, czy dodawania nowej książki
 * @property {(b:Book)=>void} props.onSubmit -
 * */
export class AddBookForm
    extends Component<{
        info?: Book
        mode: "create"|"edit"
        onSubmit: (b: Book, copies: number) => void
    }>

    implements IFormComponent<Book>
{
    info?: Book
    mode: 'edit'|'create'

    authors: string[];
    genres: string[];
    tags: string[];

    authorInput: string;
    genreInput: string;
    tagInput: string;

    constructor(props: {info?: Book, mode: "create"|"edit", onSubmit: (b:Book)=>void }) {
        super(props)

        // info i mode
        this.info = props.info;
        this.mode = props.mode;

        //chipy na podstawie info
        this.authors = this.info?.authors ?? [];
        this.genres = this.info?.genre ?? [];
        this.tags = this.info?.keywords ?? [];

        this.authorInput = "";
        this.genreInput = "";
        this.tagInput = "";
    }

    getCopiesCount(): number {  
        return Number(this.getVal("copies"));
    }

    // Funkcje dodawania/usuwania
    private addAuthor = () => {
        const val = this.authorInput.trim();
        if (!val || this.authors.includes(val)) return;
        this.authors.push(val);
        this.authorInput = "";
        this.forceUpdate();
    }
    private removeAuthor = (v:string) => {
        this.authors = this.authors.filter(a => a !== v);
        this.forceUpdate();
    }

    private addGenre = () => {
        const val = this.genreInput.trim();
        if (!val || this.genres.includes(val)) return;
        this.genres.push(val);
        this.genreInput = "";
        this.forceUpdate();
    }
    private removeGenre = (v:string) => {
        this.genres = this.genres.filter(g => g !== v);
        this.forceUpdate();
    }

    private addTag = () => {
        const val = this.tagInput.trim();
        if (!val || this.tags.includes(val)) return;
        this.tags.push(val);
        this.tagInput = "";
        this.forceUpdate();
    }
    private removeTag = (v:string) => {
        this.tags = this.tags.filter(t => t !== v);
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
            publisher: (document.getElementById("publisher") as HTMLSelectElement).value,
            language: (document.getElementById("language") as HTMLSelectElement).value,
            publish_year: Number(this.getVal("publish_year")),
            authors: this.authors,
            keywords: this.tags,
            genre: this.genres
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
            alert(valid);
            return;
        }

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
                <label>Autorzy:</label>
                    <div className="multi-select-container">
                        {this.authors.map(v => (
                        <div key={v} className="chip">
                            {v} <span className="chip-close" onClick={() => this.removeAuthor(v)}>x</span>
                        </div>
                        ))}
                        <input
                        type="text"
                        value={this.authorInput}
                        placeholder="Dodaj autora"
                        onChange={e => { this.authorInput = e.currentTarget.value; this.forceUpdate(); }}
                        onKeyDown={e => e.key === "Enter" && this.addAuthor()}
                        />
                        <div className="chip add" onClick={this.addAuthor}>Dodaj</div>
                    </div>
                </div>

                {/* RZĄD 3: Gatunki */}
                <div className="form-group">
                <label>Gatunki:</label>
                    <div className="multi-select-container">
                        {this.genres.map(v => (
                        <div key={v} className="chip">
                            {v} <span className="chip-close" onClick={() => this.removeGenre(v)}>x</span>
                        </div>
                        ))}
                        <input
                        type="text"
                        value={this.genreInput}
                        placeholder="Dodaj gatunek"
                        onChange={e => { this.genreInput = e.currentTarget.value; this.forceUpdate(); }}
                        onKeyDown={e => e.key === "Enter" && this.addGenre()}
                        />
                        <div className="chip add" onClick={this.addGenre}>Dodaj</div>
                    </div>
                </div>

                {/* RZĄD 4: Tagi */}
                <div className="form-group">
                <label>Tagi:</label>
                    <div className="multi-select-container">
                        {this.tags.map(v => (
                        <div key={v} className="chip">
                            {v} <span className="chip-close" onClick={() => this.removeTag(v)}>x</span>
                        </div>
                        ))}
                        <input
                        type="text"
                        value={this.tagInput}
                        placeholder="Dodaj tag"
                        onChange={e => { this.tagInput = e.currentTarget.value; this.forceUpdate(); }}
                        onKeyDown={e => e.key === "Enter" && this.addTag()}
                        />
                        <div className="chip add" onClick={this.addTag}>Dodaj</div>
                    </div>
                </div>

                {/* RZĄD 5: Rok wydania + ilośc */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Rok wydania:</label>
                        <input
                            id="publish_year"
                            type="number"
                            min={1000}
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
                </div>

                {/* RZĄD 6: Wydawca + język */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Wydawca:</label>
                        <select id="publisher">
                            <option value="">Wybierz lub wpisz nowego wydawcę</option>
                            <option>Dodaj...</option>
                            <option>Wydawca A</option>
                            <option>Wydawca B</option>
                            <option>Wydawca C</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Język:</label>
                        <select id="language">
                            <option value="">Wybierz lub wpisz nowy język</option>
                            <option>Dodaj...</option>
                            <option>senegalski</option>
                            <option>mongolski</option>
                            <option>peruwiański</option>
                        </select>
                    </div>
                </div>

                <div className="add-container">
                    <button type="submit">
                        <img src={SaveIcon} alt=''/> Dodaj książkę
                    </button>
                </div>

            </form>
        );
    }
}
