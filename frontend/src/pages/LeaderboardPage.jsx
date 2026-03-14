import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Trophy, Medal, Award, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { BADGE_TYPES } from '../types';
import api from '../lib/api';
import { toast } from 'sonner';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [menteeStats, setMenteeStats] = useState({ sessions: 0, goals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    if (user.role === 'mentee') fetchMenteeStats();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/analytics/leaderboard');
      setLeaderboard(res.data);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenteeStats = async () => {
    try {
      const [sessionsRes, goalsRes] = await Promise.all([
        api.get(`/sessions/user/${user.user_id}`),
        api.get(`/goals/user/${user.user_id}`)
      ]);
      setMenteeStats({
        sessions: sessionsRes.data.filter(s => s.status === 'completed').length,
        goals: goalsRes.data.filter(g => g.status === 'completed').length
      });
    } catch (err) {
      console.error("Error fetching mentee stats:", err);
    }
  };

  // For mentors: find their rank in leaderboard. For mentees: not applicable.
  const currentUserStats = user.role === 'mentor'
    ? leaderboard.find(m => m.id === user.user_id) || { rank: '-', points: 0, badges: 0 }
    : null;

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading leaderboard...</div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Leaderboard & Achievements</h2>
        <p className="text-muted-foreground">Compete, earn badges, and climb the ranks</p>
      </div>

      {/* User Stats — role-aware */}
      <div className="grid md:grid-cols-3 gap-6">
        {user.role === 'mentor' ? (
          <>
            <Card>
              <CardContent className="p-6 text-center">
                <Trophy className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-3xl font-display font-bold">{currentUserStats?.rank ?? '-'}</p>
                <p className="text-sm text-muted-foreground">Your Rank</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Award className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-3xl font-display font-bold">{currentUserStats?.points ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Medal className="w-12 h-12 text-secondary mx-auto mb-3" />
                <p className="text-3xl font-display font-bold">{currentUserStats?.badges ?? 0}</p>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6 text-center">
                <BookOpen className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-3xl font-display font-bold">{menteeStats.sessions}</p>
                <p className="text-sm text-muted-foreground">Sessions Attended</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-3xl font-display font-bold">{menteeStats.goals}</p>
                <p className="text-sm text-muted-foreground">Goals Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Medal className="w-12 h-12 text-secondary mx-auto mb-3" />
                <p className="text-3xl font-display font-bold">Learning</p>
                <p className="text-sm text-muted-foreground">Mode Active</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Badges Section — only for mentors */}
      {user.role === 'mentor' && (
        <Card>
          <CardHeader>
            <CardTitle>Badges &amp; Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {BADGE_TYPES.map((badge, idx) => {
                const earned = (currentUserStats?.points ?? 0) >= (idx + 1) * 500;
                return (
                  <div
                    key={badge.id}
                    className={`p-4 border-2 rounded-lg text-center transition-smooth ${earned ? 'border-primary bg-primary/5' : 'border-border opacity-50'
                      }`}
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <p className="font-semibold text-sm mb-1">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                    <Badge variant={earned ? 'default' : 'secondary'} className="text-xs">
                      {(idx + 1) * 500} pts
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Mentors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((mentor, idx) => (
              <div
                key={mentor.id}
                className={`p-4 border-2 rounded-lg transition-smooth ${mentor.id === user.user_id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                  }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-display font-bold text-lg ${idx === 0
                      ? 'bg-gradient-to-br from-accent to-accent/70 text-accent-foreground'
                      : idx === 1
                        ? 'bg-muted text-foreground'
                        : idx === 2
                          ? 'bg-muted/70 text-muted-foreground'
                          : 'bg-muted/50 text-muted-foreground'
                      }`}
                  >
                    {idx < 3 ? <Trophy className="w-6 h-6" /> : idx + 1}
                  </div>

                  {/* Avatar & Info */}
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`} />
                    <AvatarFallback>{mentor.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold truncate">{mentor.name}</p>
                      {mentor.id === user.user_id && <Badge>You</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{mentor.department || 'General'}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-primary">{mentor.points}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-lg font-semibold">{mentor.badges}</p>
                    <p className="text-xs text-muted-foreground">badges</p>
                  </div>
                </div>

                {/* Progress (visual flair for top 3) */}
                {idx < 3 && (
                  <div className="mt-3">
                    <Progress value={Math.min(100, (mentor.points / (leaderboard[0].points || 1)) * 100)} className="h-1" />
                  </div>
                )}
              </div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Be the first mentor to join the leaderboard!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;