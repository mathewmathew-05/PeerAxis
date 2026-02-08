import React from 'react';
import { Lightbulb, BookOpen, Video, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

const RecommendationsPage = () => {
  const recommendations = [
    {
      id: 1,
      title: 'Complete Guide to Dynamic Programming',
      type: 'article',
      description: 'Master DP concepts from basics to advanced with 50+ solved problems',
      tags: ['DSA', 'Algorithms'],
      link: '#'
    },
    {
      id: 2,
      title: 'React Hooks Tutorial',
      type: 'video',
      description: 'Learn useState, useEffect, and custom hooks with practical examples',
      tags: ['Web Dev', 'React'],
      link: '#'
    },
    {
      id: 3,
      title: 'System Design Interview Preparation',
      type: 'course',
      description: 'Complete course on designing scalable systems for tech interviews',
      tags: ['System Design', 'Interviews'],
      link: '#'
    },
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'course': return <BookOpen className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-display font-bold mb-2">Personalized Recommendations</h2>
        <p className="text-muted-foreground">AI-powered learning resources based on your goals</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {recommendations.map(rec => (
          <Card key={rec.id} className="hover:border-primary transition-smooth">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {getIcon(rec.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                    <Badge variant="secondary" className="mt-1 capitalize">{rec.type}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{rec.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {rec.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
              <Button className="w-full" variant="outline">
                View Resource
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsPage;