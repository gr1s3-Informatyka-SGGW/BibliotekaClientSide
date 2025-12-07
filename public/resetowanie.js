import { validators } from './validators.js';
document.addEventListener('DOMContentLoaded', ()=>
{
    const resetForm = document.getElementById('resetForm');
    const emailInput = document.getElementById('emailReset');

    const msgBox = document.createElement('p');
    msgBox.style.textAlign = 'center';
    msgBox.style.marginTop = '15px';
    msgBox.style.fontWeight = 'bold';
    msgBox.style.padding = '10px';
    msgBox.style.borderRadius = '5px';
    msgBox.style.display = 'none';
    resetForm.appendChild(msgBox);

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailVal = emailInput.value;

        const emailCheck = validators.email(emailVal);
        if (!emailCheck.ok) {
            showMessage("Wpisz poprawny adres e-mail.", 'red');
            return;
        }

        try {
            showMessage("Wysyłanie żądania...", 'black', true);
            
            const response = await odpowiedzBackendReset(emailVal);

            if (response.success) {
                showMessage("Tymczasowe hasło zostało wysłane na Twój e-mail! Sprawdź skrzynkę.", 'green');
            } else {
                showMessage("Nie znaleziono takiego adresu e-mail w bazie.", 'red');
            }
        } catch (error) {
            console.error("Błąd serwera:", error);
            showMessage("Wystąpił błąd serwera. Spróbuj ponownie później.", 'red');
        }
    });

    function showMessage(text, color, visible = true) {
        msgBox.textContent = text;
        msgBox.style.color = color;
        msgBox.style.display = visible ? 'block' : 'none';
    }
});

function odpowiedzBackendReset(email) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Otrzymano żądanie resetu dla: ${email}`);
            const success = !email.includes("error@test.pl"); 
            resolve({ success: success });
        }, 800);
    });
}