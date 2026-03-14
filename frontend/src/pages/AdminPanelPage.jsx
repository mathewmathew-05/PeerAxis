import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Shield, Users, Activity, Flag, Trophy, Trash2, Ban, UserCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

const AdminPanelPage = () => {
  const [users, setUsers] = useState([]);
  const [negativeFeedback, setNegativeFeedback] = useState([]);
  const [mentorStats, setMentorStats] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, feedbackRes, mentorsRes, leaderboardRes] = await Promise.all([
        api.get('/users'),
        api.get('/sessions/admin/negative-feedback'),
        api.get('/sessions/admin/mentor-status'),
        api.get('/analytics/leaderboard')
      ]);
      setUsers(usersRes.data);
      setNegativeFeedback(feedbackRes.data);
      setMentorStats(mentorsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.user_id !== userId));
      toast.success(`${userName} deleted`);
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'ban';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await api.put(`/users/${userId}/status`, { is_active: newStatus });
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, is_active: newStatus } : u
      ));
      toast.success(`User ${newStatus ? 'activated' : 'banned'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user status');
    }
  };

  if (loading) return <div className="p-8">Loading admin panel...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Admin Control Panel</h2>
        <p className="text-muted-foreground">System-wide management and monitoring</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="monitoring">Feedback & Quality</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Directory</CardTitle>
              <CardDescription>Manage all registered users</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p>{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge variant="destructive">admin</Badge>
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(val) => handleRoleChange(user.user_id, val)}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mentee">mentee</SelectItem>
                              <SelectItem value="mentor">mentor</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        {user.is_active === false
                          ? <Badge variant="destructive">Banned</Badge>
                          : <Badge variant="outline" className="text-green-600">Active</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        {user.role !== 'admin' && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={user.is_active === false ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}
                              onClick={() => handleToggleStatus(user.user_id, user.is_active !== false)}
                              title={user.is_active === false ? 'Activate User' : 'Ban User'}
                            >
                              {user.is_active === false
                                ? <UserCheck className="w-4 h-4" />
                                : <Ban className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(user.user_id, user.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Negative Feedback */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Flag className="w-5 h-5 text-destructive" />
                  <CardTitle>Negative Feedback (≤ 2 stars)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {negativeFeedback.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No negative feedback reported.</p>
                ) : (
                  <div className="space-y-4">
                    {negativeFeedback.map(session => (
                      <div key={session.session_id} className="p-4 border rounded-lg bg-destructive/5">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-sm">{session.mentor_name}</p>
                            <p className="text-xs text-muted-foreground">Session: {session.topic}</p>
                          </div>
                          <Badge variant="destructive">{session.rating} ★</Badge>
                        </div>
                        <p className="text-sm italic">"{session.feedback}"</p>
                        <p className="text-xs text-muted-foreground mt-2">- {session.mentee_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mentor Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <CardTitle>Mentor Performance Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mentorStats.slice(0, 5).map(mentor => {
                    const completionRate = mentor.total_sessions > 0
                      ? Math.round((mentor.completed_sessions / mentor.total_sessions) * 100)
                      : 0;
                    return (
                      <div key={mentor.user_id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{mentor.name}</span>
                          <span className="text-muted-foreground">{mentor.rating || '-'} ★ ({mentor.total_sessions} sessions)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={completionRate} className="h-2" />
                          <span className="text-xs w-8 text-right">{completionRate}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Section (Integrated) */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-accent" />
                <CardTitle>Mentor Leaderboard</CardTitle>
              </div>
              <CardDescription>Top performing mentors based on points and badges</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Rank</TableHead>
                    <TableHead>Mentor</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Badges</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((mentor, idx) => (
                    <TableRow key={mentor.id}>
                      <TableCell className="font-bold">
                        {idx < 3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                            idx === 1 ? 'bg-gray-100 text-gray-600' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                            {idx + 1}
                          </div>
                        ) : idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`} />
                            <AvatarFallback>{mentor.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{mentor.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{mentor.department || 'N/A'}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{mentor.points}</TableCell>
                      <TableCell className="text-right">{mentor.badges}</TableCell>
                      <TableCell className="text-right">{mentor.sessionsCompleted}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Platform-wide settings and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">Maintenance Mode</h4>
                  <p className="text-sm text-muted-foreground">Disable new session bookings</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">Data Backup</h4>
                  <p className="text-sm text-muted-foreground">Last backup: Never</p>
                </div>
                <Button>Backup Now</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanelPage;