import { useState, useEffect } from 'react';
import { roleApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../components/ui/table';
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
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const PERMISSION_GROUPS = {
    'Artifacts': ['create_artifact', 'edit_artifact', 'delete_artifact', 'publish_artifact'],
    'Galleries': ['create_gallery', 'edit_gallery', 'delete_gallery'],
    'Timelines': ['create_timeline', 'edit_timeline', 'delete_timeline'],
    'Media': ['upload_media', 'delete_media'],
    'Categories': ['manage_categories'],
    'Users': ['manage_users', 'manage_roles'],
    'Frontend': ['edit_frontend_sections']
};

export const RolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState({
        role_name: '',
        description: '',
        permissions: []
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await roleApi.list();
            setRoles(response.data);
        } catch (error) {
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                role_name: role.role_name,
                description: role.description || '',
                permissions: role.permissions || []
            });
        } else {
            setEditingRole(null);
            setFormData({
                role_name: '',
                description: '',
                permissions: []
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.role_name.trim()) {
            toast.error('Role name is required');
            return;
        }

        try {
            if (editingRole) {
                await roleApi.update(editingRole.id, formData);
                toast.success('Role updated');
            } else {
                await roleApi.create(formData);
                toast.success('Role created');
            }
            setDialogOpen(false);
            fetchRoles();
        } catch (error) {
            toast.error('Failed to save role');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await roleApi.delete(deleteId);
            setRoles(roles.filter(r => r.id !== deleteId));
            toast.success('Role deleted');
        } catch (error) {
            toast.error('Failed to delete role');
        } finally {
            setDeleteId(null);
        }
    };

    const togglePermission = (permission) => {
        if (formData.permissions.includes(permission)) {
            setFormData({
                ...formData,
                permissions: formData.permissions.filter(p => p !== permission)
            });
        } else {
            setFormData({
                ...formData,
                permissions: [...formData.permissions, permission]
            });
        }
    };

    const toggleGroup = (groupPermissions) => {
        const allSelected = groupPermissions.every(p => formData.permissions.includes(p));
        if (allSelected) {
            setFormData({
                ...formData,
                permissions: formData.permissions.filter(p => !groupPermissions.includes(p))
            });
        } else {
            const newPermissions = [...new Set([...formData.permissions, ...groupPermissions])];
            setFormData({
                ...formData,
                permissions: newPermissions
            });
        }
    };

    const formatPermissionName = (permission) => {
        return permission.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <div className="space-y-6" data-testid="roles-page">
            <div className="flex items-center justify-between">
                <div className="page-header">
                    <h1 className="page-title">Roles & Permissions</h1>
                    <p className="page-description">Define roles and their access permissions</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="rounded-sm" data-testid="create-role-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                </Button>
            </div>

            <Card className="rounded-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={4}>
                                        <div className="h-8 bg-muted animate-pulse rounded" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    No roles defined
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map(role => (
                                <TableRow key={role.id} data-testid={`role-row-${role.id}`}>
                                    <TableCell className="font-medium">{role.role_name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {role.description || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {role.permissions?.length || 0} permissions
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleOpenDialog(role)}
                                                className="rounded-sm"
                                                data-testid={`edit-role-${role.id}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {role.role_name !== 'Super Admin' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => setDeleteId(role.id)}
                                                    className="rounded-sm text-destructive hover:text-destructive"
                                                    data-testid={`delete-role-${role.id}`}
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
                        <DialogDescription>
                            {editingRole ? 'Update role details and permissions' : 'Define a new role with specific permissions'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="role_name">Role Name *</Label>
                            <Input
                                id="role_name"
                                value={formData.role_name}
                                onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                                placeholder="e.g., Content Manager"
                                className="rounded-sm"
                                data-testid="role-name-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe this role's responsibilities..."
                                className="rounded-sm"
                                rows={2}
                                data-testid="role-description-input"
                            />
                        </div>
                        
                        <div className="space-y-4">
                            <Label>Permissions</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(PERMISSION_GROUPS).map(([group, permissions]) => {
                                    const allSelected = permissions.every(p => formData.permissions.includes(p));
                                    const someSelected = permissions.some(p => formData.permissions.includes(p));
                                    
                                    return (
                                        <Card key={group} className="rounded-sm">
                                            <CardHeader className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={allSelected}
                                                        onCheckedChange={() => toggleGroup(permissions)}
                                                        className="rounded-sm"
                                                        data-testid={`group-${group.toLowerCase()}`}
                                                    />
                                                    <CardTitle className="text-sm font-medium">{group}</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="py-2 px-4">
                                                <div className="space-y-2">
                                                    {permissions.map(permission => (
                                                        <div key={permission} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={permission}
                                                                checked={formData.permissions.includes(permission)}
                                                                onCheckedChange={() => togglePermission(permission)}
                                                                className="rounded-sm"
                                                            />
                                                            <label 
                                                                htmlFor={permission}
                                                                className="text-sm text-muted-foreground cursor-pointer"
                                                            >
                                                                {formatPermissionName(permission)}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} className="rounded-sm" data-testid="save-role-button">
                            {editingRole ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this role? Users with this role will need to be reassigned.
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

export default RolesPage;
