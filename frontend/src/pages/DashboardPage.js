import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { dashboardApi } from '../lib/api';
import { formatDateTime, truncate } from '../lib/utils';
import {
    Package,
    Image,
    Clock,
    Users,
    FileImage,
    FolderTree,
    ArrowUpRight,
    TrendingUp
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, description, href }) => (
    <Card className="rounded-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-semibold font-serif">{value}</div>
            {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            {href && (
                <Link 
                    to={href} 
                    className="text-xs text-accent hover:underline flex items-center gap-1 mt-2"
                    data-testid={`stat-link-${title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                    View all <ArrowUpRight className="h-3 w-3" />
                </Link>
            )}
        </CardContent>
    </Card>
);

const RecentItemCard = ({ title, items, type, emptyMessage }) => (
    <Card className="rounded-sm">
        <CardHeader>
            <CardTitle className="text-lg font-serif">{title}</CardTitle>
            <CardDescription>Most recently added</CardDescription>
        </CardHeader>
        <CardContent>
            {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div 
                            key={item.id || index}
                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {item.title || item.file_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDateTime(item.created_at)}
                                </p>
                            </div>
                            {item.status && (
                                <Badge 
                                    variant={item.status === 'published' ? 'default' : 'secondary'}
                                    className="ml-2"
                                >
                                    {item.status}
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
);

export const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, activityRes] = await Promise.all([
                    dashboardApi.getStats(),
                    dashboardApi.getRecentActivity()
                ]);
                setStats(statsRes.data);
                setRecentActivity(activityRes.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, []);
    
    if (loading) {
        return (
            <div className="space-y-8">
                <div className="page-header">
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-description">Overview of your museum collection</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i} className="rounded-sm">
                            <CardContent className="p-6">
                                <div className="h-20 bg-muted animate-pulse rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-8" data-testid="dashboard-page">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">Overview of your museum collection</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Artifacts"
                    value={stats?.total_artifacts || 0}
                    icon={Package}
                    description={`${stats?.published_artifacts || 0} published`}
                    href="/artifacts"
                />
                <StatCard
                    title="Galleries"
                    value={stats?.total_galleries || 0}
                    icon={Image}
                    href="/galleries"
                />
                <StatCard
                    title="Timelines"
                    value={stats?.total_timelines || 0}
                    icon={Clock}
                    href="/timelines"
                />
                <StatCard
                    title="Users"
                    value={stats?.total_users || 0}
                    icon={Users}
                    href="/users"
                />
                <StatCard
                    title="Media Files"
                    value={stats?.total_media || 0}
                    icon={FileImage}
                    href="/media"
                />
                <StatCard
                    title="Categories"
                    value={stats?.total_categories || 0}
                    icon={FolderTree}
                    href="/categories"
                />
                <StatCard
                    title="Draft Artifacts"
                    value={stats?.draft_artifacts || 0}
                    icon={Package}
                    description="Awaiting publication"
                />
                <StatCard
                    title="Published"
                    value={stats?.published_artifacts || 0}
                    icon={TrendingUp}
                    description="Live on platform"
                />
            </div>
            
            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RecentItemCard
                    title="Recent Artifacts"
                    items={recentActivity?.recent_artifacts || []}
                    type="artifact"
                    emptyMessage="No artifacts yet. Create your first artifact!"
                />
                <RecentItemCard
                    title="Recent Galleries"
                    items={recentActivity?.recent_galleries || []}
                    type="gallery"
                    emptyMessage="No galleries yet. Create your first gallery!"
                />
                <RecentItemCard
                    title="Recent Media"
                    items={recentActivity?.recent_media || []}
                    type="media"
                    emptyMessage="No media uploaded yet."
                />
            </div>
        </div>
    );
};

export default DashboardPage;
