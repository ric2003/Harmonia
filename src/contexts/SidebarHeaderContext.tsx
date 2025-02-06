"use client"
import { createContext, useState } from "react";

interface SidebarHeaderContextType {
    sidebarOpen: boolean;
    handleChangeSidebar: () => void;
}

export const SidebarHeaderContext = createContext({} as SidebarHeaderContextType);

interface SidebarHeaderProviderProps {
    children: React.ReactNode;
}

export function SidebarHeaderProvider({ children }: SidebarHeaderProviderProps) {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

    function handleChangeSidebar() {
        setSidebarOpen(state => !state);
    }
    
    return (
        <SidebarHeaderContext.Provider value={{sidebarOpen, handleChangeSidebar}}>
            {children}
        </SidebarHeaderContext.Provider>
    );
}