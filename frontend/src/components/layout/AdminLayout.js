import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toaster } from '../ui/sonner';

export const AdminLayout = () => {
    const { isAuthenticated, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <Sidebar />
            <main className="pt-14 pl-64">
                <div className="p-8 max-w-7xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
            <Toaster position="top-right" richColors />
        </div>
    );
};

export default AdminLayout;
