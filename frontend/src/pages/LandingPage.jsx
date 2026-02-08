import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Target, Calendar, Trophy, MessageSquare, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const LandingPage = () => {
  const features = [
    {
      icon: Users,
      title: 'Smart Matching',
      description: 'AI-powered algorithm matches you with the perfect mentor based on skills, interests, and availability.'
    },
    {
      icon: Calendar,
      title: 'Easy Scheduling',
      description: 'Seamlessly schedule and manage mentoring sessions with built-in calendar and reminders.'
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Set SMART goals, track progress with milestones, and celebrate achievements together.'
    },
    {
      icon: MessageSquare,
      title: 'In-App Messaging',
      description: 'Stay connected with mentors and mentees through real-time messaging and notifications.'
    },
    {
      icon: Trophy,
      title: 'Gamification',
      description: 'Earn badges, points, and climb the leaderboard as you help others grow and learn.'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Dashboard',
      description: 'Track your mentoring journey with comprehensive analytics and progress reports.'
    }
  ];

  const stats = [
    { value: '500+', label: 'Active Mentors' },
    { value: '1,200+', label: 'Students Mentored' },
    { value: '3,500+', label: 'Sessions Completed' },
    { value: '4.8/5', label: 'Average Rating' }
  ];

  const benefits = [
    'Connect with experienced seniors',
    'Personalized learning paths',
    'Career guidance & interview prep',
    'Project collaboration opportunities',
    'Build lasting professional relationships',
    'Access to exclusive resources'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold">PeerAxis</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-primary hover:bg-primary-dark">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Empower Your Academic Journey with
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"> Peer Mentoring</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect with experienced seniors, set goals, track progress, and achieve academic excellence together. Your success story starts here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-primary hover:bg-primary-dark text-base font-medium px-8 h-12">
                  Start Mentoring
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-base font-medium px-8 h-12">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat, index) => (
              <Card key={index} className="border-border bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-display font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools and features to make peer mentoring effective and engaging.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="h-full border-border hover:border-primary/50 transition-smooth hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
                Why Choose PeerAxis?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                We've designed PeerAxis to be more than just a mentoring platform. It's a complete ecosystem that fosters growth, builds connections, and celebrates achievements.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <Trophy className="w-24 h-24 text-primary mx-auto mb-6" />
                  <h3 className="text-2xl font-display font-bold mb-4">Join Our Community</h3>
                  <p className="text-muted-foreground mb-6">
                    Be part of a thriving community of learners and mentors
                  </p>
                  <Link to="/register">
                    <Button size="lg" className="bg-primary hover:bg-primary-dark">
                      Get Started Free
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students who are already benefiting from peer mentoring.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-base font-medium px-8 h-12">
                Sign Up Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base font-medium px-8 h-12">
                Already have an account?
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-semibold">PeerAxis</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PeerAxis. All rights reserved. B.Tech Mini Project
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;