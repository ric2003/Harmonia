"use client"
import { createContext, useState } from "react";

interface SidebarHeaderContextType {
    sidebarOpen: Boolean;
    handleChangeSidebar: () => void;
}

export const SidebarHeaderContext = createContext({} as SidebarHeaderContextType);

interface SidebarHeaderProviderProps {
    children: React.ReactNode;
}

export function SidebarHeaderProvider({ children }: SidebarHeaderProviderProps) {
    const [sidebarOpen, setSidebarOpen] = useState<Boolean>(true);

    function handleChangeSidebar() {
        setSidebarOpen(state => !state);
    }
    
    return (
        <SidebarHeaderContext.Provider value={{sidebarOpen, handleChangeSidebar}}>
            {children}
        </SidebarHeaderContext.Provider>
    );
}