

function PasswordReset() {
    return (
        <div className="center-screen">
            <form action="/login" className="login-panel">
                <h2 style={{textAlign:'center', marginBottom:0}}>Reset hasła</h2>
                <p style={{textAlign:'center', marginBottom:'10px', border:0}}>Podaj e-mail, na który chcesz otrzymać tymczasowe hasło.</p>
                <input type="email" placeholder="E-mail"/>
                <button type="submit">Wyślij tymczasowe hasło</button>
            </form>
        </div>
    )
}

export default PasswordReset