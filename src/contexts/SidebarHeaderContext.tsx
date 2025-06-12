"use client"
import { createContext, useState, ReactNode } from "react";

interface SidebarHeaderContextType {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    dataSourceExpanded: boolean;
    setDataSourceExpanded: (expanded: boolean) => void;
}

export const SidebarHeaderContext = createContext<SidebarHeaderContextType>({
    sidebarOpen: false,
    setSidebarOpen: () => {},
    dataSourceExpanded: true, // Default to expanded
    setDataSourceExpanded: () => {},
});

interface SidebarHeaderProviderProps {
    children: ReactNode;
}

export function SidebarHeaderProvider({ children }: SidebarHeaderProviderProps) {
    // Initialize sidebar state from localStorage
    const [sidebarOpen, setSidebarOpenState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem("sidebarOpen");
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    // Initialize data source state from localStorage
    const [dataSourceExpanded, setDataSourceExpandedState] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem("dataSourceExpanded");
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    // Wrapper functions to handle localStorage
    const setSidebarOpen = (open: boolean) => {
        setSidebarOpenState(open);
        if (typeof window !== 'undefined') {
            localStorage.setItem("sidebarOpen", JSON.stringify(open));
        }
    };

    const setDataSourceExpanded = (expanded: boolean) => {
        setDataSourceExpandedState(expanded);
        if (typeof window !== 'undefined') {
            localStorage.setItem("dataSourceExpanded", JSON.stringify(expanded));
        }
    };

    return (
        <SidebarHeaderContext.Provider
            value={{
                sidebarOpen,
                setSidebarOpen,
                dataSourceExpanded,
                setDataSourceExpanded,
            }}
        >
            {children}
        </SidebarHeaderContext.Provider>
    );
}