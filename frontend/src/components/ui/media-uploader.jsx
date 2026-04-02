import { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogDescription 
} from './dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { ScrollArea } from './scroll-area';
import { Upload, Link, Image, X, Check, Loader2 } from 'lucide-react';
import { mediaApi } from '../../lib/api';
import { toast } from 'sonner';
import { formatFileSize } from '../../lib/utils';

export const MediaUploader = ({ 
    value, 
    onChange, 
    accept = "image/*,video/*",
    label = "Media",
    description = "Upload a file or enter URL"
}) => {
    const fileInputRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [mediaLibrary, setMediaLibrary] = useState([]);
    const [loadingLibrary, setLoadingLibrary] = useState(false);
    const [activeTab, setActiveTab] = useState('upload');

    const fetchMediaLibrary = async () => {
        setLoadingLibrary(true);
        try {
            const response = await mediaApi.list();
            // Filter by type based on accept prop
            const filtered = response.data.filter(m => {
                if (accept.includes('image') && m.file_type === 'image') return true;
                if (accept.includes('video') && m.file_type === 'video') return true;
                if (accept === '*') return true;
                return false;
            });
            setMediaLibrary(filtered);
        } catch (error) {
            console.error('Failed to load media library');
        } finally {
            setLoadingLibrary(false);
        }
    };

    const handleOpenDialog = () => {
        setIsOpen(true);
        fetchMediaLibrary();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await mediaApi.upload(file);
            const mediaUrl = `${process.env.REACT_APP_BACKEND_URL}${response.data.file_path}`;
            onChange(mediaUrl);
            toast.success('File uploaded successfully');
            setIsOpen(false);
        } catch (error) {
            toast.error('Failed to upload file');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleUrlSubmit = () => {
        if (!urlInput.trim()) {
            toast.error('Please enter a URL');
            return;
        }
        onChange(urlInput.trim());
        setUrlInput('');
        setIsOpen(false);
        toast.success('URL added');
    };

    const handleSelectFromLibrary = (media) => {
        const mediaUrl = `${process.env.REACT_APP_BACKEND_URL}${media.file_path}`;
        onChange(mediaUrl);
        setIsOpen(false);
        toast.success('Media selected');
    };

    const handleRemove = () => {
        onChange('');
    };

    const isImage = value && (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.gif') || value.includes('.webp') || value.includes('.svg'));
    const isVideo = value && (value.includes('.mp4') || value.includes('.webm') || value.includes('.mov'));

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
            
            {value ? (
                <div className="relative rounded-sm border border-border overflow-hidden">
                    {isImage && (
                        <div className="aspect-video bg-muted">
                            <img 
                                src={value} 
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                    )}
                    {isVideo && (
                        <div className="aspect-video bg-muted">
                            <video 
                                src={value}
                                className="w-full h-full object-cover"
                                controls
                            />
                        </div>
                    )}
                    {!isImage && !isVideo && (
                        <div className="aspect-video bg-muted flex items-center justify-center">
                            <div className="text-center p-4">
                                <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{value}</p>
                            </div>
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                        <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-sm"
                            onClick={handleOpenDialog}
                        >
                            <Upload className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 rounded-sm"
                            onClick={handleRemove}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div 
                    className="aspect-video bg-muted rounded-sm border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={handleOpenDialog}
                    data-testid="media-upload-trigger"
                >
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload or select media</p>
                    <p className="text-xs text-muted-foreground mt-1">Supports images and videos</p>
                </div>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Select Media</DialogTitle>
                        <DialogDescription>
                            Upload a new file, enter a URL, or select from library
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="upload" className="gap-2">
                                <Upload className="h-4 w-4" />
                                Upload
                            </TabsTrigger>
                            <TabsTrigger value="url" className="gap-2">
                                <Link className="h-4 w-4" />
                                URL
                            </TabsTrigger>
                            <TabsTrigger value="library" className="gap-2">
                                <Image className="h-4 w-4" />
                                Library
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="mt-4">
                            <div 
                                className="border-2 border-dashed border-border rounded-sm p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={accept}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    data-testid="file-upload-input"
                                />
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-10 w-10 mx-auto mb-3 text-accent animate-spin" />
                                        <p className="text-sm font-medium">Uploading...</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                                        <p className="text-sm font-medium">Click to select a file</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            or drag and drop
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {accept.includes('image') && 'Images: JPG, PNG, GIF, WebP'}
                                            {accept.includes('video') && ' • Videos: MP4, WebM, MOV'}
                                        </p>
                                    </>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="url" className="mt-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="media-url">Media URL</Label>
                                <Input
                                    id="media-url"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="rounded-sm"
                                    data-testid="media-url-input"
                                />
                            </div>
                            <Button 
                                onClick={handleUrlSubmit} 
                                className="w-full rounded-sm"
                                data-testid="media-url-submit"
                            >
                                Use URL
                            </Button>
                        </TabsContent>

                        <TabsContent value="library" className="mt-4">
                            {loadingLibrary ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : mediaLibrary.length === 0 ? (
                                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <Image className="h-10 w-10 mb-2 opacity-50" />
                                    <p className="text-sm">No media in library</p>
                                    <p className="text-xs">Upload files first</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[300px]">
                                    <div className="grid grid-cols-3 gap-2 pr-4">
                                        {mediaLibrary.map(media => (
                                            <div
                                                key={media.id}
                                                className="aspect-square rounded-sm overflow-hidden border border-border cursor-pointer hover:border-accent transition-colors relative group"
                                                onClick={() => handleSelectFromLibrary(media)}
                                                data-testid={`library-item-${media.id}`}
                                            >
                                                {media.file_type === 'image' ? (
                                                    <img
                                                        src={`${process.env.REACT_APP_BACKEND_URL}${media.file_path}`}
                                                        alt={media.file_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                                        <div className="text-center p-2">
                                                            <Image className="h-6 w-6 mx-auto text-muted-foreground" />
                                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                                {media.file_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Check className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MediaUploader;
