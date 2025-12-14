// UPDATED TeacherDashboard.tsx
// - Schedule tab removed
// - Profile tab fixed (view + edit existing profile cleanly)
// - Safe first-time profile creation

import React, { useEffect, useState } from "react";
import Header from '@/components/Header';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { createMeeting } from '@/lib/api';
import {
  Users,
  MessageSquare,
  Settings
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const TeacherDashboard = () => {
  const { user, login } = useUser();
  const userId = (user as any)?._id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [meetingRequests, setMeetingRequests] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const [editing, setEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [modeState, setModeState] = useState<'online' | 'offline' | 'both'>('both');

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [proposedTime, setProposedTime] = useState('');

  const navigate = (path: string) => window.location.href = path;

  // ================= FETCH DATA =================
  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        setLoading(true);
        const api = await import('@/lib/api');

        const [reqs, prof] = await Promise.all([
          api.getTeacherRequests(),
          api.getTeacherProfileByUserId(userId)
        ]);

        setMeetingRequests(reqs || []);
        setProfile(prof || null);
        if (prof?.mode) setModeState(prof.mode);

      } catch (err: any) {
        if (err?.response?.status !== 404) {
          console.error(err);
          setError('Failed to load dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  // ================= REQUEST RESPONSE =================
  const handleResponse = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const api = await import('@/lib/api');
      const payload: any = {
        status: action === 'accept' ? 'accepted' : 'declined',
        response: responseMessage
      };

      if (action === 'accept' && proposedTime) {
        const dt = new Date(proposedTime);
        payload.scheduledDate = dt.toISOString();
      }

      await api.respondToRequest(requestId, payload);

      toast.success('Response saved');
      setMeetingRequests(prev => prev.map(r => r._id === requestId ? { ...r, status: payload.status } : r));
      setSelectedRequest(null);
      setResponseMessage('');
      setProposedTime('');
    } catch {
      toast.error('Failed to respond');
    }
  };

  // ================= SAVE PROFILE =================
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;

    setProfileLoading(true);

    try {
      const { updateTeacherProfile } = await import('@/lib/api');

      // ✅ THIS IS THE PAYLOAD (YOU ASKED WHERE → IT IS HERE)
    const payload = {
  subjects: profile.subjects,
  classes: profile.classes,
  achievements: profile.achievements || [],
  experience: profile.experience,
  qualifications: profile.qualifications,
  bio: profile.bio,
  mode: modeState,
  location: profile.location || { city: '', state: '' }
};

      const res = await updateTeacherProfile(payload);

      setProfile(res.profile || res);
      setEditing(false);

      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error('Profile save error', err);
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save profile'
      );
    } finally {
      setProfileLoading(false);
    }
  };


  // ================= CHAT =================
  const makeRoomId = (a: string, b: string) => a < b ? `chat_${a}_${b}` : `chat_${b}_${a}`;

  const openChat = (studentId: string) => {
    const roomId = makeRoomId(userId, studentId);
    navigate(`/chat/${roomId}`);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user?.name}</h1>

        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests"><Users className="mr-2 h-4 w-4" /> Requests</TabsTrigger>
            <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" /> Chat</TabsTrigger>
            <TabsTrigger value="profile"><Settings className="mr-2 h-4 w-4" /> Profile</TabsTrigger>
          </TabsList>

          {/* ================= REQUESTS ================= */}
          <TabsContent value="requests" className="space-y-4">
            {meetingRequests.length === 0 && (
              <Card><CardContent className="py-8 text-center">No requests yet</CardContent></Card>
            )}

            {meetingRequests.map((r) => (
              <Card key={r._id}>
                <CardContent className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{r.studentId?.name}</div>
                    <div className="text-sm text-gray-500">{r.subject}</div>
                  </div>
                  <div className="flex gap-2">
                    {r.status === 'accepted'
                      ? <Button onClick={() => openChat(r.studentId?._id)}>Chat</Button>
                      : <Button onClick={() => setSelectedRequest(r)}>Respond</Button>
                    }
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ================= CHAT ================= */}
          <TabsContent value="chat">
            {meetingRequests.filter(r => r.status === 'accepted').length === 0 && (
              <Card><CardContent className="py-8 text-center">No chats yet</CardContent></Card>
            )}

            {meetingRequests.filter(r => r.status === 'accepted').map(r => (
              <Card key={r._id}>
                <CardContent className="flex justify-between">
                  <div>{r.studentId?.name}</div>
                  <Button onClick={() => openChat(r.studentId?._id)}>Open</Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ================= PROFILE ================= */}
          <TabsContent value="profile">
            <Card>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">

                  <div>
                    <Label>Subjects</Label>
                    <Input disabled={!editing} value={profile?.subjects || ''} onChange={e => setProfile({ ...profile, subjects: e.target.value })} />
                  </div>

                  <div>
                    <Label>Classes</Label>
                    <Input disabled={!editing} value={profile?.classes || ''} onChange={e => setProfile({ ...profile, classes: e.target.value })} />
                  </div>

                  <div>
                    <Label>Experience</Label>
                    <Input disabled={!editing} value={profile?.experience || ''} onChange={e => setProfile({ ...profile, experience: e.target.value })} />
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea disabled={!editing} value={profile?.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
                  </div>
                  {/* now add  */}
                  <div className="mt-4">
                    <Label>Achievements (comma separated)</Label>
                    <Input
                      value={profile?.achievements?.join(',') || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          achievements: e.target.value.split(',').map((a) => a.trim())
                        })
                      }
                      disabled={!editing}
                    />
                  </div>

                  <div className="mt-4">
                    <Label>City</Label>
                    <Input
                      value={profile?.location?.city || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          location: { ...profile.location, city: e.target.value }
                        })
                      }
                      disabled={!editing}
                    />
                  </div>

                  <div className="mt-4">
                    <Label>State</Label>
                    <Input
                      value={profile?.location?.state || ''}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          location: { ...profile.location, state: e.target.value }
                        })
                      }
                      disabled={!editing}
                    />
                  </div>

                  <div>
                    <Label>Mode</Label>
                    <div className="flex gap-2 mt-2">
                      {['online', 'offline', 'both'].map(m => (
                        <Button key={m} type="button" variant={modeState === m ? 'default' : 'outline'} onClick={() => setModeState(m as any)}>{m}</Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {!editing && <Button type="button" onClick={() => setEditing(true)}>Edit</Button>}
                    {editing && <Button type="submit" disabled={profileLoading}>Save</Button>}
                    {editing && <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}
                  </div>

                </form>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* ================= RESPOND DIALOG ================= */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to request</DialogTitle>
          </DialogHeader>

          <Textarea placeholder="Message" value={responseMessage} onChange={e => setResponseMessage(e.target.value)} />
          <Input type="datetime-local" value={proposedTime} onChange={e => setProposedTime(e.target.value)} />

          <div className="flex gap-2">
            <Button onClick={() => handleResponse(selectedRequest._id, 'accept')}>Accept</Button>
            <Button variant="outline" onClick={() => handleResponse(selectedRequest._id, 'decline')}>Decline</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TeacherDashboard;
