import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { galleryApi, artifactApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
import { Plus, MoreHorizontal, Pencil, Trash2, Image, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, truncate } from '../lib/utils';

export const GalleriesListPage = () => {
    const navigate = useNavigate();
    const [galleries, setGalleries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        fetchGalleries();
    }, []);

    const fetchGalleries = async () => {
        try {
            const response = await galleryApi.list();
            setGalleries(response.data);
        } catch (error) {
            toast.error('Failed to load galleries');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await galleryApi.delete(deleteId);
            setGalleries(galleries.filter(g => g.id !== deleteId));
            toast.success('Gallery deleted');
        } catch (error) {
            toast.error('Failed to delete gallery');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6" data-testid="galleries-list-page">
            <div className="flex items-center justify-between">
                <div className="page-header">
                    <h1 className="page-title">Galleries</h1>
                    <p className="page-description">Curated collections of artifacts</p>
                </div>
                <Button onClick={() => navigate('/galleries/new')} className="rounded-sm" data-testid="create-gallery-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Gallery
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="rounded-sm">
                            <div className="aspect-video bg-muted animate-pulse" />
                            <CardContent className="p-4">
                                <div className="h-6 bg-muted animate-pulse rounded mb-2" />
                                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : galleries.length === 0 ? (
                <Card className="rounded-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Image className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No galleries yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first gallery to showcase artifacts</p>
                        <Button onClick={() => navigate('/galleries/new')} className="rounded-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Gallery
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {galleries.map(gallery => (
                        <Card key={gallery.id} className="rounded-sm overflow-hidden group" data-testid={`gallery-card-${gallery.id}`}>
                            <div className="aspect-video bg-muted relative">
                                {gallery.thumbnail ? (
                                    <img 
                                        src={gallery.thumbnail} 
                                        alt={gallery.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Image className="h-12 w-12 text-muted-foreground/50" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="secondary" 
                                                size="icon" 
                                                className="rounded-sm h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                data-testid={`gallery-actions-${gallery.id}`}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => navigate(`/galleries/${gallery.id}`)}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate(`/galleries/${gallery.id}/edit`)}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => setDeleteId(gallery.id)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-semibold font-serif">{truncate(gallery.title, 30)}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {gallery.artifacts?.length || 0} artifacts
                                        </p>
                                    </div>
                                    <Badge variant={gallery.status === 'published' ? 'default' : 'secondary'}>
                                        {gallery.status}
                                    </Badge>
                                </div>
                                {gallery.description && (
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                        {gallery.description}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-3">
                                    Created {formatDate(gallery.created_at)}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Gallery</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this gallery? This action cannot be undone.
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

export default GalleriesListPage;
