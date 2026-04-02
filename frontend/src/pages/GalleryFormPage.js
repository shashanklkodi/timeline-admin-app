import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { galleryApi, artifactApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { MediaUploader } from '../components/ui/media-uploader';
import { ArrowLeft, Save, GripVertical, X, Plus, Image as ImageIcon, Search } from 'lucide-react';
import { toast } from 'sonner';

export const GalleryFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [allArtifacts, setAllArtifacts] = useState([]);
    const [selectedArtifacts, setSelectedArtifacts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail: '',
        status: 'draft'
    });

    useEffect(() => {
        fetchArtifacts();
        if (isEdit) {
            fetchGallery();
        }
    }, [id]);

    const fetchArtifacts = async () => {
        try {
            const response = await artifactApi.list({ status: 'published' });
            setAllArtifacts(response.data);
        } catch (error) {
            console.error('Failed to load artifacts');
        }
    };

    const fetchGallery = async () => {
        setLoading(true);
        try {
            const response = await galleryApi.get(id);
            const gallery = response.data;
            setFormData({
                title: gallery.title || '',
                description: gallery.description || '',
                thumbnail: gallery.thumbnail || '',
                status: gallery.status || 'draft'
            });
            // Convert artifacts to the format we need
            const artifacts = (gallery.artifacts || []).map((a, index) => ({
                artifact_id: a.artifact_id,
                display_order: a.display_order || index,
                title: a.title,
                thumbnail_image: a.thumbnail_image
            }));
            setSelectedArtifacts(artifacts.sort((a, b) => a.display_order - b.display_order));
        } catch (error) {
            toast.error('Failed to load gallery');
            navigate('/galleries');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddArtifact = (artifact) => {
        if (selectedArtifacts.find(a => a.artifact_id === artifact.id)) {
            toast.error('Artifact already in gallery');
            return;
        }
        setSelectedArtifacts([...selectedArtifacts, {
            artifact_id: artifact.id,
            display_order: selectedArtifacts.length,
            title: artifact.title,
            thumbnail_image: artifact.thumbnail_image
        }]);
    };

    const handleRemoveArtifact = (artifactId) => {
        setSelectedArtifacts(selectedArtifacts.filter(a => a.artifact_id !== artifactId));
    };

    const handleReorder = (fromIndex, toIndex) => {
        const newList = [...selectedArtifacts];
        const [removed] = newList.splice(fromIndex, 1);
        newList.splice(toIndex, 0, removed);
        // Update display order
        setSelectedArtifacts(newList.map((item, index) => ({
            ...item,
            display_order: index
        })));
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        setSaving(true);
        try {
            const data = {
                ...formData,
                artifacts: selectedArtifacts.map((a, index) => ({
                    artifact_id: a.artifact_id,
                    display_order: index
                }))
            };

            if (isEdit) {
                await galleryApi.update(id, data);
                toast.success('Gallery updated');
            } else {
                await galleryApi.create(data);
                toast.success('Gallery created');
            }
            navigate('/galleries');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save gallery');
        } finally {
            setSaving(false);
        }
    };

    const filteredArtifacts = allArtifacts.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedArtifacts.find(s => s.artifact_id === a.id)
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-96 bg-muted animate-pulse rounded" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="gallery-form-page">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/galleries')} className="rounded-sm" data-testid="back-button">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="page-title">{isEdit ? 'Edit Gallery' : 'Create Gallery'}</h1>
                        <p className="page-description">{isEdit ? 'Update gallery details' : 'Create a curated collection of artifacts'}</p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={saving} className="rounded-sm" data-testid="save-gallery-button">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Gallery'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Gallery Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="Enter gallery title"
                                    className="rounded-sm"
                                    data-testid="title-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Describe this gallery..."
                                    rows={4}
                                    className="rounded-sm"
                                    data-testid="description-input"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <MediaUploader
                                        value={formData.thumbnail}
                                        onChange={(value) => handleChange('thumbnail', value)}
                                        accept="image/*"
                                        label="Thumbnail"
                                        description="Upload or select image"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                                        <SelectTrigger className="rounded-sm" data-testid="status-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selected Artifacts */}
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Gallery Artifacts ({selectedArtifacts.length})</CardTitle>
                            <CardDescription>Drag to reorder artifacts in the gallery</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedArtifacts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>No artifacts added yet</p>
                                    <p className="text-sm">Search and add artifacts from the sidebar</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {selectedArtifacts.map((artifact, index) => (
                                        <div 
                                            key={artifact.artifact_id}
                                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-sm border border-border"
                                            data-testid={`selected-artifact-${artifact.artifact_id}`}
                                        >
                                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                            <span className="text-sm font-medium text-muted-foreground w-6">
                                                {index + 1}
                                            </span>
                                            {artifact.thumbnail_image ? (
                                                <img 
                                                    src={artifact.thumbnail_image} 
                                                    alt={artifact.title}
                                                    className="h-10 w-10 object-cover rounded-sm"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 bg-muted rounded-sm flex items-center justify-center">
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <span className="flex-1 font-medium truncate">{artifact.title}</span>
                                            <div className="flex gap-1">
                                                {index > 0 && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleReorder(index, index - 1)}
                                                        className="h-8 px-2"
                                                    >
                                                        Up
                                                    </Button>
                                                )}
                                                {index < selectedArtifacts.length - 1 && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => handleReorder(index, index + 1)}
                                                        className="h-8 px-2"
                                                    >
                                                        Down
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => handleRemoveArtifact(artifact.artifact_id)}
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Available Artifacts */}
                <div className="space-y-6">
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Add Artifacts</CardTitle>
                            <CardDescription>Search and add published artifacts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search artifacts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 rounded-sm"
                                    data-testid="artifact-search-input"
                                />
                            </div>
                            
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-2 pr-4">
                                    {filteredArtifacts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No artifacts available
                                        </p>
                                    ) : (
                                        filteredArtifacts.map(artifact => (
                                            <div 
                                                key={artifact.id}
                                                className="flex items-center gap-3 p-2 rounded-sm border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                                onClick={() => handleAddArtifact(artifact)}
                                                data-testid={`available-artifact-${artifact.id}`}
                                            >
                                                {artifact.thumbnail_image ? (
                                                    <img 
                                                        src={artifact.thumbnail_image} 
                                                        alt={artifact.title}
                                                        className="h-10 w-10 object-cover rounded-sm"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 bg-muted rounded-sm flex items-center justify-center">
                                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{artifact.title}</p>
                                                    <p className="text-xs text-muted-foreground">{artifact.category_name || 'Uncategorized'}</p>
                                                </div>
                                                <Plus className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default GalleryFormPage;
