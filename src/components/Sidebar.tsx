"use client"
import Image from "next/image";
import { LinkButton } from "./LinkButton";
import { Building, Home, Sheet, Dam, Droplets, Map, Satellite, Info, User } from "lucide-react";
import { useContext, useRef } from "react";
import { SidebarHeaderContext } from "@/contexts/SidebarHeaderContext";
import { useTranslation } from "react-i18next";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

export function Sidebar() {
    const { sidebarOpen } = useContext(SidebarHeaderContext);
    const { t } = useTranslation();
    const { isSignedIn, user } = useUser();
    const userButtonRef = useRef<HTMLDivElement>(null);

    const handleProfileClick = () => {//this makes the user button clickable not just the profile picture
        if (userButtonRef.current) {
            const button = userButtonRef.current.querySelector('button');
            if (button) {
                button.click();
            }
        }
    };

    return (
        <div className="hidden sm:block z-[2]">
            <div className={`flex flex-col items-center h-full ${sidebarOpen ? 'w-[225px]' : ''} bg-background shadow-[rgba(0,0,0,0.25)_2px_0_20px_1px] z-[2]`}>
                <div className="h-[87px] flex items-center justify-center">
                    <Image 
                        src={sidebarOpen ? "/logoHarmonia.png" : "/logoHarmoniaNoText.png"} 
                        width={sidebarOpen ? 75 : 50} 
                        height={sidebarOpen ? 75 : 50} 
                        alt="Harmonia Logo"
                        className="rounded-lg"
                        style={{ transition: '0.1s ease-in-out, 0.1s ease-in-out' }}
                    />
                </div>
                <hr className="h-0.5 bg-lightGray w-4/5 mt-[1px]" />
                <nav className={`${sidebarOpen ? 'pt-12' : 'pt-6'} w-full ${sidebarOpen ? 'px-4' : 'px-2'} flex-1`}>
                    <ul className="flex flex-col items-center text-primary gap-2">
                        <LinkButton 
                            route="/" 
                            name={sidebarOpen ? t('navigation.home') : t('navigation.homeShort')} 
                            icon={<Home size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        <LinkButton 
                            route="/about" 
                            name={sidebarOpen ? t('navigation.about') : t('navigation.aboutShort')} 
                            icon={<Info size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        <LinkButton 
                            route="/stations" 
                            name={sidebarOpen ? t('navigation.stations') : t('navigation.stationsShort')} 
                            icon={<Building size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        <LinkButton 
                            route="/dams" 
                            name={sidebarOpen ? t('navigation.dams') : t('navigation.damsShort')} 
                            icon={<Dam size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        <LinkButton 
                            route="/dam-monitoring" 
                            name={sidebarOpen ? t('navigation.damMonitoring') : t('navigation.damMonitoringShort')} 
                            icon={<Droplets size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        <LinkButton 
                            route="/sentinel" 
                            name={sidebarOpen ? t('navigation.sentinelMap') : t('navigation.sentinelMapShort')} 
                            icon={<Satellite size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        <LinkButton 
                            route="/sorraia-map" 
                            name={sidebarOpen ? t('navigation.sorraiaMap') : t('navigation.sorraiaMapShort')} 
                            icon={<Map size={sidebarOpen ? 18 : 22} />} 
                            compact={!sidebarOpen}
                        />
                        {isSignedIn && (
                            <LinkButton 
                                route="/excel" 
                                name={sidebarOpen ? t('navigation.excelUpload') : t('navigation.excelUploadShort')} 
                                icon={<Sheet size={sidebarOpen ? 18 : 22} />} 
                                compact={!sidebarOpen}
                            />
                        )}
                    </ul>
                </nav>
                

                
                {/* Authentication Section at Bottom */}
                <div className={`pb-4 w-full`}>
                    <hr className="h-0.5 w-4/5 bg-lightGray mb-2 mx-auto" />
                    
                    {sidebarOpen ? (
                        // Open Sidebar Authentication
                        <div className="px-4">
                            {isSignedIn ? (
                                <div 
                                    className="flex items-center justify-start gap-4 h-12 p-3 w-full rounded-lg border-2 border-background hover:border-primary bg-background cursor-pointer" 
                                    onClick={handleProfileClick}
                                >
                                    <div className="scale-[1.5] pointer-events-none flex items-center justify-center" ref={userButtonRef}>
                                        <UserButton/>
                                    </div>
                                    <div className="flex-1 min-w-0 pointer-events-none flex flex-col justify-center">
                                        <p className="text-primary truncate leading-tight font-semibold text-[15px]">
                                            {user?.firstName || 'User'}
                                        </p>
                                        <p className="truncate leading-tight text-[11px] text-gray700">
                                            {user?.username || user?.emailAddresses[0]?.emailAddress}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <SignInButton mode="modal">
                                    <button className="flex items-center justify-start gap-3 h-12 p-3 w-full rounded-lg border-2 border-background hover:border-primary bg-background">
                                        <User size={18} className="text-primary" strokeWidth={2.5} />
                                        <span className="text-primary font-semibold text-[15px]">{t('navigation.signIn')}</span>
                                    </button>
                                </SignInButton>
                            )}
                        </div>
                    ) : (
                        // Closed Sidebar Authentication
                        <div className="flex justify-center w-full">
                            {isSignedIn ? (
                                <div className="relative">
                                    <div className="flex flex-col items-center justify-center scale-[1.2] origin-center px-4 h-16 py-1">
                                        <UserButton />
                                        <span className="text-center font-semibold text-primary text-[11px] mt-1">
                                            {user?.username}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <SignInButton mode="modal">
                                    <button className="flex flex-col items-center justify-center px-2 h-16 py-1 rounded-lg border-2 border-background hover:border-primary bg-background">
                                        <div className="mb-1">
                                            <User size={22} className="text-primary" strokeWidth={2.5} />
                                        </div>
                                        <span className="text-center font-semibold text-primary text-[11px]">{t('navigation.signIn')}</span>
                                    </button>
                                </SignInButton>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}