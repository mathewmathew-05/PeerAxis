import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { Calendar, Users, Trophy, Star, Clock, Inbox, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';

const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch real sessions
      const sessionsRes = await fetch(
        `http://localhost:5000/api/sessions/user/${user.user_id}`
      );
      const sessionsData = await sessionsRes.json();
      setSessions(sessionsData);

      // Fetch real requests
      const requestsRes = await fetch(
        `http://localhost:5000/api/requests/user/${user.user_id}`
      );
      const requestsData = await requestsRes.json();
      setReceivedRequests(requestsData.received || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const upcomingSessions = sessions
    .filter(s => s.status === 'scheduled' && new Date(s.scheduled_date) > new Date())
    .slice(0, 3);

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const pendingRequests = receivedRequests.filter(r => r.status === 'pending');

  // Unique mentees = distinct mentee_ids from accepted requests or active sessions
  const uniqueMenteeIds = new Set(sessions.map(s => s.mentee_id));
  const totalMentees = uniqueMenteeIds.size;

  const avgRating =
    completedSessions.length > 0
      ? completedSessions.reduce((acc, s) => acc + (Number(s.rating) || 0), 0) /
        completedSessions.length
      : 0;

  const points = completedSessions.length * 50 + totalMentees * 100;

  const stats = [
    { label: 'Total Mentees', value: totalMentees, icon: Users, color: 'text-primary' },
    { label: 'Sessions Completed', value: completedSessions.length, icon: Clock, color: 'text-secondary' },
    { label: 'Average Rating', value: avgRating.toFixed(1), icon: Star, color: 'text-accent' },
    { label: 'Points Earned', value: points, icon: Trophy, color: 'text-success' }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Welcome back, {user.name}! 🚀</h2>
          <p className="text-muted-foreground">Your mentoring impact dashboard</p>
        </div>
        {/* Pending requests badge — always visible if there are any */}
        {pendingRequests.length > 0 && (
          <Button onClick={() => navigate('/requests')} className="relative">
            <Inbox className="mr-2 w-4 h-4" />
            Pending Requests
            <Badge variant="destructive" className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs">
              {pendingRequests.length}
            </Badge>
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-display font-bold">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mentoring Requests</CardTitle>
                <CardDescription>Students requesting your mentorship</CardDescription>
              </div>
              {pendingRequests.length > 0 && (
                <Badge variant="destructive">{pendingRequests.length} pending</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No pending requests</p>
                </div>
              ) : (
                pendingRequests.slice(0, 3).map((request) => (
                  <div
                    key={request.request_id}
                    className="p-4 border border-border rounded-lg hover:bg-muted transition-smooth cursor-pointer"
                    onClick={() => navigate('/requests')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={request.mentee_avatar} />
                          <AvatarFallback>{request.mentee_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{request.mentee_name}</p>
                          <p className="text-xs text-muted-foreground">{request.mentee_department}</p>
                        </div>
                      </div>
                      <Badge>pending</Badge>
                    </div>
                    {request.message && (
                      <p className="text-xs text-muted-foreground mt-2 truncate">
                        "{request.message}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={() => navigate('/requests')}>
              {pendingRequests.length > 0 ? 'View All Requests' : 'View Requests'}
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled mentoring sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="p-4 border border-border rounded-lg hover:bg-muted transition-smooth cursor-pointer"
                    onClick={() => navigate(`/sessions/${session.session_id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={session.mentee_avatar} />
                          <AvatarFallback>{session.mentee_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{session.mentee_name}</p>
                          <p className="text-xs text-muted-foreground">{session.topic}</p>
                        </div>
                      </div>
                      <Badge>{session.mode}</Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(session.scheduled_date), 'MMM dd, h:mm a')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button className="w-full mt-4" variant="outline" onClick={() => navigate('/sessions')}>
              View All Sessions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Your Impact This Month</CardTitle>
          <CardDescription>Track your mentoring contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-display font-bold text-primary mb-1">{completedSessions.length}</div>
              <p className="text-sm text-muted-foreground">Sessions Conducted</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-display font-bold text-secondary mb-1">
                {completedSessions.reduce((acc, s) => acc + (s.duration || 60), 0) / 60}h
              </div>
              <p className="text-sm text-muted-foreground">Hours Contributed</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-display font-bold text-accent mb-1">{points}</div>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-smooth" onClick={() => navigate('/requests')}>
          <CardContent className="p-6">
            <Inbox className="w-10 h-10 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Manage Requests</h3>
            <p className="text-sm text-muted-foreground">Accept or decline mentoring requests</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-secondary transition-smooth" onClick={() => navigate('/sessions')}>
          <CardContent className="p-6">
            <Calendar className="w-10 h-10 text-secondary mb-3" />
            <h3 className="font-semibold mb-1">Sessions</h3>
            <p className="text-sm text-muted-foreground">View and manage your sessions</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-accent transition-smooth" onClick={() => navigate('/leaderboard')}>
          <CardContent className="p-6">
            <Trophy className="w-10 h-10 text-accent mb-3" />
            <h3 className="font-semibold mb-1">View Leaderboard</h3>
            <p className="text-sm text-muted-foreground">See your ranking</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MentorDashboard;