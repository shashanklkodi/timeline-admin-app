import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Sun, Moon, LogOut, User, Building2 } from 'lucide-react';

export const Header = () => {
    const { user, logout } = useAuth();
    const { mode, toggleMode } = useTheme();
    
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    
    return (
        <header className="fixed top-0 left-0 right-0 h-14 border-b border-border bg-background z-40">
            <div className="h-full px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-accent" />
                    <h1 className="text-lg font-semibold tracking-tight font-serif">
                        HeritageOS
                    </h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMode}
                        data-testid="theme-toggle"
                        className="rounded-sm"
                    >
                        {mode === 'light' ? (
                            <Moon className="h-4 w-4" />
                        ) : (
                            <Sun className="h-4 w-4" />
                        )}
                    </Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="ghost" 
                                className="gap-2 rounded-sm"
                                data-testid="user-menu-trigger"
                            >
                                <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                                        {getInitials(user?.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium hidden sm:inline">
                                    {user?.name}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span>{user?.name}</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {user?.role || user?.role_name}
                                    </span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem data-testid="profile-menu-item">
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onClick={logout}
                                className="text-destructive focus:text-destructive"
                                data-testid="logout-menu-item"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};

export default Header;
