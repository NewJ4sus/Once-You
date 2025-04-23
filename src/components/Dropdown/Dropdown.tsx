import React, { useState, useRef, useEffect, createContext, useContext, ReactNode } from 'react';
import SVG from '../SVG/SVG';

import './Dropdown.css';

interface DropdownContextType {
    activeDropdown: string | null;
    setActiveDropdown: (id: string | null) => void;
}

interface DropdownProviderProps {
    children: ReactNode;
}

interface DropdownProps {
    buttonContent: ReactNode;
    children: ReactNode;
    className?: string;
    buttonClassName?: string;
    menuClassName?: string;
    onSelect?: (e: React.MouseEvent) => void;
    id: string;
    showArrow?: boolean;
}

interface DropdownChildProps {
    onClick?: (e: React.MouseEvent) => void;
    children?: ReactNode;
    className?: string;
}

const DropdownContext = createContext<DropdownContextType>({
    activeDropdown: null,
    setActiveDropdown: () => {}
});

export const DropdownProvider: React.FC<DropdownProviderProps> = ({ children }) => {
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    return (
        <DropdownContext.Provider value={{ activeDropdown, setActiveDropdown }}>
            {children}
        </DropdownContext.Provider>
    );
};

export const Dropdown: React.FC<DropdownProps> = ({ 
    buttonContent, 
    children, 
    className = '', 
    buttonClassName = '',
    menuClassName = '',
    onSelect,
    id,
    showArrow = true
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<ReactNode>(buttonContent);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { activeDropdown, setActiveDropdown } = useContext(DropdownContext);

    const toggleDropdown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isOpen) {
            setIsOpen(false);
            setActiveDropdown(null);
        } else {
            setActiveDropdown(id);
            setIsOpen(true);
        }
    };

    const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setIsOpen(false);
            setActiveDropdown(null);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (activeDropdown !== id && isOpen) {
            setIsOpen(false);
        } else if (activeDropdown === id) {
            setIsOpen(true);
        }
    }, [activeDropdown, id]);

    const handleItemClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const target = e.target as HTMLElement;
        const selectedText = Array.from(target.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent)
            .join('').trim();

        if (selectedText) {
            setSelectedItem(selectedText);
            
            if (onSelect) {
                onSelect(e);
            }
            setIsOpen(false);
            setActiveDropdown(null);
        }
    };

    return (
        <div className={`dropdown-container ${buttonClassName} ${className}`} ref={dropdownRef}>
            <button 
                className={`dropdown-button ${buttonClassName}`}
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                {selectedItem}
                {showArrow && <SVG name="arrow_down" />}
            </button>
            
            <div 
                className={`dropdown-menu ${menuClassName} ${isOpen ? 'active' : ''}`}
                role="menu"
            >
                {React.Children.map(children, child => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child as React.ReactElement<DropdownChildProps>, {
                            onClick: handleItemClick,
                            role: "menuitem",
                            className: `${child.props.className || ''} dropdown-item`
                        });
                    }
                    return child;
                })}
            </div>
        </div>
    );
};