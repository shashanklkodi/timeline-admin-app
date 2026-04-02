import { useState, useEffect, useRef } from 'react';
import { mediaApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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
import { Upload, Search, Image, FileVideo, FileAudio, FileText, File, Trash2, Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize, formatDateTime } from '../lib/utils';

const getFileIcon = (type) => {
    switch (type) {
        case 'image': return Image;
        case 'video': return FileVideo;
        case 'audio': return FileAudio;
        case 'document': return FileText;
        default: return File;
    }
};

export const MediaLibraryPage = () => {
    const fileInputRef = useRef(null);
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [previewMedia, setPreviewMedia] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchMedia();
    }, []);

    const fetchMedia = async () => {
        try {
            const response = await mediaApi.list();
            setMedia(response.data);
        } catch (error) {
            toast.error('Failed to load media');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        
        for (const file of files) {
            try {
                const response = await mediaApi.upload(file);
                setMedia(prev => [response.data, ...prev]);
                toast.success(`Uploaded ${file.name}`);
            } catch (error) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }
        
        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await mediaApi.delete(deleteId);
            setMedia(media.filter(m => m.id !== deleteId));
            toast.success('Media deleted');
        } catch (error) {
            toast.error('Failed to delete media');
        } finally {
            setDeleteId(null);
        }
    };

    const handleCopyPath = (path) => {
        const fullUrl = `${process.env.REACT_APP_BACKEND_URL}${path}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedId(path);
        toast.success('URL copied to clipboard');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredMedia = media.filter(m => {
        const matchesSearch = !search || m.file_name.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || m.file_type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6" data-testid="media-library-page">
            <div className="flex items-center justify-between">
                <div className="page-header">
                    <h1 className="page-title">Media Library</h1>
                    <p className="page-description">Manage uploaded images, videos, and documents</p>
                </div>
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleUpload}
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        data-testid="file-input"
                    />
                    <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={uploading}
                        className="rounded-sm"
                        data-testid="upload-button"
                    >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Files'}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="rounded-sm">
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 rounded-sm"
                                data-testid="search-input"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[150px] rounded-sm" data-testid="type-filter">
                                <SelectValue placeholder="File type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="image">Images</SelectItem>
                                <SelectItem value="video">Videos</SelectItem>
                                <SelectItem value="audio">Audio</SelectItem>
                                <SelectItem value="document">Documents</SelectItem>
                                <SelectItem value="3d_model">3D Models</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Media Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />
                    ))}
                </div>
            ) : filteredMedia.length === 0 ? (
                <Card className="rounded-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Image className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No media files</h3>
                        <p className="text-muted-foreground mb-4">Upload your first file to get started</p>
                        <Button onClick={() => fileInputRef.current?.click()} className="rounded-sm">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Files
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredMedia.map(item => {
                        const Icon = getFileIcon(item.file_type);
                        return (
                            <div 
                                key={item.id}
                                className="group relative aspect-square bg-muted rounded-sm overflow-hidden border border-border hover:border-accent transition-colors cursor-pointer"
                                onClick={() => setPreviewMedia(item)}
                                data-testid={`media-item-${item.id}`}
                            >
                                {item.file_type === 'image' ? (
                                    <img 
                                        src={`${process.env.REACT_APP_BACKEND_URL}${item.file_path}`}
                                        alt={item.file_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                        <Icon className="h-8 w-8 text-muted-foreground mb-2" />
                                        <span className="text-xs text-muted-foreground text-center truncate w-full">
                                            {item.file_name}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button 
                                        size="icon" 
                                        variant="secondary"
                                        className="h-8 w-8 rounded-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyPath(item.file_path);
                                        }}
                                    >
                                        {copiedId === item.file_path ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="destructive"
                                        className="h-8 w-8 rounded-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteId(item.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                {/* Type badge */}
                                <Badge 
                                    variant="secondary" 
                                    className="absolute top-2 left-2 text-xs"
                                >
                                    {item.file_type}
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Preview Dialog */}
            <Dialog open={!!previewMedia} onOpenChange={() => setPreviewMedia(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="truncate">{previewMedia?.file_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {previewMedia?.file_type === 'image' && (
                            <div className="aspect-video bg-muted rounded-sm overflow-hidden">
                                <img 
                                    src={`${process.env.REACT_APP_BACKEND_URL}${previewMedia.file_path}`}
                                    alt={previewMedia.file_name}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        )}
                        {previewMedia?.file_type === 'video' && (
                            <video 
                                src={`${process.env.REACT_APP_BACKEND_URL}${previewMedia.file_path}`}
                                controls
                                className="w-full rounded-sm"
                            />
                        )}
                        {previewMedia?.file_type === 'audio' && (
                            <audio 
                                src={`${process.env.REACT_APP_BACKEND_URL}${previewMedia.file_path}`}
                                controls
                                className="w-full"
                            />
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">File Type</p>
                                <p className="font-medium">{previewMedia?.file_type}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">File Size</p>
                                <p className="font-medium">{formatFileSize(previewMedia?.file_size)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Uploaded</p>
                                <p className="font-medium">{formatDateTime(previewMedia?.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Path</p>
                                <p className="font-medium truncate">{previewMedia?.file_path}</p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 rounded-sm"
                                onClick={() => handleCopyPath(previewMedia?.file_path)}
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy URL
                            </Button>
                            <Button 
                                variant="destructive" 
                                className="rounded-sm"
                                onClick={() => {
                                    setDeleteId(previewMedia?.id);
                                    setPreviewMedia(null);
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Media</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this file? This action cannot be undone.
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

export default MediaLibraryPage;
