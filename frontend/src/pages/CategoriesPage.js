import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
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
import { Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

export const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '',
        display_order: 0
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await categoryApi.list();
            setCategories(response.data);
        } catch (error) {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description || '',
                icon: category.icon || '',
                display_order: category.display_order || 0
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: '', description: '', icon: '', display_order: categories.length });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Name is required');
            return;
        }

        try {
            if (editingCategory) {
                await categoryApi.update(editingCategory.id, formData);
                toast.success('Category updated');
            } else {
                await categoryApi.create(formData);
                toast.success('Category created');
            }
            setDialogOpen(false);
            fetchCategories();
        } catch (error) {
            toast.error('Failed to save category');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await categoryApi.delete(deleteId);
            setCategories(categories.filter(c => c.id !== deleteId));
            toast.success('Category deleted');
        } catch (error) {
            toast.error('Failed to delete category');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6" data-testid="categories-page">
            <div className="flex items-center justify-between">
                <div className="page-header">
                    <h1 className="page-title">Categories</h1>
                    <p className="page-description">Organize artifacts by subject categories</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="rounded-sm" data-testid="create-category-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            <Card className="rounded-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Icon</TableHead>
                            <TableHead>Order</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}>
                                        <div className="h-8 bg-muted animate-pulse rounded" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    No categories yet. Create your first category!
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map(category => (
                                <TableRow key={category.id} data-testid={`category-row-${category.id}`}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{category.description || '-'}</TableCell>
                                    <TableCell>{category.icon || '-'}</TableCell>
                                    <TableCell>{category.display_order}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleOpenDialog(category)}
                                                className="rounded-sm"
                                                data-testid={`edit-category-${category.id}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => setDeleteId(category.id)}
                                                className="rounded-sm text-destructive hover:text-destructive"
                                                data-testid={`delete-category-${category.id}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
                        <DialogDescription>
                            {editingCategory ? 'Update category details' : 'Add a new artifact category'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Military History"
                                className="rounded-sm"
                                data-testid="category-name-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe this category..."
                                className="rounded-sm"
                                data-testid="category-description-input"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="icon">Icon (Lucide name)</Label>
                                <Input
                                    id="icon"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="e.g., Sword"
                                    className="rounded-sm"
                                    data-testid="category-icon-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                    className="rounded-sm"
                                    data-testid="category-order-input"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} className="rounded-sm" data-testid="save-category-button">
                            {editingCategory ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this category? Artifacts in this category will become uncategorized.
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

export default CategoriesPage;
