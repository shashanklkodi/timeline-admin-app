import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { timelineApi, artifactApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
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
import { ArrowLeft, Save, Plus, Pencil, Trash2, Clock, CalendarDays, MapPin, Search, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export const TimelineDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [timeline, setTimeline] = useState(null);
    const [events, setEvents] = useState([]);
    const [allArtifacts, setAllArtifacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [eventDialogOpen, setEventDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [deleteEventId, setDeleteEventId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [eventForm, setEventForm] = useState({
        event_title: '',
        event_date: '',
        event_year: '',
        description: '',
        location: '',
        artifacts: []
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [timelineRes, eventsRes, artifactsRes] = await Promise.all([
                timelineApi.get(id),
                timelineApi.listEvents(id),
                artifactApi.list({ status: 'published' })
            ]);
            setTimeline(timelineRes.data);
            setEvents(eventsRes.data);
            setAllArtifacts(artifactsRes.data);
        } catch (error) {
            toast.error('Failed to load timeline');
            navigate('/timelines');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEventDialog = (event = null) => {
        if (event) {
            setEditingEvent(event);
            setEventForm({
                event_title: event.event_title || '',
                event_date: event.event_date || '',
                event_year: event.event_year?.toString() || '',
                description: event.description || '',
                location: event.location || '',
                artifacts: event.artifacts?.map(a => a.id) || []
            });
        } else {
            setEditingEvent(null);
            setEventForm({
                event_title: '',
                event_date: '',
                event_year: '',
                description: '',
                location: '',
                artifacts: []
            });
        }
        setEventDialogOpen(true);
    };

    const handleSaveEvent = async () => {
        if (!eventForm.event_title.trim()) {
            toast.error('Event title is required');
            return;
        }

        setSaving(true);
        try {
            const data = {
                ...eventForm,
                event_year: eventForm.event_year ? parseInt(eventForm.event_year) : null
            };

            if (editingEvent) {
                await timelineApi.updateEvent(id, editingEvent.id, data);
                toast.success('Event updated');
            } else {
                await timelineApi.createEvent(id, data);
                toast.success('Event created');
            }
            setEventDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Failed to save event');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!deleteEventId) return;
        try {
            await timelineApi.deleteEvent(id, deleteEventId);
            setEvents(events.filter(e => e.id !== deleteEventId));
            toast.success('Event deleted');
        } catch (error) {
            toast.error('Failed to delete event');
        } finally {
            setDeleteEventId(null);
        }
    };

    const toggleArtifact = (artifactId) => {
        if (eventForm.artifacts.includes(artifactId)) {
            setEventForm({
                ...eventForm,
                artifacts: eventForm.artifacts.filter(a => a !== artifactId)
            });
        } else {
            setEventForm({
                ...eventForm,
                artifacts: [...eventForm.artifacts, artifactId]
            });
        }
    };

    const filteredArtifacts = allArtifacts.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="space-y-6" data-testid="timeline-detail-page">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/timelines')} className="rounded-sm" data-testid="back-button">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="page-title">{timeline?.title}</h1>
                        <p className="page-description">{timeline?.era_range || 'No era specified'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/timelines/${id}/edit`)} className="rounded-sm" data-testid="edit-timeline-button">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Timeline
                    </Button>
                    <Button onClick={() => handleOpenEventDialog()} className="rounded-sm bg-accent text-accent-foreground hover:bg-accent/90" data-testid="add-event-button">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Event
                    </Button>
                </div>
            </div>

            {/* Timeline description */}
            {timeline?.description && (
                <Card className="rounded-sm">
                    <CardContent className="p-4">
                        <p className="text-muted-foreground">{timeline.description}</p>
                    </CardContent>
                </Card>
            )}

            {/* Events */}
            <div className="space-y-4">
                <h2 className="text-xl font-serif font-semibold">Events ({events.length})</h2>
                
                {events.length === 0 ? (
                    <Card className="rounded-sm">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No events yet</h3>
                            <p className="text-muted-foreground mb-4">Add events to build your timeline</p>
                            <Button onClick={() => handleOpenEventDialog()} className="rounded-sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Event
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
                        
                        <div className="space-y-6">
                            {events.map((event, index) => (
                                <div key={event.id} className="relative pl-12" data-testid={`event-${event.id}`}>
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-2 w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-accent-foreground" />
                                    </div>
                                    
                                    <Card className="rounded-sm">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg font-serif">{event.event_title}</CardTitle>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                        {event.event_year && (
                                                            <span className="flex items-center gap-1">
                                                                <CalendarDays className="h-3.5 w-3.5" />
                                                                {event.event_year}
                                                            </span>
                                                        )}
                                                        {event.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {event.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleOpenEventDialog(event)}
                                                        className="rounded-sm h-8 w-8"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => setDeleteEventId(event.id)}
                                                        className="rounded-sm h-8 w-8 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {event.description && (
                                                <p className="text-muted-foreground text-sm mb-4">{event.description}</p>
                                            )}
                                            {event.artifacts && event.artifacts.length > 0 && (
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground mb-2">ATTACHED ARTIFACTS</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {event.artifacts.map(artifact => (
                                                            <Badge key={artifact.id} variant="secondary" className="gap-2">
                                                                {artifact.thumbnail_image && (
                                                                    <img 
                                                                        src={artifact.thumbnail_image} 
                                                                        alt=""
                                                                        className="h-4 w-4 rounded-sm object-cover"
                                                                    />
                                                                )}
                                                                {artifact.title}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Event Dialog */}
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
                        <DialogDescription>
                            {editingEvent ? 'Update event details' : 'Add a new event to the timeline'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="event_title">Event Title *</Label>
                            <Input
                                id="event_title"
                                value={eventForm.event_title}
                                onChange={(e) => setEventForm({ ...eventForm, event_title: e.target.value })}
                                placeholder="e.g., Gurta Gaddi"
                                className="rounded-sm"
                                data-testid="event-title-input"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="event_year">Year</Label>
                                <Input
                                    id="event_year"
                                    type="number"
                                    value={eventForm.event_year}
                                    onChange={(e) => setEventForm({ ...eventForm, event_year: e.target.value })}
                                    placeholder="e.g., 1708"
                                    className="rounded-sm"
                                    data-testid="event-year-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="event_date">Date (optional)</Label>
                                <Input
                                    id="event_date"
                                    value={eventForm.event_date}
                                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                                    placeholder="e.g., March 15"
                                    className="rounded-sm"
                                    data-testid="event-date-input"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={eventForm.location}
                                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                                placeholder="Where did this event occur?"
                                className="rounded-sm"
                                data-testid="event-location-input"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={eventForm.description}
                                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                placeholder="Describe this event..."
                                rows={3}
                                className="rounded-sm"
                                data-testid="event-description-input"
                            />
                        </div>
                        
                        {/* Artifacts selection */}
                        <div className="space-y-2">
                            <Label>Attach Artifacts ({eventForm.artifacts.length} selected)</Label>
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search artifacts..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 rounded-sm"
                                />
                            </div>
                            <ScrollArea className="h-[200px] border rounded-sm p-2">
                                <div className="space-y-2">
                                    {filteredArtifacts.map(artifact => (
                                        <div 
                                            key={artifact.id}
                                            className={`flex items-center gap-3 p-2 rounded-sm cursor-pointer transition-colors ${
                                                eventForm.artifacts.includes(artifact.id) 
                                                    ? 'bg-accent/20 border border-accent' 
                                                    : 'hover:bg-muted/50 border border-transparent'
                                            }`}
                                            onClick={() => toggleArtifact(artifact.id)}
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
                                            <span className="flex-1 text-sm font-medium truncate">{artifact.title}</span>
                                            {eventForm.artifacts.includes(artifact.id) && (
                                                <Badge variant="default">Selected</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEventDialogOpen(false)} className="rounded-sm">
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEvent} disabled={saving} className="rounded-sm" data-testid="save-event-button">
                            {saving ? 'Saving...' : (editingEvent ? 'Update' : 'Create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Event Dialog */}
            <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this event? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default TimelineDetailPage;
