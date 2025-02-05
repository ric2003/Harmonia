"use client"
import Link from "next/link";
import "../app/globals.css";
import { usePathname } from "next/navigation";

interface LinkButtonProps {
    route: string;
    name: string;
    icon: React.ReactNode;
}

export function LinkButton({ route, name, icon }: LinkButtonProps) {
    const pathName = usePathname().split('/');
    const backgroundColor =`/${pathName[1]}` === route ? "bg-secondary" : "bg-background"

    
    return (
        <Link
            className={"flex items-center justify-start w-full h-16 rounded-lg gap-4 p-4 border-2 border-background hover:border-primary transition-colors " + (backgroundColor)}
            href={route}
        >
            {icon}
            <li className="text-[20px] font-semibold">{name}</li>
        </Link>
    );
}