import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "./components/ui/sonner";

// Layout
import AdminLayout from "./components/layout/AdminLayout";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ArtifactsListPage from "./pages/ArtifactsListPage";
import ArtifactFormPage from "./pages/ArtifactFormPage";
import CategoriesPage from "./pages/CategoriesPage";
import GalleriesListPage from "./pages/GalleriesListPage";
import GalleryFormPage from "./pages/GalleryFormPage";
import TimelinesListPage from "./pages/TimelinesListPage";
import TimelineFormPage from "./pages/TimelineFormPage";
import TimelineDetailPage from "./pages/TimelineDetailPage";
import MediaLibraryPage from "./pages/MediaLibraryPage";
import UsersPage from "./pages/UsersPage";
import RolesPage from "./pages/RolesPage";
import FrontendSectionsPage from "./pages/FrontendSectionsPage";
import SettingsPage from "./pages/SettingsPage";

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        
                        {/* Protected Admin Routes */}
                        <Route element={<AdminLayout />}>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            
                            {/* Artifacts */}
                            <Route path="/artifacts" element={<ArtifactsListPage />} />
                            <Route path="/artifacts/new" element={<ArtifactFormPage />} />
                            <Route path="/artifacts/:id" element={<ArtifactFormPage />} />
                            <Route path="/artifacts/:id/edit" element={<ArtifactFormPage />} />
                            
                            {/* Categories */}
                            <Route path="/categories" element={<CategoriesPage />} />
                            
                            {/* Galleries */}
                            <Route path="/galleries" element={<GalleriesListPage />} />
                            <Route path="/galleries/new" element={<GalleryFormPage />} />
                            <Route path="/galleries/:id" element={<GalleryFormPage />} />
                            <Route path="/galleries/:id/edit" element={<GalleryFormPage />} />
                            
                            {/* Timelines */}
                            <Route path="/timelines" element={<TimelinesListPage />} />
                            <Route path="/timelines/new" element={<TimelineFormPage />} />
                            <Route path="/timelines/:id" element={<TimelineDetailPage />} />
                            <Route path="/timelines/:id/edit" element={<TimelineFormPage />} />
                            
                            {/* Media */}
                            <Route path="/media" element={<MediaLibraryPage />} />
                            
                            {/* Frontend Builder */}
                            <Route path="/sections" element={<FrontendSectionsPage />} />
                            
                            {/* Users & Roles */}
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/roles" element={<RolesPage />} />
                            
                            {/* Settings */}
                            <Route path="/settings" element={<SettingsPage />} />
                        </Route>
                        
                        {/* Redirect root to dashboard */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        
                        {/* 404 - redirect to dashboard */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </BrowserRouter>
                <Toaster position="top-right" richColors />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
