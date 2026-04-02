import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { timelineApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
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
import { Plus, MoreHorizontal, Pencil, Trash2, Clock, Eye, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, truncate } from '../lib/utils';

export const TimelinesListPage = () => {
    const navigate = useNavigate();
    const [timelines, setTimelines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        fetchTimelines();
    }, []);

    const fetchTimelines = async () => {
        try {
            const response = await timelineApi.list();
            setTimelines(response.data);
        } catch (error) {
            toast.error('Failed to load timelines');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await timelineApi.delete(deleteId);
            setTimelines(timelines.filter(t => t.id !== deleteId));
            toast.success('Timeline deleted');
        } catch (error) {
            toast.error('Failed to delete timeline');
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6" data-testid="timelines-list-page">
            <div className="flex items-center justify-between">
                <div className="page-header">
                    <h1 className="page-title">Timelines</h1>
                    <p className="page-description">Historical timelines with events and artifacts</p>
                </div>
                <Button onClick={() => navigate('/timelines/new')} className="rounded-sm" data-testid="create-timeline-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Timeline
                </Button>
            </div>

            <Card className="rounded-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Timeline</TableHead>
                            <TableHead>Era Range</TableHead>
                            <TableHead>Events</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}>
                                        <div className="h-8 bg-muted animate-pulse rounded" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : timelines.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    No timelines yet. Create your first timeline!
                                </TableCell>
                            </TableRow>
                        ) : (
                            timelines.map(timeline => (
                                <TableRow key={timeline.id} data-testid={`timeline-row-${timeline.id}`}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {timeline.cover_image ? (
                                                <img 
                                                    src={timeline.cover_image} 
                                                    alt={timeline.title}
                                                    className="h-10 w-14 object-cover rounded-sm"
                                                />
                                            ) : (
                                                <div className="h-10 w-14 bg-muted rounded-sm flex items-center justify-center">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">{truncate(timeline.title, 40)}</p>
                                                {timeline.description && (
                                                    <p className="text-xs text-muted-foreground">{truncate(timeline.description, 50)}</p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{timeline.era_range || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            <CalendarDays className="h-3 w-3 mr-1" />
                                            {timeline.events_count || 0} events
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(timeline.created_at)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-sm" data-testid={`timeline-actions-${timeline.id}`}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/timelines/${timeline.id}`)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View & Manage Events
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => navigate(`/timelines/${timeline.id}/edit`)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => setDeleteId(timeline.id)}
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
                        <AlertDialogTitle>Delete Timeline</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this timeline? All events within this timeline will also be deleted.
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

export default TimelinesListPage;
