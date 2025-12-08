import React, { useState, useEffect } from 'react';
import { formatLocation } from '@/lib/utils';
import { Search, Bell, User, MapPin, Clock, Star, MessageSquare, Filter, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { request } from 'http';

const StudentDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Dynamic data
  const [meetingRequests, setMeetingRequests] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedTeachers, setRecommendedTeachers] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const { getStudentDashboard, getStudentRequests, searchTeachers } = await import('@/lib/api');
        const [dashRes, reqs] = await Promise.all([getStudentDashboard().catch(() => null), getStudentRequests().catch(() => [])]);
        if (!mounted) return;
        setDashboard(dashRes?.dashboard || null);
        // set full requests list for student
        setMeetingRequests(reqs || []);
        // Optionally fetch recommended teachers (top-rated)
        const teacherRes = await searchTeachers({ page: 1, limit: 4 });
        setRecommendedTeachers(teacherRes.teachers || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  //  delete res func 

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { deleteStudentRequest } = await import('@/lib/api');
      await deleteStudentRequest(requestId);
      // Update local state to remove the deleted request
      setMeetingRequests(prev => 
        prev.filter(request => request._id !== requestId)
      );
      toast.success('Request deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete request');
    }
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams({ q: searchTerm });
    navigate(`/search?${searchParams.toString()}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Find the perfect tutor and track your learning journey
          </p>
        </div>

        {/* Quick Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Quick Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Search for subjects or teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">Meeting Requests</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <div className="grid gap-6">
              <h2 className="text-2xl font-semibold flex items-center">
                <MessageSquare className="mr-2 h-6 w-6" />
                Your Meeting Requests
              </h2>

              {meetingRequests.length === 0 ? (
                <div className="p-6 bg-white rounded border text-sm text-muted-foreground">No meeting requests yet.</div>
              ) : (
                meetingRequests.map((r: any) => (
                  <div key={r._id} className="p-4 bg-white rounded border mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{r.teacherId?.name || r.teacherId}</div>
                        <div className="text-sm text-muted-foreground">{r.subject} — {r.class}</div>
                      </div>
                      <div className="text-sm">
                        <span className={`px-3 py-1 rounded-full ${getStatusColor(r.status)}`}>{r.status}</span>
                      </div>
                    </div>

                    <div className="mt-4 text-sm">
                      <div className="text-muted-foreground">Your message:</div>
                      <div className="mt-2 bg-gray-50 p-3 rounded">{r.message}</div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {r.status === 'pending' && (
                        <button
                          className="px-3 py-1 bg-red-600 text-white rounded"
                          onClick={async () => {
                            if (!confirm('Delete this request?')) return;
                            try {
                              const { deleteStudentRequest } = await import('@/lib/api');
                              await deleteStudentRequest(r._id);
                              setMeetingRequests(prev => prev.filter(x => x._id !== r._id));
                              toast.success('Request deleted');
                            } catch (err: any) {
                              toast.error(err?.message || 'Delete failed');
                            }
                          }}
                        >
                          Delete Request
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommended" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Star className="mr-2 h-6 w-6" />
                Recommended Teachers
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendedTeachers.map((teacher) => (
                  <Card key={teacher._id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/teacher/${teacher._id}`)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{teacher.userId?.name || teacher.name}</CardTitle>
                          <CardDescription className="text-primary font-semibold">
                            {teacher.subjects || teacher.subject}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center mb-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="font-semibold">{teacher.rating ?? 0}</span>
                          </div>
                          <Badge variant="secondary">{teacher.fee || ''}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4 text-gray-500" />
                          {teacher.experience || ''} experience
                        </div>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                          {formatLocation(teacher.location)}
                        </div>
                        <Badge variant="outline" className="mt-2">
                          {teacher.mode === 'both' ? 'Online & Offline' : teacher.mode}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Calendar className="mr-2 h-6 w-6" />
                My Bookings
              </h2>
              <div className="space-y-4">
                {meetingRequests.filter((m:any) => m.status === 'accepted' || m.status === 'completed').length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No bookings yet</p>
                      <p className="text-gray-400 mb-4">Start by requesting meetings with teachers</p>
                      <Button onClick={() => navigate('/search')}>
                        Find Teachers
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  meetingRequests.filter((m:any) => m.status === 'accepted' || m.status === 'completed').map((b:any) => (
                    <Card key={b._id}>
                      <CardContent className="p-6 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{b.teacherId?.name || b.teacherId}</h3>
                          <p className="text-sm text-muted-foreground">{b.subject} — {b.class}</p>
                          <p className="text-sm mt-2">{b.scheduledDate ? new Date(b.scheduledDate).toLocaleString() : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {b.meetingLink ? (
                            <Button onClick={() => window.open(b.meetingLink, '_blank')}>Join Call</Button>
                          ) : (
                            <Button onClick={async () => { const { createMeeting } = await import('@/lib/api'); const res = await createMeeting(); if (res?.meetingUrl) window.open(res.meetingUrl, '_blank'); }}>Start Call</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;


/* Added Join Meeting Button */
