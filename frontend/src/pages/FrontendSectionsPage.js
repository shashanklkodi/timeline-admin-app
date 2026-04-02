import { useState, useEffect } from 'react';
import { sectionApi, artifactApi, galleryApi, timelineApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
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
import { Plus, Pencil, Trash2, Layers, GripVertical, Eye, EyeOff, MoveUp, MoveDown } from 'lucide-react';
import { toast } from 'sonner';

const SECTION_TYPES = [
    { value: 'hero_banner', label: 'Hero Banner' },
    { value: 'featured_artifacts', label: 'Featured Artifacts' },
    { value: 'featured_galleries', label: 'Featured Galleries' },
    { value: 'timeline_preview', label: 'Timeline Preview' },
    { value: 'image_banner', label: 'Image Banner' },
    { value: 'video_section', label: 'Video Section' },
    { value: 'text_section', label: 'Text Section' }
];

export const FrontendSectionsPage = () => {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [editingSection, setEditingSection] = useState(null);
    const [formData, setFormData] = useState({
        section_name: '',
        section_type: 'hero_banner',
        data_source: '',
        display_order: 0,
        is_visible: true,
        background_image: '',
        items: []
    });

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const response = await sectionApi.list();
            setSections(response.data);
        } catch (error) {
            toast.error('Failed to load sections');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (section = null) => {
        if (section) {
            setEditingSection(section);
            setFormData({
                section_name: section.section_name,
                section_type: section.section_type,
                data_source: section.data_source || '',
                display_order: section.display_order,
                is_visible: section.is_visible,
                background_image: section.background_image || '',
                items: section.items || []
            });
        } else {
            setEditingSection(null);
            setFormData({
                section_name: '',
                section_type: 'hero_banner',
                data_source: '',
                display_order: sections.length,
                is_visible: true,
                background_image: '',
                items: []
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.section_name.trim()) {
            toast.error('Section name is required');
            return;
        }

        try {
            if (editingSection) {
                await sectionApi.update(editingSection.id, formData);
                toast.success('Section updated');
            } else {
                await sectionApi.create(formData);
                toast.success('Section created');
            }
            setDialogOpen(false);
            fetchSections();
        } catch (error) {
            toast.error('Failed to save section');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await sectionApi.delete(deleteId);
            setSections(sections.filter(s => s.id !== deleteId));
            toast.success('Section deleted');
        } catch (error) {
            toast.error('Failed to delete section');
        } finally {
            setDeleteId(null);
        }
    };

    const handleToggleVisibility = async (section) => {
        try {
            await sectionApi.update(section.id, { is_visible: !section.is_visible });
            setSections(sections.map(s => 
                s.id === section.id ? { ...s, is_visible: !s.is_visible } : s
            ));
            toast.success(`Section ${!section.is_visible ? 'shown' : 'hidden'}`);
        } catch (error) {
            toast.error('Failed to update section');
        }
    };

    const handleMoveSection = async (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sections.length) return;

        const newSections = [...sections];
        [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
        
        // Update display orders
        const orders = newSections.map((s, i) => ({ id: s.id, display_order: i }));
        
        try {
            await sectionApi.reorder(orders);
            setSections(newSections.map((s, i) => ({ ...s, display_order: i })));
            toast.success('Section reordered');
        } catch (error) {
            toast.error('Failed to reorder sections');
        }
    };

    const getSectionTypeName = (type) => {
        return SECTION_TYPES.find(t => t.value === type)?.label || type;
    };

    return (
        <div className="space-y-6" data-testid="frontend-sections-page">
            <div className="flex items-center justify-between">
                <div className="page-header">
                    <h1 className="page-title">Frontend Builder</h1>
                    <p className="page-description">Configure homepage sections for the public website</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="rounded-sm" data-testid="create-section-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                </Button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="rounded-sm">
                            <CardContent className="p-4">
                                <div className="h-12 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : sections.length === 0 ? (
                <Card className="rounded-sm">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No sections configured</h3>
                        <p className="text-muted-foreground mb-4">Add sections to build your homepage</p>
                        <Button onClick={() => handleOpenDialog()} className="rounded-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Section
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {sections.map((section, index) => (
                        <Card 
                            key={section.id} 
                            className={`rounded-sm ${!section.is_visible ? 'opacity-60' : ''}`}
                            data-testid={`section-${section.id}`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => handleMoveSection(index, 'up')}
                                            disabled={index === 0}
                                        >
                                            <MoveUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => handleMoveSection(index, 'down')}
                                            disabled={index === sections.length - 1}
                                        >
                                            <MoveDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium">{section.section_name}</h3>
                                            <Badge variant="secondary">{getSectionTypeName(section.section_type)}</Badge>
                                            {!section.is_visible && (
                                                <Badge variant="outline">Hidden</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Order: {section.display_order + 1}
                                            {section.data_source && ` • Data: ${section.data_source}`}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleToggleVisibility(section)}
                                            className="rounded-sm"
                                            data-testid={`toggle-visibility-${section.id}`}
                                        >
                                            {section.is_visible ? (
                                                <Eye className="h-4 w-4" />
                                            ) : (
                                                <EyeOff className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenDialog(section)}
                                            className="rounded-sm"
                                            data-testid={`edit-section-${section.id}`}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDeleteId(section.id)}
                                            className="rounded-sm text-destructive hover:text-destructive"
                                            data-testid={`delete-section-${section.id}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
                        <DialogDescription>
                            {editingSection ? 'Update section configuration' : 'Configure a new homepage section'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="section_name">Section Name *</Label>
                            <Input
                                id="section_name"
                                value={formData.section_name}
                                onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                                placeholder="e.g., Featured Artifacts"
                                className="rounded-sm"
                                data-testid="section-name-input"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="section_type">Section Type</Label>
                            <Select 
                                value={formData.section_type} 
                                onValueChange={(value) => setFormData({ ...formData, section_type: value })}
                            >
                                <SelectTrigger className="rounded-sm" data-testid="section-type-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SECTION_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="data_source">Data Source (optional)</Label>
                            <Input
                                id="data_source"
                                value={formData.data_source}
                                onChange={(e) => setFormData({ ...formData, data_source: e.target.value })}
                                placeholder="e.g., category:military or gallery:featured"
                                className="rounded-sm"
                                data-testid="data-source-input"
                            />
                            <p className="text-xs text-muted-foreground">
                                Specify where to pull content from (e.g., specific category, gallery, or timeline)
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="background_image">Background Image URL</Label>
                            <Input
                                id="background_image"
                                value={formData.background_image}
                                onChange={(e) => setFormData({ ...formData, background_image: e.target.value })}
                                placeholder="https://..."
                                className="rounded-sm"
                                data-testid="background-image-input"
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Visibility</Label>
                                <p className="text-sm text-muted-foreground">Show this section on the homepage</p>
                            </div>
                            <Switch
                                checked={formData.is_visible}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                                data-testid="visibility-switch"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-sm">
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} className="rounded-sm" data-testid="save-section-button">
                            {editingSection ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Section</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this section? This action cannot be undone.
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

export default FrontendSectionsPage;
