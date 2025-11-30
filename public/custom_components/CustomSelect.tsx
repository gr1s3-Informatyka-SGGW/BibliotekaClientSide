/*
* odpowiadający plik w design: 'catalog.html'
* widok w design:
* realizowana funkcjonalność:
    Wyświetla podobny do select, ale ładny, komunikat w formie rozszerza
 */

import * as React from "react";

// to jest zwykły select
class CustomSelect extends React.Component<any, any>{
    render() {
        return <>

        </>;
    }
}
// ten może jeszcze sortować
class SearchableSelect extends CustomSelect{
    render(): React.JSX.Element {
        return super.render();
    }
}