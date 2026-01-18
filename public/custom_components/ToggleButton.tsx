/**
 * Plik implementujący przycisk dziedziczący IFormComponent.
 * @author Karol Dziuba
 */

import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import type IFormComponent from './IFormComponent';
import './ToggleButton.css';


/**
 * Właściwości (props) przekazywane do komponentu ToggleButton.
 * Umożliwiają konfigurację wyglądu oraz zachowania przycisku przełączającego.
 *
 * @interface ToggleButtonProps
 * @default false Określa początkowy stan przycisku
 * @param isActive - Nowa wartość logiczna stanu (true oznacza, że przycisk został włączony).
 */
interface ToggleButtonProps {
    label: string;
    initialValue?: boolean;
    onChange?: (isActive: boolean) => void;
}

const ToggleButton = forwardRef<IFormComponent<boolean>, ToggleButtonProps>((props, ref) => {
    const [isActive, setIsActive] = useState<boolean>(props.initialValue || false);

    useEffect(() => {
        setIsActive(props.initialValue || false);
    }, [props.initialValue]);

    useImperativeHandle(ref, () => ({
        getValue: () => isActive
    }));

    const handleClick = () => {
        const newState = !isActive;
        setIsActive(newState);
        if (props.onChange) {
            props.onChange(newState);
        }
    };

    return (
        <button
            type="button"
            className={`toggle-btn ${isActive ? 'active' : ''}`}
            onClick={handleClick}
        >
            {props.label}

        </button>
    );
});

export default ToggleButton;