import { useState, useRef, useLayoutEffect } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';

/**
* odpowiadający plik w design: 'tooltip.js'
* przykład w design: https://kocham-sggw.ct.ws/biblioteka/Client/profile.html po najechaniu na nazwę książki
* realizowana funkcjonalność:
*   po najechaniu na ten obiekt (jego zawartość) wyświetla obok ładny komunikat sprecyzowany w argumencie `title`
* przykład implementacji:
*   <CustomTooltip title="tekst">
*        <div>Jakiś HTML</div>
*   </CustomTooltip>
*/

interface CustomTooltipProps {
    /** Element potomny, na który najechanie wyzwala tooltip */
    children?: ReactNode;
    /** Tekst wyświetlany wewnątrz dymka */
    title: string;
}

/**
 * Komponent wewnętrzny (Portal) odpowiedzialny za renderowanie i pozycjonowanie dymka.
 * Oblicza koordynaty względem elementu aktywującego (trigger) i krawędzi ekranu.
 */

const TooltipPortal = ({
                           title,
                           triggerRef,
                       }: {
    title: string;
    triggerRef: RefObject<HTMLDivElement | null>;
}) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const [placement, setPlacement] = useState<'top' | 'bottom'>('top');

    useLayoutEffect(() => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const updatePosition = () => {
            if (!triggerRef.current || !tooltipRef.current) return;

            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            // Default logic
            let top = triggerRect.top - tooltipRect.height - 10;
            let newPlacement: 'top' | 'bottom' = 'top';

            // Flip to the bottom if it overflows the top
            if (top < 0) {
                top = triggerRect.bottom + 10;
                newPlacement = 'bottom';
            }

            // Horizontal centering
            let left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);

            // Prevent horizontal overlow
            const padding = 10;
            if (left < padding) left = padding;
            if (left + tooltipRect.width > window.innerWidth - padding) {
                left = window.innerWidth - tooltipRect.width - padding;
            }

            setCoords({ top, left });
            setPlacement(newPlacement);
        };

        updatePosition();

        const handleResize = () => updatePosition();
        const handleScroll = () => updatePosition();

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [triggerRef]);

    const placementClass = placement === 'bottom' ? 'bottom' : '';
    const visibilityClass = coords ? 'visible' : '';

    return createPortal(
        <div
            ref={tooltipRef}
            className={`custom-tooltip ${placementClass} ${visibilityClass}`}
            style={{
                top: coords ? coords.top : 0,
                left: coords ? coords.left : 0,
            }}
        >
            {title}
        </div>,
        document.body
    );
};

/**
 * Komponent wrapper dla elementu z tooltipem.
 *
 * @param {CustomTooltipProps} props
 * @returns {JSX.Element}
 */

export default function CustomTooltip({ children, title }: CustomTooltipProps) {
    const [isHovered, setIsHovered] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={triggerRef}
            data-tooltip
            style={{ display: 'inline-block' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
            {isHovered && <TooltipPortal title={title} triggerRef={triggerRef} />}
        </div>
    );
}