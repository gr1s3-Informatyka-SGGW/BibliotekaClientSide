import { validators } from './validators';

document.addEventListener('DOMContentLoaded', ()=>
{
    const loginForm = document.getElementById('loginForm');
    
    const errorMsg = document.createElement('p');
    errorMsg.style.color = 'red';
    errorMsg.style.textAlign = 'center';
    errorMsg.style.marginTop = '15px';
    errorMsg.style.display = 'none';
    loginForm.appendChild(errorMsg);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const hasloCzyste = document.getElementById('haslo').value;

        const emailCheck = validators.email(email);
        if(!emailCheck.ok){
            showError(`Błąd email: ${emailCheck.reason} (Nieprawidłowy format)`);
            return;
        }

        const passCheck = validators.password(passwordVal);
        if (!passCheck.ok) {
            showError("Hasło nie spełnia wymagań bezpieczeństwa (min. 12 znaków, duża litera, cyfra, znak specjalny).");
            return;
        }
    
        try{
            const passwordHash = await hashPassword(hasloCzyste);
            error.style.display = 'none';

            //wysyłanie hasła do backendu
            /*w celu testowania poprawności kodu, została stworzona funckja
                pomocnicza odpowiedzBackend()*/
            const response = await odpowiedzBackend(email, passwordHash);
        
            if(response.success){
                sessionStorage.setItem('authToken', response.token);
                sessionStorage.setItem('userRole', response.role);
                sessionStorage.setItem('userEmail', email);

                if(response.role == 'employee'){
                    window.location.href = '../src/Employee/pending.html';
                }
                else{
                    window.location.href = '../src/Client/catalog.html';
                }
            }
            else{
                showError("Błędny email lub hasło.");
            }
        }
        catch(error){
            console.error("Błąd systemu: ", error);
            showError("Wystąpił błąd logowania.");
        }
    });

    function showError(message){
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }
});


async function hashPassword(rawPass){
    const utf8 = new TextEncoder().encode(rawPass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function odpowiedzBackend(email, passwordHash){
    return new Promise((resolve) => {
        setTimeout(() => {
            const isEmployee = email.includes('admin');

            resolve({
                success: true,
                role: isEmployee ? 'employee' : 'client',
                token: 'losowy-token-67'
            });
        }, 500);
    });
}

//Informacje o sesji

function saveSession(token, role, email) {
    const session = {
        token,
        role,
        email,
        createdAt: Date.now()
    };
    sessionStorage.setItem("sessionData", JSON.stringify(session));
}

function getSession() {
    const raw = sessionStorage.getItem("sessionData");
    if (!raw) return null;
    return JSON.parse(raw);
}

function logout() {
    sessionStorage.removeItem("sessionData");
    window.location.href = "../src/Login/login_index.html";
}

//Guardy

function protectPage(requiredRole = null) {
    const session = getSession();

    if (!session) {
        window.location.href = "../src/Login/login_index.html";
        return;
    }

    if (requiredRole && session.role !== requiredRole) {
        alert("Brak uprawnień!");
        window.location.href = "../src/Login/login_index.html";
    }
}