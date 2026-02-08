import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMockData } from '../../hooks/useMockData';
import { motion } from 'framer-motion';
import { Users, Calendar, TrendingUp, Award, Activity, Shield, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { sessions, leaderboard } = useMockData(user);
  const navigate = useNavigate();

  const totalMentors = 25;
  const totalMentees = 150;
  const activeSessions = sessions.filter(s => s.status === 'upcoming').length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const avgRating = 4.6;

  const stats = [
    { label: 'Total Mentors', value: totalMentors, icon: Users, color: 'text-primary', change: '+12%' },
    { label: 'Total Mentees', value: totalMentees, icon: Users, color: 'text-secondary', change: '+28%' },
    { label: 'Active Sessions', value: activeSessions, icon: Calendar, color: 'text-accent', change: '+5%' },
    { label: 'Avg Rating', value: avgRating.toFixed(1), icon: Award, color: 'text-success', change: '+0.3' }
  ];

  // Mock data for charts
  const sessionsData = [
    { month: 'Jan', sessions: 45 },
    { month: 'Feb', sessions: 52 },
    { month: 'Mar', sessions: 61 },
    { month: 'Apr', sessions: 58 },
    { month: 'May', sessions: 70 },
    { month: 'Jun', sessions: 65 }
  ];

  const departmentData = [
    { name: 'CS', value: 45 },
    { name: 'IT', value: 30 },
    { name: 'ECE', value: 15 },
    { name: 'ME', value: 10 }
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--success))'];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Admin Dashboard 🔒</h2>
        <p className="text-muted-foreground">Monitor and manage the mentoring program</p>
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
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-success">{stat.change}</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sessions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions Over Time</CardTitle>
            <CardDescription>Monthly session trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sessionsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Mentors by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Mentors */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Mentors</CardTitle>
          <CardDescription>Based on sessions and ratings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((mentor, idx) => (
              <div key={mentor.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    idx === 0 ? 'bg-accent text-accent-foreground' :
                    idx === 1 ? 'bg-muted text-foreground' :
                    'bg-muted/50 text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{mentor.name}</p>
                    <p className="text-sm text-muted-foreground">{mentor.department}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{mentor.points} pts</p>
                  <p className="text-sm text-muted-foreground">{mentor.sessionsCompleted} sessions</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-smooth" onClick={() => navigate('/admin')}>
          <CardContent className="p-6">
            <Shield className="w-10 h-10 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Manage Users</h3>
            <p className="text-sm text-muted-foreground">View and edit user accounts</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-secondary transition-smooth" onClick={() => navigate('/sessions')}>
          <CardContent className="p-6">
            <Activity className="w-10 h-10 text-secondary mb-3" />
            <h3 className="font-semibold mb-1">Monitor Sessions</h3>
            <p className="text-sm text-muted-foreground">Track all mentoring sessions</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-accent transition-smooth" onClick={() => navigate('/leaderboard')}>
          <CardContent className="p-6">
            <BarChart3 className="w-10 h-10 text-accent mb-3" />
            <h3 className="font-semibold mb-1">View Reports</h3>
            <p className="text-sm text-muted-foreground">Generate analytics reports</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;