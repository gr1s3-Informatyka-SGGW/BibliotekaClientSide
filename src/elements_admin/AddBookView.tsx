/**
 * @file Plik implementujący możliwość edycji i dodawania nowych książek do systemu.
 * Implementuje stronę /add-book oraz specjalny formularz używany na tej stronie oraz
 * w widoku edycji na stronie /catalog
 */
import {useState, Component, type FormEvent} from "react";

import DynamicSelect from "../../public/custom_components/DynamicSelect.tsx";
import {validators} from "../../public/validators.ts";
import {addBookRequest, editBookRequest} from "../../public/server_requests.ts";
import {type Book} from "../../public/server_types.ts";
import type IFormComponent from "../../public/custom_components/IFormComponent.tsx";
import "./add_book.css";

/**
 * Pełen widok książki, z paskiem nawigacyjnym i formularzem dodawania książki
 * Obsługuje wysyłanie zapytania do API
 * @returns ReactNode
 * */
export default function AddBookView(){

    const [error, setError] = useState<string|null>(null)
    const [success, setSuccess] = useState<string|null>(null)

    async function sendForm(book: Book){
        console.log("Wysyłam:", book)
        setError(null)
        setSuccess(null)

        try {
            await addBookRequest(book)
            setSuccess("Książka została pomyślnie dodana.")
        } catch (e){
            setError("Wystąpił błąd przy dodawaniu książki.")
        }
    }

    return <>
        <h1>
            <img src="../assets/add_box.svg"></img>
            Dodaj książkę
        </h1>

        <div className="panel book-info">
            <h3 className="header">
                <img src="../assets/book.svg"></img>
                Informacje o książce
            </h3>

            <AddBookForm
                mode="create"
                onSubmit={sendForm}
            />
        </div>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}
    </>
}


/**
* Komponent obsługujący formularz dodawania lub edycji książek w systemie.
*  @extends Component
 * @implements IFormComponent<Book>
 *
 * @property {Book|undefined} info - informacje o książce podane przy tworzeniu obiektu w trybie edycji. Komponent automatycznie wypełnia nimi formularz przy renderowaniu
 * @property {'edit'|'create'} mode - sygnalizuje czy formularz jest w trybie edycji, czy dodawania nowej książki
* */
export class AddBookForm
    extends Component<{
        info?: Book
        mode: "create"|"edit"
        onSubmit: (b:Book)=>void
    }>
    implements IFormComponent<Book>
{
    info: Book|undefined
    mode: 'edit'|'create'

    constructor(props:any) {
        super(props)
        this.info = props.info
        this.mode = props.mode
    }

    getVal(id:string){
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
            publisher: this.getVal("publisher"),
            length: Number(this.getVal("length")),
            language: this.getVal("language"),
            publish_year: Number(this.getVal("publish_year")),
            authors: (document.getElementById("authors") as any).chosen ?? [],
            keywords: (document.getElementById("keywords") as any).chosen ?? [],
            genre: (document.getElementById("genre") as any).chosen ?? []
        }
    }

    validate(b:Book):string|null{
        if (!validators.title(b.title).ok) return "Niepoprawny tytuł"
        if (!validators.isbn(b.isbn_number).ok) return "Niepoprawny ISBN"
        if (!validators.publisher(b.publisher).ok) return "Niepoprawny wydawca"
        if (!validators.pages(b.length).ok) return "Niepoprawna liczba stron"
        return null
    }

    submit = (e:FormEvent)=>{
        e.preventDefault()
        const data = this.getValue()
        const valid = this.validate(data)
        if (valid){
            alert(valid)
            return
        }
        this.props.onSubmit(data)
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
                                onInput={(e)=>{
                                    let val = e.currentTarget.value.replace(/[^0-9X]/gi, "")
                                    val = val
                                        .replace(/^(.{3})(.{1,7})(.{1,6})(.{1,1})$/, "$1-$2-$3-$4")
                                        .replace(/--+/g,"-")
                                        .replace(/-$/, "")
                                    e.currentTarget.value = val
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* RZĄD 2: Autorzy */}
                <div className="form-group">
                    <label>Autorzy:</label>
                    <div className="multi-select-container">
                        <DynamicSelect {...{children: b?.authors, allow_multiple: true, id:"authors"}}/>
                        <div
                            className="chip add"
                            onClick={()=>{
                                const input = document.querySelector("#authors input") as HTMLInputElement
                                if (input) input.focus()
                            }}
                        >Dodaj</div>
                    </div>
                </div>

                {/* RZĄD 3: Gatunki */}
                <div className="form-group">
                    <label>Gatunki:</label>
                    <div className="multi-select-container">
                        <DynamicSelect {...{children: b?.genre, allow_multiple: true, id:"genre"}}/>
                        <div
                            className="chip add"
                            onClick={()=>{
                                const input = document.querySelector("#genre input") as HTMLInputElement
                                if (input) input.focus()
                            }}
                        >Dodaj</div>
                    </div>
                </div>

                {/* RZĄD 4: Tagi */}
                <div className="form-group">
                    <label>Tagi:</label>
                    <div className="multi-select-container">
                        <DynamicSelect {...{children: b?.keywords, allow_multiple: true, id:"keywords"}}/>
                        <div
                            className="chip add"
                            onClick={()=>{
                                const input = document.querySelector("#keywords input") as HTMLInputElement
                                if (input) input.focus()
                            }}
                        >Dodaj</div>
                    </div>
                </div>

                {/* RZĄD 5: Rok wydania + długość */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Rok wydania:</label>
                        <input id="publish_year" type="number" defaultValue={b?.publish_year}/>
                    </div>

                    <div className="form-group">
                        <label>Liczba stron:</label>
                        <input id="length" type="number" defaultValue={b?.length}/>
                    </div>
                </div>

                {/* RZĄD 6: Wydawca + język */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Wydawca:</label>
                        <DynamicSelect
                            {...{children: b ? [b.publisher] : [], allow_multiple: false, id:"publisher"}}
                        />
                    </div>

                    <div className="form-group">
                        <label>Język:</label>
                        <input id="language" type="text" defaultValue={b?.language}/>
                    </div>
                </div>

                <div className="add-container">
                    <button type="submit">
                        {this.mode === "edit" ? "Zapisz zmiany" : "Dodaj książkę"}
                    </button>
                </div>

            </form>
        );
    }
}
