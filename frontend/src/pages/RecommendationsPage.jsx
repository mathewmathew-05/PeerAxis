import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Lightbulb, Star, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { toast } from 'sonner';

const RecommendationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ keywords: [], mentors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get(`/analytics/recommendations/${user.user_id}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Personalized Recommendations</h2>
        <p className="text-muted-foreground">Mentors matched to your goals and learning interests</p>
      </div>

      {/* Keywords / Interest Tags */}
      {data.keywords.length > 0 && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-2 items-center">
            <Lightbulb className="w-4 h-4 text-primary mr-1" />
            <span className="text-sm text-muted-foreground mr-2">Based on:</span>
            {data.keywords.map(kw => (
              <Badge key={kw} variant="secondary" className="capitalize">{kw}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground animate-pulse">Finding your best matches...</p>
      ) : data.mentors.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No mentor matches found yet.</p>
            <p className="text-sm text-muted-foreground mb-6">
              Add goals or learning skills to your profile to get personalized recommendations.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/goals')}>Set Goals</Button>
              <Button onClick={() => navigate('/find-mentor')}>Browse All Mentors</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.mentors.map(mentor => (
            <Card key={mentor.user_id} className="hover:border-primary transition-smooth">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={mentor.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`} />
                    <AvatarFallback>{mentor.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{mentor.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{mentor.department || 'General'}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span className="text-sm font-medium">{mentor.rating ? Number(mentor.rating).toFixed(1) : 'New'}</span>
                </div>

                {/* Matched Skills */}
                {mentor.matchedSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.matchedSkills.slice(0, 4).map(skill => (
                      <Badge key={skill} className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">
                        ✓ {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* All skills */}
                {mentor.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(mentor.skills || [])
                      .filter(s => !mentor.matchedSkills?.includes(s))
                      .slice(0, 3)
                      .map(skill => (
                        <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                      ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => navigate('/find-mentor')}
                  >
                    Request Mentoring
                    <ArrowRight className="ml-1 w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/messages?userId=${mentor.user_id}`)}
                  >
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;