import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMockData } from '../hooks/useMockData';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { BADGE_TYPES } from '../types';

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { leaderboard } = useMockData(user);

  const userRank = leaderboard.findIndex(m => m.id === user.id) + 1 || '-';
  const userPoints = 450;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Leaderboard & Achievements</h2>
        <p className="text-muted-foreground">Compete, earn badges, and climb the ranks</p>
      </div>

      {/* User Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 text-accent mx-auto mb-3" />
            <p className="text-3xl font-display font-bold">{userRank}</p>
            <p className="text-sm text-muted-foreground">Your Rank</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Award className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-3xl font-display font-bold">{userPoints}</p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Medal className="w-12 h-12 text-secondary mx-auto mb-3" />
            <p className="text-3xl font-display font-bold">3</p>
            <p className="text-sm text-muted-foreground">Badges Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {BADGE_TYPES.map((badge, idx) => {
              const earned = idx < 3;
              return (
                <div
                  key={badge.id}
                  className={`p-4 border-2 rounded-lg text-center transition-smooth ${
                    earned
                      ? 'border-primary bg-primary/5 hover:border-primary-dark'
                      : 'border-border opacity-50'
                  }`}
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-semibold text-sm mb-1">{badge.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>
                  <Badge variant={earned ? 'default' : 'secondary'} className="text-xs">
                    {badge.points} pts
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                className={`p-4 border-2 rounded-lg transition-smooth ${
                  mentor.id === user.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center font-display font-bold text-lg ${
                      idx === 0
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
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback>{mentor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-semibold truncate">{mentor.name}</p>
                      {mentor.id === user.id && <Badge>You</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{mentor.department}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-primary">{mentor.points}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">{mentor.badges}</p>
                    <p className="text-xs text-muted-foreground">badges</p>
                  </div>
                </div>

                {/* Progress to next rank (optional) */}
                {idx > 0 && mentor.id === user.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress to Rank {idx}</span>
                      <span className="font-medium">{Math.round((mentor.points / leaderboard[idx - 1].points) * 100)}%</span>
                    </div>
                    <Progress value={(mentor.points / leaderboard[idx - 1].points) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {leaderboard[idx - 1].points - mentor.points} points to next rank
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;