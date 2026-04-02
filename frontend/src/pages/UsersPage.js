import { useState, useEffect } from 'react';
import { userApi, roleApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Users, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime } from '../lib/utils';

export const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role_id: '',
        status: 'active'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, rolesRes] = await Promise.all([
                userApi.list(),
                roleApi.list()
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role_id: user.role_id,
                status: user.status
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                email: '',
                password: '',
                role_id: roles[0]?.id || '',
                status: 'active'
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            toast.error('Name and email are required');
            return;
        }
        
        if (!editingUser && !formData.password) {
            toast.error('Password is required for new users');
            return;
        }

        try {
            const data = { ...formData };
            if (editingUser && !data.password) {
                delete data.password;
            }

            if (editingUser) {
                await userApi.update(editingUser.id, data);
                toast.success('User updated');
            } else {
                await userApi.create(data);
                toast.success('User created');
            }
            setDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save user');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await userApi.delete(deleteId);
            setUsers(users.filter(u => u.id !== deleteId));
            toast.success('User deleted');
        } catch (error) {
            toast.error('Failed to delete user');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6" data-testid="users-page">
            <div className="flex items-center justify-between">
                <div className="page-header">
                    <h1 className="page-title">Users</h1>
                    <p className="page-description">Manage system users and their roles</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="rounded-sm" data-testid="create-user-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            <Card className="rounded-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}>
                                        <div className="h-8 bg-muted animate-pulse rounded" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map(user => (
                                <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.role_name || 'Unknown'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {user.last_login ? formatDateTime(user.last_login) : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleOpenDialog(user)}
                                                className="rounded-sm"
                                                data-testid={`edit-user-${user.id}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {user.id !== currentUser?.id && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => setDeleteId(user.id)}
                                                    className="rounded-sm text-destructive hover:text-destructive"
                                                    data-testid={`delete-user-${user.id}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? 'Update user details' : 'Add a new user to the system'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Full name"
                                className="rounded-sm"
                                data-testid="user-name-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@example.com"
                                className="rounded-sm"
                                data-testid="user-email-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Password {editingUser ? '(leave blank to keep current)' : '*'}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingUser ? 'New password' : 'Password'}
                                    className="rounded-sm pr-10"
                                    data-testid="user-password-input"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select 
                                    value={formData.role_id} 
                                    onValueChange={(value) => setFormData({ ...formData, role_id: value })}
                                >
                                    <SelectTrigger className="rounded-sm" data-testid="user-role-select">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(role => (
                                            <SelectItem key={role.id} value={role.id}>{role.role_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select 
                                    value={formData.status} 
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger className="rounded-sm" data-testid="user-status-select">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} className="rounded-sm" data-testid="save-user-button">
                            {editingUser ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default UsersPage;
