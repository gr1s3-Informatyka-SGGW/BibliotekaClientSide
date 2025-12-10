/**
 Implementacja
 <CustomTooltip title="Jakiś tekst">
    Jakiś tekst
 </CustomTooltip>
 */

import { useState, useRef, useLayoutEffect } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';

interface CustomTooltipProps {
    children?: ReactNode;
    title: string;
}

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