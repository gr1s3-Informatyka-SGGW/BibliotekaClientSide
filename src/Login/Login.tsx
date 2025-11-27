

function Login(){
    return (
        <div className="center-screen">
            <form action="../Employee/catalog.html">
                <h2 style={{textAlign: "center", marginBottom: "20px"}}>Logowanie</h2>
                <input type="email" placeholder="E-mail"/>
                <input type="password" placeholder="Hasło"/>
                <button type="submit">Zaloguj się</button>
                <a href="reset_password.html" className="forgot-password">Zapomniałem hasła</a>
                <p className="muted">Nie masz konta? <a href="register.html">Zarejestruj się</a></p>
            </form>
        </div>
    )
}

export default Login