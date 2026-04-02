import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ScrollArea } from '../ui/scroll-area';
import {
    LayoutDashboard,
    Package,
    FolderTree,
    Image,
    Clock,
    CalendarDays,
    Users,
    Shield,
    Settings,
    Layers,
    ChevronDown,
    Plus
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';

const menuItems = [
    {
        title: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard'
    },
    {
        title: 'Artifacts',
        icon: Package,
        submenu: [
            { title: 'All Artifacts', path: '/artifacts' },
            { title: 'Add Artifact', path: '/artifacts/new', icon: Plus },
            { title: 'Categories', path: '/categories', icon: FolderTree }
        ]
    },
    {
        title: 'Galleries',
        icon: Image,
        submenu: [
            { title: 'All Galleries', path: '/galleries' },
            { title: 'Create Gallery', path: '/galleries/new', icon: Plus }
        ]
    },
    {
        title: 'Timelines',
        icon: Clock,
        submenu: [
            { title: 'All Timelines', path: '/timelines' },
            { title: 'Create Timeline', path: '/timelines/new', icon: Plus }
        ]
    },
    {
        title: 'Media Library',
        icon: Image,
        path: '/media'
    },
    {
        title: 'Frontend Builder',
        icon: Layers,
        submenu: [
            { title: 'Homepage Sections', path: '/sections' }
        ]
    },
    {
        title: 'Users',
        icon: Users,
        requiredPermission: 'manage_users',
        submenu: [
            { title: 'All Users', path: '/users' },
            { title: 'Roles & Permissions', path: '/roles', icon: Shield }
        ]
    },
    {
        title: 'Settings',
        icon: Settings,
        path: '/settings'
    }
];

const SidebarItem = ({ item, isOpen, onToggle }) => {
    const location = useLocation();
    const { hasPermission } = useAuth();
    
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) {
        return null;
    }
    
    const isActive = item.path 
        ? location.pathname === item.path
        : item.submenu?.some(sub => location.pathname === sub.path || location.pathname.startsWith(sub.path + '/'));
    
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const Icon = item.icon;
    
    if (!hasSubmenu) {
        return (
            <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                    'sidebar-link',
                    isActive && 'active'
                )}
                data-testid={`sidebar-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
            </NavLink>
        );
    }
    
    return (
        <div>
            <button
                onClick={onToggle}
                className={cn(
                    'sidebar-link w-full justify-between',
                    isActive && 'text-foreground'
                )}
                data-testid={`sidebar-${item.title.toLowerCase().replace(/\s+/g, '-')}-toggle`}
            >
                <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                </div>
                <ChevronDown className={cn(
                    'h-4 w-4 transition-transform',
                    isOpen && 'rotate-180'
                )} />
            </button>
            
            {isOpen && (
                <div className="ml-4 mt-1 space-y-1 border-l border-border pl-4">
                    {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                            <NavLink
                                key={subItem.path}
                                to={subItem.path}
                                className={({ isActive }) => cn(
                                    'sidebar-link text-sm',
                                    isActive && 'active'
                                )}
                                data-testid={`sidebar-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                                {SubIcon && <SubIcon className="h-3.5 w-3.5" />}
                                <span>{subItem.title}</span>
                            </NavLink>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const Sidebar = () => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState(() => {
        // Auto-open menu that contains current path
        const open = {};
        menuItems.forEach((item, index) => {
            if (item.submenu?.some(sub => 
                location.pathname === sub.path || 
                location.pathname.startsWith(sub.path + '/')
            )) {
                open[index] = true;
            }
        });
        return open;
    });
    
    const toggleMenu = (index) => {
        setOpenMenus(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };
    
    return (
        <aside className="fixed left-0 top-14 bottom-0 w-64 border-r border-border bg-background z-30">
            <ScrollArea className="h-full py-4 px-3">
                <nav className="space-y-1" data-testid="sidebar-navigation">
                    {menuItems.map((item, index) => (
                        <SidebarItem
                            key={item.title}
                            item={item}
                            isOpen={openMenus[index]}
                            onToggle={() => toggleMenu(index)}
                        />
                    ))}
                </nav>
            </ScrollArea>
        </aside>
    );
};

export default Sidebar;
