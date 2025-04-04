"use client"
import { createContext, useEffect, useState } from "react";

interface SidebarHeaderContextType {
    sidebarOpen: boolean;
    handleChangeSidebar: () => void;
}

export const SidebarHeaderContext = createContext({} as SidebarHeaderContextType);

interface SidebarHeaderProviderProps {
    children: React.ReactNode;
}

export function SidebarHeaderProvider({ children }: SidebarHeaderProviderProps) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        const saved = localStorage.getItem("sidebarOpen");
        return saved !== null ? JSON.parse(saved) : true;
    });

    // function handleChangeSidebar() {
    //     setSidebarOpen(state => !state);
    // }

    function handleChangeSidebar() {
        setSidebarOpen(prev => {
            const newValue = !prev;
            localStorage.setItem("sidebarOpen", JSON.stringify(newValue));
            return newValue;
        });
    }

    useEffect(() => {
        localStorage.setItem("sidebarOpen", JSON.stringify(sidebarOpen));
    }, [sidebarOpen]);
    
    return (
        <SidebarHeaderContext.Provider value={{sidebarOpen, handleChangeSidebar}}>
            {children}
        </SidebarHeaderContext.Provider>
    );
}