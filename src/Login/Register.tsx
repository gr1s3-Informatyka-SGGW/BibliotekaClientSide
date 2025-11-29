import './register.css'

function Register() {
    return (
        <div className="center-screen">
            <form action="../Employee/catalog.html" style={{width: '22em'}} className="login-panel">
                <h2 style={{textAlign:'center', marginBottom:'18px'}}>Rejestracja</h2>

                <div className="row">
                    <div style={{flex:1}}>
                        <label htmlFor="firstName">Imię</label>
                        <input id="firstName" name="firstName" type="text" placeholder="Imię"
                               autoComplete="given-name"/>
                    </div>
                    <div style={{flex:1}}>
                        <label htmlFor="lastName">Nazwisko</label>
                        <input id="lastName" name="lastName" type="text" placeholder="Nazwisko"
                               autoComplete="family-name"/>
                    </div>
                </div>

                <div>
                    <label htmlFor="email">E-mail</label>
                    <input id="email" name="email" type="email" placeholder="adres@example.com" autoComplete="email"/>
                </div>

                <div>
                    <label htmlFor="password">Hasło</label>
                    <input id="password" name="password" type="password" placeholder="Hasło"
                           autoComplete="new-password"/>
                </div>

                <div>
                    <label htmlFor="cardNumber">Numer karty</label>
                    <input id="cardNumber" name="cardNumber" type="tel" inputMode="numeric" placeholder="Numer karty"
                           autoComplete="cc-number"/>
                </div>

                <div className="row">
                    <div style={{flex:1}}>
                        <label htmlFor="exp">Data wygaśnięcia</label>
                        <input id="exp" name="exp" type="month" placeholder="MM/YY" autoComplete="cc-exp"/>
                    </div>
                    <div style={{flex:1}}>
                        <label htmlFor="cvv">CVV</label>
                        <input id="cvv" name="cvv" type="tel" inputMode="numeric" pattern="[0-9]{3,4}" placeholder="CVV"
                               autoComplete="cc-csc"/>
                    </div>
                </div>

                <div className="checkbox-container">
                    <input type="checkbox" id="privacyPolicy" name="privacyPolicy"/>
                    <a id="privacyPolicyLabel" href="../privacy_policy.html">Akceptuję regulamin i politykę
                        prywatności.</a>
                </div>

                <button type="submit">Zarejestruj się</button>
                <p className="muted">Masz już konto? <a href="/login">Zaloguj się</a></p>
            </form>
        </div>)
}

export default Register