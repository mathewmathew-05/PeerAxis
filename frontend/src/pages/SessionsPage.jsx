import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Calendar as CalendarIcon, Clock, MapPin, Video, Plus } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';

const SessionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/sessions/user/${user.user_id}`
      );
      
      if (!res.ok) throw new Error('Failed to fetch sessions');
      
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const upcomingSessions = sessions.filter(s => {
    return s.status === 'scheduled' && new Date(s.scheduled_date) > new Date();
  });
  
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const cancelledSessions = sessions.filter(s => s.status === 'cancelled');

  const SessionCard = ({ session }) => {
    const otherUserName = user.role === 'mentor' 
      ? session.mentee_name 
      : session.mentor_name;
    const otherUserAvatar = user.role === 'mentor' 
      ? session.mentee_avatar 
      : session.mentor_avatar;

    return (
      <Card
        className="hover:border-primary transition-smooth cursor-pointer"
        onClick={() => navigate(`/sessions/${session.session_id}`)}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={otherUserAvatar} />
                <AvatarFallback>{otherUserName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{otherUserName}</h3>
                <p className="text-sm text-muted-foreground">{session.topic}</p>
              </div>
            </div>
            <Badge variant={
              session.status === 'scheduled' ? 'default' : 
              session.status === 'completed' ? 'secondary' : 
              'destructive'
            }>
              {session.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <CalendarIcon className="w-4 h-4" />
              <span>{format(new Date(session.scheduled_date), 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(session.scheduled_date), 'h:mm a')}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              {session.mode === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              <span>{session.mode === 'online' ? 'Online' : session.location}</span>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{session.duration} min</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <p className="text-muted-foreground">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Sessions</h2>
          <p className="text-muted-foreground">Manage your mentoring sessions</p>
        </div>
        <Button onClick={() => navigate(user.role === 'mentee' ? '/find-mentor' : '/requests')}>
          <Plus className="mr-2 w-4 h-4" />
          {user.role === 'mentee' ? 'Find Mentor' : 'View Requests'}
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcomingSessions.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedSessions.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming sessions</p>
                <Button 
                  className="mt-4" 
                  onClick={() => navigate(user.role === 'mentee' ? '/find-mentor' : '/requests')}
                >
                  {user.role === 'mentee' ? 'Find a Mentor' : 'View Requests'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingSessions.map(session => <SessionCard key={session.session_id} session={session} />)
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedSessions.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">No completed sessions yet</p>
              </CardContent>
            </Card>
          ) : (
            completedSessions.map(session => <SessionCard key={session.session_id} session={session} />)
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledSessions.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">No cancelled sessions</p>
              </CardContent>
            </Card>
          ) : (
            cancelledSessions.map(session => <SessionCard key={session.session_id} session={session} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionsPage;