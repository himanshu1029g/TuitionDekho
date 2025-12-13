import React, { useEffect, useState } from "react";
import { createMeeting } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, MessageSquare, Star, Calendar, BookOpen, MapPin, Clock, Settings, Bell, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import Header from '@/components/Header'; // Make sure Header is imported

const TeacherDashboard = () => {
  const { user, login } = useUser(); // added login so we can update user in context after profile save
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [proposedTime, setProposedTime] = useState('');

  // Dynamic data
  const [meetingRequests, setMeetingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalStudents: 0, activeRequests: 0, completedSessions: 0, rating: 0 });
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [modeState, setModeState] = useState<string>('both');
  const [activeTab, setActiveTab] = useState<string>('requests');

  // local userId (cast to any to satisfy TS if context not typed)
  const userId = (user as any)?._id;
  const navigate = (window as any).navigate || ((path:string) => { window.location.href = path; }); // fallback nav

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { getTeacherRequests, getTeacherProfileByUserId } = await import('@/lib/api');

        const [requests, profileObj] = await Promise.all([
            getTeacherRequests(),
            getTeacherProfileByUserId(userId)
        ]);

        if (!mounted) return;

        setMeetingRequests(requests || []);
        setProfile(profileObj || null);
        if (profileObj?.mode) setModeState(profileObj.mode);

        const totalStudents = new Set((requests || []).map((r: any) => r.studentId?._id || r.studentId)).size;
        const activeRequests = (requests || []).filter((r: any) => r.status === 'pending').length;
        const completedSessions = (requests || []).filter((r: any) => r.status === 'completed').length;
        setStats({ totalStudents, activeRequests, completedSessions, rating: profileObj?.rating || 0 });
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          if (mounted) {
            setProfile(null);
            setMeetingRequests([]);
          }
        } else {
          console.error('fetchData', err);
          if (mounted) setError(err?.response?.data?.message || err?.message || 'Failed to load');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, [userId]);

  const handleResponse = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const { respondToRequest } = await import('@/lib/api');
      const payload: any = { status: action === 'accept' ? 'accepted' : 'declined', response: responseMessage.trim() || '' };
      if (action === 'accept' && proposedTime) {
        const dt = new Date(proposedTime);
        payload.scheduledDate = dt.toISOString();
        payload.scheduledTime = dt.toLocaleTimeString();
      }
      const res = await respondToRequest(requestId, payload);
      toast.success(res.message || `Request ${payload.status} successfully`);
      setMeetingRequests((prev) => prev.map((r: any) => r._id === requestId ? { ...r, status: payload.status, teacherResponse: responseMessage, scheduledDate: payload.scheduledDate } : r));
      setSelectedRequest(null);
      setResponseMessage('');
      setProposedTime('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to respond');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined':
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Save profile handler (used when editing)
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;
    setProfileLoading(true);
    try {
      const { updateTeacherProfile } = await import('@/lib/api');

      const payload = {
        subjects: profile.subjects || '',
        classes: profile.classes || '',
        experience: profile.experience || '',
        qualifications: profile.qualifications || '',
        location: profile.location || { city: '' },
        mode: modeState || 'both',
        bio: profile.bio || ''
      };

      const res = await updateTeacherProfile(payload);
      const updated = res?.profile || res;
      setProfile(updated);
      if (updated?.mode) setModeState(updated.mode);
      setEditing(false);

      // ********** Persist updated profile in user context/localStorage so it survives logout/login **********
      try {
        // get current token if present
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('tuitionDekho_user') || 'null') : null;
        // Merge teacher profile into stored user object under `teacherProfile`
        if (currentUser) {
          const merged = { ...(currentUser || {}), teacherProfile: updated };
          localStorage.setItem('tuitionDekho_user', JSON.stringify(merged));
          // Update context user too (login accepts optional token)
          if (login) login(merged, token || undefined);
        }
      } catch (innerErr) {
        console.warn('Failed to persist profile into localStorage/context', innerErr);
      }

      toast.success(res?.message || 'Profile saved');
    } catch (err: any) {
      console.error('Profile save error', err);
      toast.error(err?.message || 'Failed to save profile');
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  // ----------------- CHAT HELPERS -----------------
  const makeRoomId = (a: string, b: string) => (a < b ? `chat_${a}_${b}` : `chat_${b}_${a}`);

  const openChatWithStudent = (studentUserId: string) => {
    if (!user) return toast.error('Please login');
    const roomId = makeRoomId(user.id || (user as any)._id, studentUserId);
    navigate(`/chat/${encodeURIComponent(roomId)}`);
  };
  // ------------------------------------------------

  const startMeeting = async () => {
    const res = await createMeeting();
    if (res.success) {
      window.location.href = res.meetingUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || (profile?.userId?.name ?? 'Teacher')}!
          </h1>
          <p className="text-gray-600">
            Manage your teaching schedule and connect with students
          </p>
        </div>

        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="chat"><MessageSquare className="inline-block mr-2" /> Chat</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Users className="mr-2 h-6 w-6" />
                Student Requests
              </h2>
              <div className="space-y-4">
                {meetingRequests.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500 text-lg">No requests yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  meetingRequests.map((r:any) => (
                    <Card key={r._id}>
                      <CardContent className="p-6 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{r.studentId?.name || r.studentId}</h3>
                          <p className="text-sm">{r.subject} — {r.class}</p>
                          <div className={`inline-block mt-2 px-2 py-1 rounded ${getStatusColor(r.status)}`}>{r.status}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.status === 'accepted' && <Button onClick={() => openChatWithStudent(r.studentId?._id || r.studentId)}>Chat</Button>}
                          {r.status !== 'accepted' && <Button onClick={() => setSelectedRequest(r)}>Respond</Button>}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <MessageSquare className="mr-2 h-6 w-6" />
                Chats
              </h2>

              <div className="space-y-4">
                {meetingRequests.filter((m:any)=>m.status === 'accepted').length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-500 text-lg">No chats yet</p>
                      <p className="text-gray-400">Once you accept a student's request you can chat with them in real time.</p>
                    </CardContent>
                  </Card>
                ) : (
                  meetingRequests.filter((m:any)=>m.status === 'accepted').map((r:any) => (
                    <Card key={r._id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{r.studentId?.name || r.studentId}</div>
                          <div className="text-sm text-gray-500">{r.subject}</div>
                        </div>
                        <div>
                          <Button onClick={() => openChatWithStudent(r.studentId?._id || r.studentId)}>Open Chat</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center"><Calendar className="mr-2" /> Upcoming Classes</h2>
              <div className="space-y-4">
                {upcomingClasses.map((c) => (
                  <Card key={c._id}><CardContent>{/* keep existing schedule UI */}</CardContent></Card>
                ))}
                {upcomingClasses.length === 0 && <Card><CardContent className="py-8 text-center">No upcoming classes</CardContent></Card>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6"><Settings className="inline-block mr-2" /> Your Profile</h2>

              <Card>
                <CardContent>
                  <form onSubmit={handleSaveProfile}>
                    <div>
                      <Label>Subjects</Label>
                      <Input value={profile?.subjects || ''} onChange={(e)=>setProfile({...profile, subjects: e.target.value})} disabled={!editing} />
                    </div>

                    <div className="mt-4">
                      <Label>Experience</Label>
                      <Input value={profile?.experience || ''} onChange={(e)=>setProfile({...profile, experience: e.target.value})} disabled={!editing} />
                    </div>

                    <div className="mt-4">
                      <Label>Mode</Label>
                      <div className="flex gap-2 mt-2">
                        <Button variant={modeState === 'online' ? 'default' : 'outline'} onClick={()=>setModeState('online')}>Online</Button>
                        <Button variant={modeState === 'offline' ? 'default' : 'outline'} onClick={()=>setModeState('offline')}>Offline</Button>
                        <Button variant={modeState === 'both' ? 'default' : 'outline'} onClick={()=>setModeState('both')}>Both</Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label>Bio</Label>
                      <Textarea value={profile?.bio || ''} onChange={(e)=>setProfile({...profile, bio: e.target.value})} disabled={!editing} />
                    </div>

                    <div className="mt-4 flex gap-2">
                      {!editing && <Button type="button" onClick={() => setEditing(true)}>Edit</Button>}
                      {editing && <Button type="submit" className="bg-blue-600">Save Changes</Button>}
                      {editing && <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default TeacherDashboard;
