import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import { BookOpen, Users, Search, Plus, Filter } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const SkillExchangePage = () => {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    exchange_type: 'teach',
    description: ''
  });

  useEffect(() => {
    fetchSkills();
  }, [activeTab]);

  const fetchSkills = async () => {
    try {
      const res = await api.get(`/skills?type=${activeTab}`);
      setSkills(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load skills");
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCreateExchange = async () => {
    if (!newSkill.skill_name || !newSkill.description) {
      toast.error("Please fill all fields");
      return;
    }
    try {
      await api.post('/skills', { ...newSkill, user_id: user.user_id });
      toast.success("Skill exchange posted!");
      setIsDialogOpen(false);
      setNewSkill({ skill_name: '', exchange_type: 'teach', description: '' });
      fetchSkills();
    } catch (err) {
      toast.error("Failed to post skill exchange");
    }
  };

  const filteredSkills = skills.filter(skill =>
    skill.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold mb-2">Skill Exchange</h2>
          <p className="text-muted-foreground">Teach what you know, learn what you don't</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Post Exchange
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Post a Skill Exchange</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>I want to...</Label>
                <div className="flex gap-4">
                  <Button
                    variant={newSkill.exchange_type === 'teach' ? 'default' : 'outline'}
                    onClick={() => setNewSkill({ ...newSkill, exchange_type: 'teach' })}
                    className="flex-1"
                  >
                    Teach
                  </Button>
                  <Button
                    variant={newSkill.exchange_type === 'learn' ? 'default' : 'outline'}
                    onClick={() => setNewSkill({ ...newSkill, exchange_type: 'learn' })}
                    className="flex-1"
                  >
                    Learn
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Skill Name</Label>
                <Input
                  placeholder="e.g. React Native, Public Speaking"
                  value={newSkill.skill_name}
                  onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what you can teach or what you want to learn..."
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateExchange} className="w-full">Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills..."
                className="pl-10"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'all' ? 'default' : 'outline'}
                onClick={() => setActiveTab('all')}
              >
                All
              </Button>
              <Button
                variant={activeTab === 'teach' ? 'default' : 'outline'}
                onClick={() => setActiveTab('teach')}
              >
                Teaching
              </Button>
              <Button
                variant={activeTab === 'learn' ? 'default' : 'outline'}
                onClick={() => setActiveTab('learn')}
              >
                Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map(skill => (
          <Card key={skill.exchange_id} className="hover:border-primary transition-colors cursor-pointer">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <Badge variant={skill.exchange_type === 'teach' ? 'default' : 'secondary'}>
                  {skill.exchange_type === 'teach' ? 'Teaching' : 'Learning'}
                </Badge>
                <span className="text-xs text-muted-foreground">{new Date(skill.created_at).toLocaleDateString()}</span>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">{skill.skill_name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {skill.description}
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-border">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={skill.user_avatar} />
                  <AvatarFallback>{skill.user_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{skill.user_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{skill.user_role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredSkills.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No skill exchanges found. Be the first to post one!
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillExchangePage;