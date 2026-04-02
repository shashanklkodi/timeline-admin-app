import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { artifactApi, categoryApi } from '../lib/api';
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
import { MediaUploader } from '../components/ui/media-uploader';
import { ArrowLeft, Save, Send, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export const ArtifactFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        subject_category_id: '',
        era: '',
        thumbnail_image: '',
        artifact_date: '',
        location: '',
        source_reference: '',
        status: 'draft',
        media_ids: []
    });

    useEffect(() => {
        fetchCategories();
        if (isEdit) {
            fetchArtifact();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const response = await categoryApi.list();
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to load categories');
        }
    };

    const fetchArtifact = async () => {
        setLoading(true);
        try {
            const response = await artifactApi.get(id);
            const artifact = response.data;
            setFormData({
                title: artifact.title || '',
                description: artifact.description || '',
                subject_category_id: artifact.subject_category_id || '',
                era: artifact.era || '',
                thumbnail_image: artifact.thumbnail_image || '',
                artifact_date: artifact.artifact_date || '',
                location: artifact.location || '',
                source_reference: artifact.source_reference || '',
                status: artifact.status || 'draft',
                media_ids: artifact.media_ids || []
            });
            setTags(artifact.tags || []);
        } catch (error) {
            toast.error('Failed to load artifact');
            navigate('/artifacts');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSubmit = async (publish = false) => {
        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        setSaving(true);
        try {
            const data = {
                ...formData,
                tags,
                status: publish ? 'published' : formData.status
            };

            if (isEdit) {
                await artifactApi.update(id, data);
                toast.success('Artifact updated');
            } else {
                await artifactApi.create(data);
                toast.success('Artifact created');
            }
            navigate('/artifacts');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save artifact');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-96 bg-muted animate-pulse rounded" />
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="artifact-form-page">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/artifacts')} className="rounded-sm" data-testid="back-button">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="page-title">{isEdit ? 'Edit Artifact' : 'Create Artifact'}</h1>
                        <p className="page-description">{isEdit ? 'Update artifact details' : 'Add a new artifact to your collection'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleSubmit(false)} disabled={saving} className="rounded-sm" data-testid="save-draft-button">
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                    </Button>
                    <Button onClick={() => handleSubmit(true)} disabled={saving} className="rounded-sm bg-accent text-accent-foreground hover:bg-accent/90" data-testid="publish-button">
                        <Send className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Publish'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="Enter artifact title"
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
                                    placeholder="Describe the artifact..."
                                    rows={6}
                                    className="rounded-sm"
                                    data-testid="description-input"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Historical Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="era">Era / Period</Label>
                                    <Input
                                        id="era"
                                        value={formData.era}
                                        onChange={(e) => handleChange('era', e.target.value)}
                                        placeholder="e.g., 18th Century"
                                        className="rounded-sm"
                                        data-testid="era-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="artifact_date">Date</Label>
                                    <Input
                                        id="artifact_date"
                                        value={formData.artifact_date}
                                        onChange={(e) => handleChange('artifact_date', e.target.value)}
                                        placeholder="e.g., 1750 or c. 1700-1750"
                                        className="rounded-sm"
                                        data-testid="date-input"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="location">Location / Origin</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => handleChange('location', e.target.value)}
                                    placeholder="Where was this artifact found or originated?"
                                    className="rounded-sm"
                                    data-testid="location-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="source_reference">Source / Reference</Label>
                                <Input
                                    id="source_reference"
                                    value={formData.source_reference}
                                    onChange={(e) => handleChange('source_reference', e.target.value)}
                                    placeholder="Academic source or reference"
                                    className="rounded-sm"
                                    data-testid="source-input"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Tags</CardTitle>
                            <CardDescription>Add keywords to help with search</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    placeholder="Add a tag..."
                                    className="rounded-sm"
                                    data-testid="tag-input"
                                />
                                <Button type="button" variant="secondary" onClick={handleAddTag} className="rounded-sm" data-testid="add-tag-button">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="gap-1">
                                        {tag}
                                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {tags.length === 0 && (
                                    <span className="text-sm text-muted-foreground">No tags added</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                                <SelectTrigger className="rounded-sm" data-testid="status-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select 
                                value={formData.subject_category_id} 
                                onValueChange={(value) => handleChange('subject_category_id', value)}
                            >
                                <SelectTrigger className="rounded-sm" data-testid="category-select">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Thumbnail</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MediaUploader
                                value={formData.thumbnail_image}
                                onChange={(value) => handleChange('thumbnail_image', value)}
                                accept="image/*"
                                label="Thumbnail Image"
                                description="Upload image or select from library"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ArtifactFormPage;
