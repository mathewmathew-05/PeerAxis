import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Search, Filter, Star, Clock, CheckCircle, Calendar } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";
import { DEPARTMENTS } from "../types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const FindMentorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track mentor status: { mentor_id: { type: 'pending'|'active_session'|'can_request', sessionId?: string } }
  const [mentorStatus, setMentorStatus] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  /* FETCH MATCHED MENTORS */
  useEffect(() => {
    if (!user) return;

    const fetchMatches = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/matching/mentors/${user.user_id}`
        );
        const data = await res.json();
        setMentors(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user]);

  /* FETCH REQUEST & SESSION STATUS - This is the key fix! */
  useEffect(() => {
    if (!user) return;
    fetchMentorStatuses();
  }, [user]);

  const fetchMentorStatuses = async () => {
    try {
      // Fetch requests
      const requestsRes = await fetch(
        `http://localhost:5000/api/requests/user/${user.user_id}`
      );
      const requestsData = await requestsRes.json();

      // Fetch sessions
      const sessionsRes = await fetch(
        `http://localhost:5000/api/sessions/user/${user.user_id}`
      );
      const sessionsData = await sessionsRes.json();

      console.log('📋 Requests:', requestsData.sent);
      console.log('📅 Sessions:', sessionsData);

      // Build status map
      const statusMap = {};

      requestsData.sent?.forEach(request => {
        const mentorId = request.mentor_id;

        if (request.status === 'pending') {
          // Pending request
          statusMap[mentorId] = { type: 'pending' };
        } 
        else if (request.status === 'accepted') {
          // Check if there's an ACTIVE (scheduled) session with this mentor
          const activeSession = sessionsData.find(
            s => s.mentor_id === mentorId && s.status === 'scheduled'
          );

          if (activeSession) {
            // Has active session - show "View Session"
            statusMap[mentorId] = { 
              type: 'active_session', 
              sessionId: activeSession.session_id 
            };
          } else {
            // Request accepted BUT no active session (cancelled/completed)
            // Allow new request
            statusMap[mentorId] = { type: 'can_request' };
          }
        }
        // If declined or any other status, allow new request (no entry in map)
      });

      console.log('🗺️ Mentor Status Map:', statusMap);
      setMentorStatus(statusMap);
    } catch (err) {
      console.error("Error fetching mentor statuses:", err);
    }
  };

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('🔄 Page visible - refreshing statuses');
        fetchMentorStatuses();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      if (!user) return;
      fetch(`http://localhost:5000/api/matching/mentors/${user.user_id}`)
        .then(res => res.json())
        .then(data => setMentors(data));
    };

    window.addEventListener("storage", handleProfileUpdate);
    return () => window.removeEventListener("storage", handleProfileUpdate);
  }, [user]);

  /* FILTERING */
  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.skills?.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesDepartment =
      selectedDepartment === "all" ||
      mentor.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  /* SEND REQUEST */
  const handleRequestMentoring = async () => {
    if (!selectedMentor) return;

    setIsSending(true);

    try {
      const res = await fetch("http://localhost:5000/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentee_id: user.user_id,
          mentor_id: selectedMentor.mentor_id,
          message: requestMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send request");
      }

      toast.success("Request sent!", {
        description: `Your mentoring request has been sent to ${selectedMentor.name}`,
      });

      // Update status immediately
      setMentorStatus(prev => ({
        ...prev,
        [selectedMentor.mentor_id]: { type: 'pending' }
      }));

      setIsDialogOpen(false);
      setSelectedMentor(null);
      setRequestMessage("");
    } catch (err) {
      toast.error("Failed to send request", {
        description: err.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const openRequestDialog = (mentor) => {
    setSelectedMentor(mentor);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Mentors Matched for You</h2>
        <p className="text-muted-foreground">
          Automatically recommended based on your learning goals
        </p>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-muted-foreground">
          Finding the best mentors for you...
        </p>
      )}

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Refine matched mentors (optional)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-full sm:w-64">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* RESULTS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor) => {
          const status = mentorStatus[mentor.mentor_id];
          
          // Determine button type
          const isPending = status?.type === 'pending';
          const hasActiveSession = status?.type === 'active_session';
          const canRequest = !status || status?.type === 'can_request';

          return (
            <Card key={mentor.mentor_id} className="hover:shadow-lg transition-smooth">
              <CardContent className="p-6">
                <div className="flex gap-4 mb-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={mentor.avatar} />
                    <AvatarFallback>
                      {mentor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{mentor.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {mentor.department}
                    </p>
                    {mentor.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium">
                          {Number(mentor.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Badge className="mb-2">
                  Match Score: {mentor.score}
                </Badge>

                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {mentor.bio || "Experienced mentor ready to help you learn and grow."}
                </p>

                {/* MATCHED SKILLS */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {mentor.matchedSkills?.slice(0,3).map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* SMART BUTTON - 3 states */}
                {hasActiveSession ? (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate(`/sessions/${status.sessionId}`)}
                  >
                    <Calendar className="mr-2 w-4 h-4" />
                    View Scheduled Session
                  </Button>
                ) : isPending ? (
                  <Button className="w-full" variant="outline" disabled>
                    <Clock className="mr-2 w-4 h-4" />
                    Request Pending
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => openRequestDialog(mentor)}
                  >
                    Request Mentoring
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {!loading && filteredMentors.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          No mentors matched your current learning goals.
        </p>
      )}

      {/* REQUEST DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Mentoring</DialogTitle>
            <DialogDescription>
              Send a mentoring request to {selectedMentor?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedMentor && (
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedMentor.avatar} />
                  <AvatarFallback>
                    {selectedMentor.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedMentor.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedMentor.department}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="Introduce yourself and explain what you'd like to learn..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setRequestMessage("");
              }}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestMentoring} disabled={isSending}>
              {isSending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindMentorPage;