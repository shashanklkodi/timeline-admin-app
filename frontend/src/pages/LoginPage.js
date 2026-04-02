import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, loading } = useAuth();
    const { mode, toggleMode } = useTheme();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }
    
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div 
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                />
            </div>
            
            {/* Theme toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleMode}
                className="absolute top-4 right-4 rounded-sm"
                data-testid="login-theme-toggle"
            >
                {mode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            
            <div className="w-full max-w-md relative z-10">
                <Card className="border-border shadow-lg rounded-sm">
                    <CardHeader className="text-center pb-2">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-accent/10 rounded-sm">
                                <Building2 className="h-8 w-8 text-accent" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-serif">HeritageOS</CardTitle>
                        <CardDescription>
                            Sign in to manage your heritage collections
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@museum.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="rounded-sm"
                                    data-testid="login-email-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="rounded-sm pr-10"
                                        data-testid="login-password-input"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                        data-testid="toggle-password-visibility"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            
                            <Button
                                type="submit"
                                className="w-full rounded-sm"
                                disabled={isLoading}
                                data-testid="login-submit-button"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                        
                        <p className="text-xs text-muted-foreground text-center mt-6">
                            Contact your administrator if you need an account
                        </p>
                    </CardContent>
                </Card>
                
                <p className="text-center text-xs text-muted-foreground mt-4">
                    HeritageOS v1.0
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
