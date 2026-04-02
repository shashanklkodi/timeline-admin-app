import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Settings, Moon, Sun, User, Shield, Palette, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { seedDatabase } from '../lib/api';

const ColorPicker = ({ label, value, onChange, description }) => {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5">
                <Label className="text-sm font-medium">{label}</Label>
                {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="flex items-center gap-2">
                <div 
                    className="w-8 h-8 rounded-sm border border-border"
                    style={{ backgroundColor: value }}
                />
                <Input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-12 h-8 p-0 border-0 cursor-pointer"
                />
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-24 h-8 text-xs font-mono rounded-sm"
                    placeholder="#000000"
                />
            </div>
        </div>
    );
};

export const SettingsPage = () => {
    const { user, hasPermission } = useAuth();
    const { mode, toggleMode, isDark, colors, updateColor, resetColors } = useTheme();
    const [isSeeding, setIsSeeding] = useState(false);

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            const response = await seedDatabase();
            toast.success('Database initialized successfully');
        } catch (error) {
            if (error.response?.data?.message === 'Database already seeded') {
                toast.info('Database already initialized');
            } else {
                toast.error('Failed to initialize database');
            }
        } finally {
            setIsSeeding(false);
        }
    };

    const handleResetColors = () => {
        resetColors();
        toast.success('Colors reset to defaults');
    };

    return (
        <div className="space-y-6" data-testid="settings-page">
            <div className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-description">Manage your preferences and customize the interface</p>
            </div>

            <Tabs defaultValue="appearance" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="appearance" className="gap-2">
                        <Palette className="h-4 w-4" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="account" className="gap-2">
                        <User className="h-4 w-4" />
                        Account
                    </TabsTrigger>
                    <TabsTrigger value="system" className="gap-2">
                        <Settings className="h-4 w-4" />
                        System
                    </TabsTrigger>
                </TabsList>

                {/* Appearance Tab */}
                <TabsContent value="appearance" className="space-y-6">
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                                Theme Mode
                            </CardTitle>
                            <CardDescription>Switch between light and dark mode</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Dark Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Currently using {mode} theme
                                    </p>
                                </div>
                                <Switch
                                    checked={isDark}
                                    onCheckedChange={toggleMode}
                                    data-testid="dark-mode-switch"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-5 w-5" />
                                        Color Palette
                                    </CardTitle>
                                    <CardDescription>
                                        Customize colors for {mode} mode
                                    </CardDescription>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleResetColors}
                                    className="rounded-sm gap-2"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                        Base Colors
                                    </h4>
                                    <ColorPicker
                                        label="Background"
                                        value={colors.background}
                                        onChange={(value) => updateColor('background', value)}
                                        description="Main page background"
                                    />
                                    <Separator />
                                    <ColorPicker
                                        label="Text Color"
                                        value={colors.foreground}
                                        onChange={(value) => updateColor('foreground', value)}
                                        description="Primary text color"
                                    />
                                    <Separator />
                                    <ColorPicker
                                        label="Muted Text"
                                        value={colors.mutedForeground}
                                        onChange={(value) => updateColor('mutedForeground', value)}
                                        description="Secondary/muted text"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                        Cards & Tiles
                                    </h4>
                                    <ColorPicker
                                        label="Card Background"
                                        value={colors.card}
                                        onChange={(value) => updateColor('card', value)}
                                        description="Cards and tiles background"
                                    />
                                    <Separator />
                                    <ColorPicker
                                        label="Card Text"
                                        value={colors.cardForeground}
                                        onChange={(value) => updateColor('cardForeground', value)}
                                        description="Text inside cards"
                                    />
                                    <Separator />
                                    <ColorPicker
                                        label="Border Color"
                                        value={colors.border}
                                        onChange={(value) => updateColor('border', value)}
                                        description="Card and input borders"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                        Accent Colors
                                    </h4>
                                    <ColorPicker
                                        label="Accent Color"
                                        value={colors.accent}
                                        onChange={(value) => updateColor('accent', value)}
                                        description="Highlights and CTAs"
                                    />
                                    <Separator />
                                    <ColorPicker
                                        label="Accent Text"
                                        value={colors.accentForeground}
                                        onChange={(value) => updateColor('accentForeground', value)}
                                        description="Text on accent elements"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                        Buttons & Actions
                                    </h4>
                                    <ColorPicker
                                        label="Primary Button"
                                        value={colors.primary}
                                        onChange={(value) => updateColor('primary', value)}
                                        description="Primary action buttons"
                                    />
                                    <Separator />
                                    <ColorPicker
                                        label="Primary Text"
                                        value={colors.primaryForeground}
                                        onChange={(value) => updateColor('primaryForeground', value)}
                                        description="Text on primary buttons"
                                    />
                                    <Separator />
                                    <ColorPicker
                                        label="Secondary"
                                        value={colors.secondary}
                                        onChange={(value) => updateColor('secondary', value)}
                                        description="Secondary backgrounds"
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    Preview
                                </h4>
                                <div className="p-4 rounded-sm border" style={{ backgroundColor: colors.background }}>
                                    <div className="p-4 rounded-sm border mb-4" style={{ 
                                        backgroundColor: colors.card, 
                                        borderColor: colors.border 
                                    }}>
                                        <h3 style={{ color: colors.cardForeground }} className="font-semibold mb-2">
                                            Sample Card Title
                                        </h3>
                                        <p style={{ color: colors.mutedForeground }} className="text-sm">
                                            This is how your cards will look with the selected colors.
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <button 
                                                className="px-3 py-1.5 rounded-sm text-sm font-medium"
                                                style={{ 
                                                    backgroundColor: colors.primary, 
                                                    color: colors.primaryForeground 
                                                }}
                                            >
                                                Primary
                                            </button>
                                            <button 
                                                className="px-3 py-1.5 rounded-sm text-sm font-medium"
                                                style={{ 
                                                    backgroundColor: colors.accent, 
                                                    color: colors.accentForeground 
                                                }}
                                            >
                                                Accent
                                            </button>
                                            <button 
                                                className="px-3 py-1.5 rounded-sm text-sm font-medium border"
                                                style={{ 
                                                    backgroundColor: colors.secondary, 
                                                    color: colors.secondaryForeground,
                                                    borderColor: colors.border
                                                }}
                                            >
                                                Secondary
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Account Tab */}
                <TabsContent value="account" className="space-y-6">
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Account Information
                            </CardTitle>
                            <CardDescription>Your account details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Name</Label>
                                <p className="font-medium">{user?.name}</p>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="font-medium">{user?.email}</p>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Role</Label>
                                <p className="font-medium">{user?.role || user?.role_name}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security
                            </CardTitle>
                            <CardDescription>Account security settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full rounded-sm" disabled>
                                Change Password
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Contact an administrator to change your password
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* System Tab */}
                <TabsContent value="system" className="space-y-6">
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                System Information
                            </CardTitle>
                            <CardDescription>CMS system details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">System</Label>
                                <p className="font-medium">HeritageOS v1.0.0</p>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">API Endpoint</Label>
                                <p className="font-medium text-sm break-all">
                                    {process.env.REACT_APP_BACKEND_URL}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {hasPermission('manage_users') && (
                        <Card className="rounded-sm">
                            <CardHeader>
                                <CardTitle>Database Management</CardTitle>
                                <CardDescription>
                                    Initialize database with sample data (Super Admin only)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button 
                                    onClick={handleSeed} 
                                    disabled={isSeeding}
                                    variant="outline"
                                    className="w-full rounded-sm"
                                    data-testid="seed-database-button"
                                >
                                    {isSeeding ? 'Initializing...' : 'Initialize Database'}
                                </Button>
                                <p className="text-xs text-muted-foreground text-center mt-2">
                                    Creates default roles, categories, and admin user
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default SettingsPage;
