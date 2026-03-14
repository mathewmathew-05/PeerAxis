import React, { useState } from 'react';
import { Download, FileText, Users, Activity, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import api from '../lib/api';
import { toast } from 'sonner';

const ReportsPage = () => {
    const [downloading, setDownloading] = useState(null);

    const downloadReport = async (type) => {
        setDownloading(type);
        try {
            let data = [];
            let filename = `report-${type}-${new Date().toISOString().split('T')[0]}.csv`;
            let headers = [];

            // Fetch data based on report type
            if (type === 'users') {
                const res = await api.get('/users');
                data = res.data;
                headers = ['User ID', 'Name', 'Email', 'Role', 'Department', 'Created At'];
            } else if (type === 'sessions') {
                const res = await api.get('/sessions/admin/all'); // Reuse the admin all sessions endpoint
                data = res.data;
                headers = ['Session ID', 'Topic', 'Mentor', 'Mentee', 'Date', 'Status', 'Rating', 'Feedback'];
            } else if (type === 'performance') {
                const res = await api.get('/sessions/admin/mentor-status');
                data = res.data;
                headers = ['Mentor ID', 'Name', 'Rating', 'Total Sessions', 'Completed', 'Cancelled'];
            } else if (type === 'exchanges') {
                const res = await api.get('/skills');
                data = res.data;
                headers = ['Exchange ID', 'Skill Name', 'Type', 'Description', 'Posted By', 'Status', 'Created At'];
            }

            // Convert to CSV
            const csvContent = [
                headers.join(','),
                ...data.map(row => {
                    if (type === 'users') {
                        return [
                            row.user_id,
                            `"${row.name}"`,
                            row.email,
                            row.role,
                            row.department || '',
                            row.created_at
                        ].join(',');
                    }
                    if (type === 'sessions') {
                        return [
                            row.session_id,
                            `"${row.topic}"`,
                            `"${row.mentor_name}"`,
                            `"${row.mentee_name}"`,
                            row.scheduled_date,
                            row.status,
                            row.rating || '',
                            `"${(row.feedback || '').replace(/"/g, '""')}"`
                        ].join(',');
                    }
                    if (type === 'performance') {
                        return [
                            row.user_id,
                            `"${row.name}"`,
                            row.rating,
                            row.total_sessions,
                            row.completed_sessions,
                            row.cancelled_sessions
                        ].join(',');
                    }
                    if (type === 'exchanges') {
                        return [
                            row.exchange_id,
                            `"${row.skill_name}"`,
                            row.exchange_type,
                            `"${(row.description || '').replace(/"/g, '""')}"`,
                            `"${row.user_name || ''}"`,
                            row.status,
                            row.created_at
                        ].join(',');
                    }
                    return '';
                })
            ].join('\n');

            // Trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`);
        } catch (err) {
            console.error(`Error downloading ${type} report:`, err);
            toast.error(`Failed to download ${type} report`);
        } finally {
            setDownloading(null);
        }
    };

    const ReportCard = ({ type, title, description, icon: Icon, endpoint }) => (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-muted rounded-lg">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                </div>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => downloadReport(type)}
                    disabled={downloading === type}
                >
                    <Download className="w-4 h-4 mr-2" />
                    {downloading === type ? 'Preparing...' : 'Export CSV'}
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-3xl font-display font-bold mb-2">Reports & Analytics</h2>
                <p className="text-muted-foreground">Export platform data for analysis</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                    type="users"
                    title="User Directory"
                    description="Export details of all registered mentors and mentees"
                    icon={Users}
                />
                <ReportCard
                    type="sessions"
                    title="Session Logs"
                    description="Complete history of all scheduled sessions and their status"
                    icon={FileText}
                    endpoint="/sessions/admin/all"
                />
                <ReportCard
                    type="performance"
                    title="Mentor Performance"
                    description="Analytics on mentor ratings, session completion, and feedback"
                    icon={BarChart}
                />
                <ReportCard
                    type="exchanges"
                    title="Skill Exchanges"
                    description="All skill exchange posts — what users are offering and wanting"
                    icon={Activity}
                />
            </div>
        </div>
    );
};

export default ReportsPage;
