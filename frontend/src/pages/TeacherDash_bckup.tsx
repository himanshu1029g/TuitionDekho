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
const { user } = useUser();
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
// Add controlled state for Select mode
const [modeState, setModeState] = useState<string>('both');

// local userId (cast to any to satisfy TS if context not typed)
const userId = (user as any)?._id;

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

// getTeacherRequests returns array now
setMeetingRequests(requests || []);
setProfile(profileObj || null);
if (profileObj?.mode) setModeState(profileObj.mode);

// compute stats from requests
const totalStudents = new Set((requests || []).map((r: any) => r.studentId?._id || r.studentId)).size;
const activeRequests = (requests || []).filter((r: any) => r.status === 'pending').length;
const completedSessions = (requests || []).filter((r: any) => r.status === 'completed').length;

setStats({ totalStudents, activeRequests, completedSessions, rating: profileObj?.rating || 0 });
} catch (err: any) {
console.error('fetchData', err);
if (mounted) setError(err?.message || 'Failed to load');
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
const payload: any = {
status: action === 'accept' ? 'accepted' : 'declined',
response: responseMessage.trim() || ''
};
if (action === 'accept' && proposedTime) {
const dt = new Date(proposedTime);
payload.scheduledDate = dt.toISOString();
payload.scheduledTime = dt.toLocaleTimeString();
}
const res = await respondToRequest(requestId, payload);
toast.success(res.message || `Request ${payload.status} successfully`);
// update local state
setMeetingRequests((prev) => prev.map((r: any) => r._id === requestId ? { ...r, status: payload.status, teacherResponse: responseMessage, scheduledDate: payload.scheduledDate } : r));
setSelectedRequest(null);
setResponseMessage('');
setProposedTime('');
} catch (e: any) {
toast.error(e?.message || 'Failed to respond');
}
}; const getStatusColor = (status: string) => {
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

{/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
<Card>
<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<CardTitle className="text-sm font-medium">Total Students</CardTitle>
<Users className="h-4 w-4 text-muted-foreground" />
</CardHeader>
<CardContent>
<div className="text-2xl font-bold">{stats.totalStudents}</div>
<p className="text-xs text-muted-foreground">Active learners</p>
</CardContent>
</Card>

<Card>
<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<CardTitle className="text-sm font-medium">Active Requests</CardTitle>
<MessageSquare className="h-4 w-4 text-muted-foreground" />
</CardHeader>
<CardContent>
<div className="text-2xl font-bold">{stats.activeRequests}</div>
<p className="text-xs text-muted-foreground">Pending responses</p>
</CardContent>
</Card>

<Card>
<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
<TrendingUp className="h-4 w-4 text-muted-foreground" />
</CardHeader>
<CardContent>
<div className="text-2xl font-bold">{stats.completedSessions}</div>
<p className="text-xs text-muted-foreground">Total teaching hours</p>
</CardContent>
</Card>

<Card>
<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
<CardTitle className="text-sm font-medium">Rating</CardTitle>
<Star className="h-4 w-4 text-muted-foreground" />
</CardHeader>
<CardContent>
<div className="text-2xl font-bold flex items-center">
{stats.rating}
<Star className="h-5 w-5 fill-yellow-400 text-yellow-400 ml-1" />
</div>
<p className="text-xs text-muted-foreground">Average rating</p>
</CardContent>
</Card>
</div>

<Tabs defaultValue="requests" className="space-y-6">
<TabsList className="grid w-full grid-cols-3">
<TabsTrigger value="requests">Meeting Requests</TabsTrigger>
<TabsTrigger value="schedule">Schedule</TabsTrigger>
<TabsTrigger value="profile">Profile</TabsTrigger>
</TabsList>

<TabsContent value="requests" className="space-y-6">
<h2 className="text-lg font-semibold">Student Meeting Requests</h2>

{meetingRequests.length === 0 ? (
<div className="p-6 bg-white rounded border text-sm text-muted-foreground">No meeting requests yet.</div>
) : (
<div className="space-y-4">
{meetingRequests.map((r: any) => (
<Card key={r._id} className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
                <div className="flex items-start justify-between">
                        <div className="flex-1">
                                <h3 className="font-semibold text-lg">{r.studentId?.name || r.studentId}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{r.subject} • Class {r.class}</p>
                                <div className="bg-gray-50 p-3 rounded mt-3 text-sm">{r.message}</div>
                                <div className="mt-4 flex items-center justify-between">
                                        <Badge className={getStatusColor(r.status)}>{r.status}</Badge>
                                        {r.teacherResponse && (
                                                <span className="text-xs text-gray-500">Response: {r.teacherResponse}</span>
                                        )}
                                </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                                {r.status === 'pending' && (
                                        <>
                                                <Dialog>
                                                        <DialogTrigger asChild>
                                                                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => setSelectedRequest(r)}>
                                                                        Accept
                                                                </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                                <DialogHeader>
                                                                        <DialogTitle>Accept Meeting Request</DialogTitle>
                                                                                                                                                    <DialogDescription>Write an optional message to the student and optionally propose a date/time.</DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-4">
                                                                        <div>
                                                                                <Label>Your Response Message</Label>
                                                                                <Textarea
                                                                                        placeholder="Share any details about the meeting, your expectations, or how you'll help the student..."
                                                                                        value={responseMessage}
                                                                                        onChange={(e) => setResponseMessage(e.target.value)}
                                                                                        className="mt-2"
                                                                                />
                                                                        </div>
                                                                        <div>
                                                                                <Label>Proposed Meeting Date & Time (Optional)</Label>
                                                                                <Input
                                                                                        type="datetime-local"
                                                                                        value={proposedTime}
                                                                                        onChange={(e) => setProposedTime(e.target.value)}
                                                                                        className="mt-2"
                                                                                />
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                                <Button
                                                                                        className="bg-green-600 hover:bg-green-700"
                                                                                        onClick={() => handleResponse(selectedRequest?._id, 'accept')}
                                                                                >
                                                                                        Accept Request
                                                                                </Button>
                                                                                <Button variant="outline" onClick={() => { setSelectedRequest(null); setResponseMessage(''); setProposedTime(''); }}>
                                                                                        Cancel
                                                                                </Button>
                                                                        </div>
                                                                </div>
                                                        </DialogContent>
                                                </Dialog>

                                                <Dialog>
                                                        <DialogTrigger asChild>
                                                                <Button className="bg-red-600 hover:bg-red-700 text-white" size="sm" onClick={() => setSelectedRequest(r)}>
                                                                        Decline
                                                                </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                                <DialogHeader>
                                                                        <DialogTitle>Decline Meeting Request</DialogTitle>
                                                                                                                                                    <DialogDescription>Optionally explain why you are declining. This message will be sent to the student.</DialogDescription>
                                                                </DialogHeader>
                                                                <div className="space-y-4">
                                                                        <div>
                                                                                <Label>Reason (Optional)</Label>
                                                                                <Textarea
                                                                                        placeholder="Let the student know why you can't meet (schedule conflict, subject mismatch, etc.)..."
                                                                                        value={responseMessage}
                                                                                        onChange={(e) => setResponseMessage(e.target.value)}
                                                                                        className="mt-2"
                                                                                />
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                                <Button
                                                                                        className="bg-red-600 hover:bg-red-700"
                                                                                        onClick={() => handleResponse(selectedRequest?._id, 'decline')}
                                                                                >
                                                                                        Decline Request
                                                                                </Button>
                                                                                <Button variant="outline" onClick={() => { setSelectedRequest(null); setResponseMessage(''); }}>
                                                                                        Cancel
                                                                                </Button>
                                                                        </div>
                                                                </div>
                                                        </DialogContent>
                                                </Dialog>
                                        </>
                                )}
                                {r.status === 'accepted' && (
                                        <Button
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                                size="sm"
                                                onClick={() => {
                                                        if (r.meetingLink) window.open(r.meetingLink, '_blank');
                                                        else {
                                                                createMeeting().then(res => { if (res?.meetingUrl) window.open(res.meetingUrl, '_blank'); });
                                                        }
                                                }}
                                        >
                                                Start Video Call
                                        </Button>
                                )}
                                {(r.status === 'declined' || r.status === 'rejected') && (
                                        <Badge className="bg-red-100 text-red-800">Declined</Badge>
                                )}
                        </div>
                </div>
        </CardContent>
</Card>
))}
</div>
)}
</TabsContent>

<TabsContent value="schedule" className="space-y-6">
<div>
<h2 className="text-2xl font-semibold mb-6 flex items-center">
<Calendar className="mr-2 h-6 w-6" />
Upcoming Classes
</h2>

<div className="space-y-4">
{upcomingClasses.map((classItem) => (
<Card key={classItem._id}>
<CardContent className="p-6">
<div className="flex justify-between items-center">
<div>
<h3 className="font-semibold text-lg">{classItem.studentId?.name || 'Unknown'}</h3>
<p className="text-gray-600">{classItem.subject}</p>
<div className="flex items-center mt-2 text-sm text-gray-500">
<Clock className="mr-1 h-4 w-4" />
{classItem.scheduledDate ? new Date(classItem.scheduledDate).toLocaleString() : ''} • {classItem.scheduledTime || ''}
</div>
</div>
<div className="text-right">
<Badge variant={classItem.mode === 'online' ? 'default' : 'secondary'}>
{classItem.mode}
</Badge>
<div className="mt-2">
<Button size="sm" variant="outline" className="mr-2">
Reschedule
</Button>
<Button size="sm">
{classItem.mode === 'online' ? 'Join Call' : 'Mark Present'}
</Button>
</div>
</div>
</div>
</CardContent>
</Card>
))}
</div>
</div>
</TabsContent>

<TabsContent value="profile" className="space-y-6">
<Card>
<CardHeader>
<CardTitle className="flex items-center">
<Settings className="mr-2 h-5 w-5" />
Profile Settings
</CardTitle>
<CardDescription>
Manage your teaching profile and preferences
</CardDescription>
</CardHeader>
<CardContent className="space-y-6">

<form onSubmit={async (e) => {
e.preventDefault();
setProfileLoading(true);
try {
const form = e.currentTarget as HTMLFormElement;
const fd = new FormData(form);
// read fields safely (Select uses controlled mode)
const payload = {
subjects: (fd.get('subjects') as string) || '',
classes: (fd.get('classes') as string) || '',
experience: (fd.get('experience') as string) || '',
qualifications: (fd.get('qualifications') as string) || '',
location: {
city: (fd.get('city') as string) || '',
},
mode: modeState || (fd.get("mode") as string) || "both",
bio: (fd.get('bio') as string) || '',
achievements: ((fd.get('achievements') as string) || '').split('\n').filter((a: string) => a.trim())
};
const { updateTeacherProfile } = await import('@/lib/api');
const res = await updateTeacherProfile(payload);
if (res.profile) setProfile(res.profile);
setEditing(false);
toast.success('Profile updated');
} catch (err: any) {
toast.error(err?.message || 'Update failed');
} finally {
setProfileLoading(false);
}
}}>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<div>
<Label htmlFor="subjects">Subjects</Label>
<Input id="subjects" name="subjects" defaultValue={profile?.subjects || ''} disabled={!editing} className="mt-2" required />
</div>
<div>
<Label htmlFor="classes">Classes</Label>
<Input id="classes" name="classes" defaultValue={profile?.classes || ''} disabled={!editing} className="mt-2" required />
</div>
<div>
<Label htmlFor="experience">Experience</Label>
<Input id="experience" name="experience" defaultValue={profile?.experience || ''} disabled={!editing} className="mt-2" />
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
<div>
<Label htmlFor="qualifications">Qualifications</Label>
<Input id="qualifications" name="qualifications" defaultValue={profile?.qualifications || ''} disabled={!editing} className="mt-2" />
</div>
<div>
<Label htmlFor="city">City</Label>
<Input id="city" name="city" defaultValue={profile?.location?.city || ''} disabled={!editing} className="mt-2" required />
</div>
<div>
<Label htmlFor="mode">Teaching Mode</Label>
<Select name="mode" value={modeState} onValueChange={(v) => setModeState(v)} disabled={!editing}>
<SelectTrigger className="w-full mt-2">
<SelectValue placeholder="Select mode" />
</SelectTrigger>
<SelectContent>
<SelectItem value="online">Online</SelectItem>
<SelectItem value="offline">Offline</SelectItem>
<SelectItem value="both">Both</SelectItem>
</SelectContent>
</Select>
</div>
</div>
<div className="mt-6">
<Label htmlFor="bio">Bio</Label>
<Textarea id="bio" name="bio" defaultValue={profile?.bio || ''} disabled={!editing} className="mt-2" />
</div>
<div className="mt-6">
<Label htmlFor="achievements">Achievements (one per line)</Label>
<Textarea
id="achievements"
name="achievements"
placeholder="Add your achievements like 'Gold Medal in Math Olympiad', 'Certified by XYZ Board', etc. (one per line)"
defaultValue={(profile?.achievements || []).join('\n')}
disabled={!editing}
className="mt-2"
rows={4}
/>
</div>
<div className="mt-4 flex gap-2">
{!editing && <Button type="button" onClick={() => setEditing(true)}>Edit</Button>}
{editing && <Button type="submit" className="bg-blue-600">Save Changes</Button>}
{editing && <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>}

{/* Start Video Call is shown per-request when a request is accepted */}
</div>
</form>

</CardContent>
</Card>
</TabsContent>
</Tabs>
</div>
</div>
);
};

export default TeacherDashboard;


/* Added Start Meeting Button */
