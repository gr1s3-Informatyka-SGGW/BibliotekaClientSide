import '../../public/validators.ts' // przerobić na typescript albo dołożyć plik deklaracji

function Login(){
    return (
        <div className="center-screen">
            <form className="login-panel">
                <h2 style={{textAlign: "center", marginBottom: "20px"}}>Logowanie</h2>
                <input type="email" placeholder="E-mail"/>
                <input type="password" placeholder="Hasło"/>
                <button type="submit">Zaloguj się</button>
                <a href="/password-reset" className="forgot-password">Zapomniałem hasła</a>
                <p className="muted">Nie masz konta? <a href="/register">Zarejestruj się</a></p>
            </form>
        </div>
    )
}

export default Login