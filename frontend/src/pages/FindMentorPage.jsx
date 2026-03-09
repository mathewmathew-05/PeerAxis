import { useEffect, useState } from "react";
import api from "../lib/api";
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
        const res = await api.get(`/matching/mentors/${user.user_id}`);
        setMentors(res.data);
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
      const requestsRes = await api.get(`/requests/user/${user.user_id}`);
      const requestsData = requestsRes.data;

      // Fetch sessions
      const sessionsRes = await api.get(`/sessions/user/${user.user_id}`);
      const sessionsData = sessionsRes.data;

      console.log('📋 Raw Requests Response:', requestsData);
      console.log('📅 Raw Sessions Response:', sessionsData);

      // 🔥 FIX: Handle different API response formats
      let sentRequests = [];
      if (Array.isArray(requestsData)) {
        // If API returns array directly: [{ request_id, ... }, ...]
        sentRequests = requestsData;
      } else if (requestsData && requestsData.sent && Array.isArray(requestsData.sent)) {
        // If API returns object: { sent: [...], received: [...] }
        sentRequests = requestsData.sent;
      } else if (requestsData && requestsData.requests && Array.isArray(requestsData.requests)) {
        // If API returns object: { requests: [...] }
        sentRequests = requestsData.requests;
      }

      let sessions = [];
      if (Array.isArray(sessionsData)) {
        // If API returns array directly
        sessions = sessionsData;
      } else if (sessionsData && sessionsData.sessions && Array.isArray(sessionsData.sessions)) {
        // If API returns object: { sessions: [...] }
        sessions = sessionsData.sessions;
      }

      console.log('📋 Parsed Sent Requests:', sentRequests);
      console.log('📅 Parsed Sessions:', sessions);

      // Build status map
      const statusMap = {};

      // Safely iterate with forEach
      if (sentRequests && sentRequests.length > 0) {
        sentRequests.forEach(request => {
          const mentorId = String(request.mentor_id);
          const status = request.status?.toLowerCase();

          console.log(`📝 Processing request for mentor ${mentorId}:`, {
            request_id: request.request_id,
            status: status,
            mentor_id: mentorId
          });

          // CRITICAL FIX: Don't overwrite 'pending' status with anything else!
          // If this mentor already has 'pending' status, skip this request
          if (statusMap[mentorId]?.type === 'pending') {
            console.log(`⏭️ Skipping - already marked as PENDING`);
            return;
          }

          if (status === 'pending') {
            console.log(`⏳ Setting ${mentorId} to PENDING`);
            statusMap[mentorId] = { type: 'pending', requestId: request.request_id };
          }
          else if (status === 'accepted') {
            // Also don't overwrite active_session
            if (statusMap[mentorId]?.type === 'active_session') {
              console.log(`⏭️ Skipping - already marked as ACTIVE_SESSION`);
              return;
            }

            const activeSession = sessions.find(
              s => String(s.mentor_id) === mentorId && s.status?.toLowerCase() === 'scheduled'
            );

            if (activeSession) {
              console.log(`📅 Setting ${mentorId} to ACTIVE_SESSION`);
              statusMap[mentorId] = {
                type: 'active_session',
                sessionId: activeSession.session_id,
                requestId: request.request_id
              };
            } else {
              console.log(`✅ Setting ${mentorId} to CAN_REQUEST (accepted but no scheduled session)`);
              statusMap[mentorId] = { type: 'can_request' };
            }
          } else {
            console.log(`❓ Request status "${status}" - not tracked in statusMap`);
          }
        });

      }

      console.log('🗺️ Mentor Status Map:', statusMap);
      setMentorStatus(statusMap);
    } catch (err) {
      console.error("Error fetching mentor statuses:", err);
      // Set empty object so UI doesn't crash
      setMentorStatus({});
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
      api.get(`/matching/mentors/${user.user_id}`)
        .then(res => setMentors(res.data));
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
      // CRITICAL: Do a fresh server-side check RIGHT before sending
      console.log('🔄 Doing pre-flight check...');
      const preflightRes = await api.get(`/requests/user/${user.user_id}`);
      const preflightData = preflightRes.data;

      let currentSentRequests = [];
      if (Array.isArray(preflightData)) {
        currentSentRequests = preflightData;
      } else if (preflightData.sent) {
        currentSentRequests = preflightData.sent;
      }

      // Check if there's already a pending request for this mentor
      const existingPending = currentSentRequests.find(
        r => String(r.mentor_id) === String(selectedMentor.mentor_id) &&
          r.status?.toLowerCase() === 'pending'
      );

      if (existingPending) {
        console.log('⚠️ Pre-flight check found existing pending request:', existingPending);
        toast.error("Request already exists", {
          description: "You already have a pending request with this mentor"
        });
        setIsDialogOpen(false);
        fetchMentorStatuses(); // Refresh to update UI
        return;
      }

      // Also check for active sessions
      const sessionsRes = await api.get(`/sessions/user/${user.user_id}`);
      const sessionsData = sessionsRes.data;

      let currentSessions = [];
      if (Array.isArray(sessionsData)) {
        currentSessions = sessionsData;
      }

      const activeSession = currentSessions.find(
        s => String(s.mentor_id) === String(selectedMentor.mentor_id) &&
          s.status?.toLowerCase() === 'scheduled'
      );

      if (activeSession) {
        console.log('⚠️ Pre-flight check found active session:', activeSession);
        toast.error("Active session exists", {
          description: "You already have a scheduled session with this mentor"
        });
        setIsDialogOpen(false);
        navigate(`/sessions/${activeSession.session_id}`);
        return;
      }

      console.log('✅ Pre-flight check passed - no conflicts found');
      console.log('📤 Sending request:', {
        mentee_id: user.user_id,
        mentor_id: selectedMentor.mentor_id,
        message: requestMessage,
      });

      const res = await api.post("/requests", {
        mentee_id: user.user_id,
        mentor_id: selectedMentor.mentor_id,
        message: requestMessage,
      });

      const data = res.data;
      console.log('📥 Response:', { status: res.status, data });

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

      // Refresh from server
      fetchMentorStatuses();
    } catch (err) {
      console.error('❌ Request failed:', err);
      toast.error("Failed to send request", {
        description: err.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const openRequestDialog = (mentor) => {
    // Double-check status before opening dialog
    const status = mentorStatus[mentor.mentor_id];

    if (status?.type === 'pending') {
      toast.error("Request already pending", {
        description: "You already have a pending request with this mentor"
      });
      return;
    }

    if (status?.type === 'active_session') {
      toast.error("Active session exists", {
        description: "You already have a scheduled session with this mentor"
      });
      navigate(`/sessions/${status.sessionId}`);
      return;
    }

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

          // DEBUG: Log the status for each mentor
          console.log(`🎯 Mentor ${mentor.name} (${mentor.mentor_id}):`, {
            status,
            allStatuses: mentorStatus
          });

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
                  {mentor.matchedSkills?.slice(0, 3).map((skill) => (
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