import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { timelineApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { MediaUploader } from '../components/ui/media-uploader';
import { ArrowLeft, Save, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const TimelineFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        cover_image: '',
        era_range: ''
    });

    useEffect(() => {
        if (isEdit) {
            fetchTimeline();
        }
    }, [id]);

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const response = await timelineApi.get(id);
            const timeline = response.data;
            setFormData({
                title: timeline.title || '',
                description: timeline.description || '',
                cover_image: timeline.cover_image || '',
                era_range: timeline.era_range || ''
            });
        } catch (error) {
            toast.error('Failed to load timeline');
            navigate('/timelines');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        setSaving(true);
        try {
            if (isEdit) {
                await timelineApi.update(id, formData);
                toast.success('Timeline updated');
                navigate(`/timelines/${id}`);
            } else {
                const response = await timelineApi.create(formData);
                toast.success('Timeline created');
                navigate(`/timelines/${response.data.id}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save timeline');
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
        <div className="space-y-6" data-testid="timeline-form-page">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/timelines')} className="rounded-sm" data-testid="back-button">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="page-title">{isEdit ? 'Edit Timeline' : 'Create Timeline'}</h1>
                        <p className="page-description">{isEdit ? 'Update timeline details' : 'Create a new historical timeline'}</p>
                    </div>
                </div>
                <Button onClick={handleSubmit} disabled={saving} className="rounded-sm" data-testid="save-timeline-button">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Timeline'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Timeline Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="e.g., Rise of the Sikh Empire"
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
                                    placeholder="Describe this timeline..."
                                    rows={4}
                                    className="rounded-sm"
                                    data-testid="description-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="era_range">Era Range</Label>
                                <Input
                                    id="era_range"
                                    value={formData.era_range}
                                    onChange={(e) => handleChange('era_range', e.target.value)}
                                    placeholder="e.g., 1699-1849"
                                    className="rounded-sm"
                                    data-testid="era-range-input"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <MediaUploader
                                    value={formData.cover_image}
                                    onChange={(value) => handleChange('cover_image', value)}
                                    accept="image/*,video/*"
                                    label="Cover Image/Video"
                                    description="Upload or select media"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card className="rounded-sm">
                        <CardHeader>
                            <CardTitle>Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-muted rounded-sm overflow-hidden mb-4">
                                {formData.cover_image ? (
                                    <img 
                                        src={formData.cover_image} 
                                        alt="Cover preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => e.target.style.display = 'none'}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Clock className="h-12 w-12 text-muted-foreground/50" />
                                    </div>
                                )}
                            </div>
                            <h3 className="font-semibold font-serif">
                                {formData.title || 'Timeline Title'}
                            </h3>
                            {formData.era_range && (
                                <p className="text-sm text-muted-foreground mt-1">{formData.era_range}</p>
                            )}
                            {formData.description && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{formData.description}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TimelineFormPage;
