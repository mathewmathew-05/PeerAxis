import React from 'react';
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { Calendar, Target, Users, TrendingUp, Clock, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { format } from 'date-fns';

const MenteeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [recommendedMentors, setRecommendedMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMentors, setLoadingMentors] = useState(true);

  useEffect(() => {
    if (!user?.user_id) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch real sessions
      const sessionsRes = await fetch(
        `http://localhost:5000/api/sessions/user/${user.user_id}`
      );
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
      }

      // Fetch real goals
      const goalsRes = await fetch(
        `http://localhost:5000/api/goals/user/${user.user_id}`
      );
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setGoals(goalsData);
      }

      // Fetch recommended mentors
      const mentorsRes = await fetch(
        `http://localhost:5000/api/matching/mentors/${user.user_id}`
      );
      if (mentorsRes.ok) {
        const mentorsData = await mentorsRes.json();
        setRecommendedMentors(mentorsData.slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
      setLoadingMentors(false);
    }
  };

  const upcomingSessions = sessions.filter(
    s => s.status === 'scheduled' && new Date(s.scheduled_date) > new Date()
  ).slice(0, 3);

  const completedSessions = sessions.filter(s => s.status === 'completed');
  const activeGoals = goals.filter(g => g.status !== 'completed');
  const avgGoalProgress = activeGoals.length > 0
    ? activeGoals.reduce((acc, g) => acc + (Number(g.progress) || 0), 0) / activeGoals.length
    : 0;

  const stats = [
    { label: 'Active Goals', value: activeGoals.length, icon: Target, color: 'text-primary' },
    { label: 'Upcoming Sessions', value: upcomingSessions.length, icon: Calendar, color: 'text-secondary' },
    { label: 'Sessions Completed', value: completedSessions.length, icon: Clock, color: 'text-accent' },
    { label: 'Avg. Progress', value: `${Math.round(avgGoalProgress)}%`, icon: TrendingUp, color: 'text-success' }
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
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Welcome back, {user.name}! 👋</h2>
        <p className="text-muted-foreground">Here's your learning progress overview</p>
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
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Goals */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Goals</CardTitle>
                <CardDescription>Track your learning objectives</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/goals')}>
                View All
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeGoals.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No active goals yet</p>
                  <Button className="mt-4" onClick={() => navigate('/goals')}>
                    Create Your First Goal
                  </Button>
                </div>
              ) : (
                activeGoals.slice(0, 3).map((goal) => (
                  <div key={goal.goal_id || goal.id} className="p-4 border border-border rounded-lg hover:border-primary transition-smooth cursor-pointer" onClick={() => navigate('/goals')}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{goal.title}</h4>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                      <Badge variant={goal.status === 'on_track' ? 'default' : 'destructive'}>
                        {goal.status === 'on_track' ? 'On Track' : goal.status === 'at_risk' ? 'At Risk' : goal.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={Number(goal.progress)} className="h-2" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Sessions — now from real API */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled mentoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                  <Button size="sm" className="mt-3" onClick={() => navigate('/find-mentor')}>
                    Find a Mentor
                  </Button>
                </div>
              ) : (
                upcomingSessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="p-3 border border-border rounded-lg hover:bg-muted transition-smooth cursor-pointer"
                    onClick={() => navigate(`/sessions/${session.session_id}`)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={session.mentor_avatar} />
                        <AvatarFallback>{session.mentor_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{session.mentor_name}</p>
                        <p className="text-xs text-muted-foreground">{session.topic}</p>
                        <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(session.scheduled_date), 'MMM dd, h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {upcomingSessions.length > 0 && (
              <Button className="w-full mt-4" variant="outline" onClick={() => navigate('/sessions')}>
                View All Sessions
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Mentors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recommended Mentors</CardTitle>
              <CardDescription>Find your perfect mentor match</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/find-mentor')}>
              Browse All
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMentors ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Finding the best mentors for you…
            </p>
          ) : recommendedMentors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No mentor recommendations available
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedMentors.map((mentor) => (
                <div
                  key={mentor.mentor_id}
                  className="p-5 border border-border rounded-xl bg-background hover:border-primary transition-smooth cursor-pointer"
                  onClick={() => navigate('/find-mentor')}
                >
                  <div className="mb-4">
                    <h4 className="font-semibold text-base leading-tight mb-1">
                      {mentor.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {mentor.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span className="font-semibold text-sm">
                      {Number(mentor.rating).toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {mentor.matchedSkills?.slice(0, 3).map(skill => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-smooth" onClick={() => navigate('/find-mentor')}>
          <CardContent className="p-6">
            <Users className="w-10 h-10 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Find a Mentor</h3>
            <p className="text-sm text-muted-foreground">Connect with experienced seniors</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-secondary transition-smooth" onClick={() => navigate('/goals')}>
          <CardContent className="p-6">
            <Target className="w-10 h-10 text-secondary mb-3" />
            <h3 className="font-semibold mb-1">Set a Goal</h3>
            <p className="text-sm text-muted-foreground">Create SMART learning objectives</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-accent transition-smooth" onClick={() => navigate('/recommendations')}>
          <CardContent className="p-6">
            <TrendingUp className="w-10 h-10 text-accent mb-3" />
            <h3 className="font-semibold mb-1">Get Recommendations</h3>
            <p className="text-sm text-muted-foreground">AI-powered learning resources</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MenteeDashboard;