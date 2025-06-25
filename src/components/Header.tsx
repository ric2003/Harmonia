"use client"
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import { usePageTitle } from "@/contexts/PageTitleContext";
import { Menu, Home, Building, Droplets, Map, Sheet, Satellite, Dam, Info, User } from "lucide-react";
import { useContext, useState, useEffect, useRef } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import NotificationDropdown from "./NotificationDropdown";

export function Header() {
    const { pageTitle } = usePageTitle();
    const { sidebarOpen, setSidebarOpen } = useContext(SidebarHeaderContext);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { t } = useTranslation();
    const pathName = usePathname().split('/');
    const menuRef = useRef<HTMLDivElement>(null);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const { isSignedIn, user } = useUser();
    const mobileUserButtonRef = useRef<HTMLDivElement>(null);

    const handleMobileProfileClick = () => {
        if (mobileUserButtonRef.current) {
            const button = mobileUserButtonRef.current.querySelector('button');
            if (button) {
                button.click();
            }
        }
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            
            // Check if click is on Clerk elements
            const element = target as Element;
            const isClerkElement = element.closest?.('[data-clerk-modal]') ||
                                 element.closest?.('.cl-userButtonPopoverCard') ||
                                 element.closest?.('.cl-modal') ||
                                 element.closest?.('.cl-userButton') ||
                                 element.closest?.('[data-clerk-user-button]');
            
            if (mobileMenuOpen && 
                menuRef.current && 
                !menuRef.current.contains(target) &&
                !menuButtonRef.current?.contains(target) &&
                !isClerkElement) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [mobileMenuOpen]);

    const navigationItems = [
        { route: "/", name: t('navigation.home'), icon: <Home size={20} /> },
        { route: "/about", name: t('navigation.about'), icon: <Info size={20} /> },
        { route: "/stations", name: t('navigation.stations'), icon: <Building size={20} /> },
        { route: "/dams", name: t('navigation.dams'), icon: <Dam size={20} /> },
        { route: "/dam-monitoring", name: t('navigation.damMonitoring'), icon: <Droplets size={20} /> },
        { route:"/sentinel", name:t('navigation.sentinelMap'), icon: <Satellite size={20}/> },
        { route: "/sorraia-map", name: t('navigation.sorraiaMap'), icon: <Map size={20} /> },
        ...(isSignedIn ? [{ route: "/excel", name: t('navigation.excelUpload'), icon: <Sheet size={20} /> }] : []),
    ];

    return (
        <header className="flex items-center bg-background w-full min-h-[90px] px-2 sm:px-6 relative">
            <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center sm:gap-6">
                        {/* Mobile menu button */}
                        <button 
                            ref={menuButtonRef}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="sm:hidden z-[100]"
                        >
                            {mobileMenuOpen ? 
                                <Menu className="text-primary bg-secondary rounded-lg p-1" size={30} /> :
                                <Menu className="text-primary bg-background rounded-lg p-1" size={30} />
                            }
                        </button>
                        {/* Desktop menu button */}
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden sm:block"
                        >
                            {sidebarOpen ?
                                <Menu className="text-primary bg-secondary rounded-lg p-1" size={30}/> :
                                <Menu className="text-primary bg-background rounded-lg p-1" size={30} />
                            }
                        </button>
                        <span className="text-primary text-lg sm:text-3xl font-extrabold pl-4 truncate max-w-[180px] sm:max-w-none">{pageTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSignedIn && <NotificationDropdown />}
                        <LanguageSwitcher />
                        <ThemeToggle />
                    </div>
                </div>
                <hr className="flex h-0.5 w-[calc(100%-38px)] bg-lightGray m-auto absolute bottom-0 left-0 right-0" />
            </div>

            {/* Mobile dropdown menu */}
            {mobileMenuOpen && (
                <div 
                    ref={menuRef}
                    className="fixed top-[90px] left-0 w-full bg-background shadow-lg z-[9999] sm:hidden"
                >
                    <div className="flex flex-col p-4 gap-2">
                        {navigationItems.map((item) => {
                            const isActive = `/${pathName[1]}` === item.route;
                            return (
                                <Link
                                    key={item.route}
                                    href={item.route}
                                    className={`flex items-center gap-3 p-3 rounded-lg ${
                                        isActive ? 'bg-secondary text-primary' : 'bg-background text-primary'
                                    } border-2 border-background hover:border-primary hover:bg-secondary/50`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="text-primary">{item.icon}</span>
                                    <span className="text-[15px] font-semibold">{item.name}</span>
                                </Link>
                            );
                        })}
                        
                        {/* Authentication Section */}
                        <hr className="h-0.5 bg-lightGray my-2" />
                        {isSignedIn ? (
                            <div 
                                className="flex items-center gap-3 p-3 rounded-lg bg-background border-2 border-background hover:border-primary hover:bg-secondary/50 cursor-pointer"
                                onClick={handleMobileProfileClick}
                            >
                                <div className="scale-[1.2] pointer-events-none" ref={mobileUserButtonRef}>
                                    <UserButton />
                                </div>
                                <div className="flex-1 min-w-0 pointer-events-none">
                                    <p className="text-primary font-semibold text-[15px] truncate">
                                        {user?.firstName || 'User'}
                                    </p>
                                    <p className="text-gray700 text-[13px] truncate">
                                        {user?.username || user?.emailAddresses[0]?.emailAddress}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <SignInButton mode="modal">
                                <button 
                                    className="flex items-center gap-3 p-3 rounded-lg bg-background text-primary border-2 border-background hover:border-primary hover:bg-secondary/50"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <User size={20} className="text-primary" strokeWidth={2.5} />
                                    <span className="text-[15px] font-semibold">{t('navigation.signIn')}</span>
                                </button>
                            </SignInButton>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}