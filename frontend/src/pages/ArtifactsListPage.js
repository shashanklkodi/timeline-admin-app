import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artifactApi, categoryApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, truncate } from '../lib/utils';

export const ArtifactsListPage = () => {
    const navigate = useNavigate();
    const [artifacts, setArtifacts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [artifactsRes, categoriesRes] = await Promise.all([
                artifactApi.list(),
                categoryApi.list()
            ]);
            setArtifacts(artifactsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            toast.error('Failed to load artifacts');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            if (categoryFilter !== 'all') params.category_id = categoryFilter;
            if (statusFilter !== 'all') params.status = statusFilter;
            
            const response = await artifactApi.list(params);
            setArtifacts(response.data);
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await artifactApi.delete(deleteId);
            setArtifacts(artifacts.filter(a => a.id !== deleteId));
            toast.success('Artifact deleted');
        } catch (error) {
            toast.error('Failed to delete artifact');
        } finally {
            setDeleteId(null);
        }
    };

    const filteredArtifacts = artifacts.filter(artifact => {
        const matchesSearch = !search || 
            artifact.title.toLowerCase().includes(search.toLowerCase()) ||
            artifact.description?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || artifact.subject_category_id === categoryFilter;
        const matchesStatus = statusFilter === 'all' || artifact.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="space-y-6" data-testid="artifacts-list-page">
            <div className="flex items-center justify-between">
                <div className="page-header">
                    <h1 className="page-title">Artifacts</h1>
                    <p className="page-description">Manage your museum's artifact collection</p>
                </div>
                <Button onClick={() => navigate('/artifacts/new')} className="rounded-sm" data-testid="create-artifact-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Artifact
                </Button>
            </div>

            {/* Filters */}
            <Card className="rounded-sm">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search artifacts..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="pl-9 rounded-sm"
                                    data-testid="search-input"
                                />
                            </div>
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[180px] rounded-sm" data-testid="category-filter">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px] rounded-sm" data-testid="status-filter">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleSearch} variant="secondary" className="rounded-sm" data-testid="apply-filters">
                            Apply Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="rounded-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Era</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={6}>
                                        <div className="h-8 bg-muted animate-pulse rounded" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : filteredArtifacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No artifacts found. Create your first artifact!
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredArtifacts.map(artifact => (
                                <TableRow key={artifact.id} data-testid={`artifact-row-${artifact.id}`}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {artifact.thumbnail_image ? (
                                                <img 
                                                    src={artifact.thumbnail_image} 
                                                    alt={artifact.title}
                                                    className="h-10 w-10 object-cover rounded-sm"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 bg-muted rounded-sm flex items-center justify-center text-xs text-muted-foreground">
                                                    No img
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">{truncate(artifact.title, 40)}</p>
                                                <p className="text-xs text-muted-foreground">{artifact.slug}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{artifact.category_name || '-'}</TableCell>
                                    <TableCell>{artifact.era || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={artifact.status === 'published' ? 'default' : 'secondary'}>
                                            {artifact.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(artifact.created_at)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-sm" data-testid={`artifact-actions-${artifact.id}`}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/artifacts/${artifact.id}`)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate(`/artifacts/${artifact.id}/edit`)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => setDeleteId(artifact.id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Artifact</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this artifact? This action cannot be undone.
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

export default ArtifactsListPage;
