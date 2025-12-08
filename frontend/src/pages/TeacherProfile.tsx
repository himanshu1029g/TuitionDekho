
import React, { useEffect, useState } from 'react';
import { formatLocation } from '@/lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MapPin, BookOpen, Clock, Users, MessageSquare, Award, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { getTeacherById, requestMeeting } from '@/lib/api';

const TeacherProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUser();
  const [meetingMessage, setMeetingMessage] = useState<string>('');
  const [preferredMode, setPreferredMode] = useState<string>('online');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState<boolean>(false);
  const [teacher, setTeacher] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await getTeacherById(id);
        if (!mounted) return;
        setTeacher(res.teacher || res.data?.teacher || res);
        setReviews((res.teacher && res.teacher.reviews) || []);
      } catch (e: any) {
        console.error('Failed to load teacher', e);
        if (!mounted) setError(e?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);


  const handleMeetingRequest = () => {
    if (!isLoggedIn) {
      toast.error('Please login as a student first');
      return;
    }

    if (user?.role !== 'student') {
      toast.error('Only students can request meetings');
      return;
    }

    if (!meetingMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    (async () => {
      try {
        // Validate message length
        if (meetingMessage.length < 10 || meetingMessage.length > 500) {
          toast.error('Message must be between 10 and 500 characters');
          return;
        }

        // Convert 'both' to 'online' as default
        const mode = preferredMode === 'both' ? 'online' : preferredMode;

        // The backend expects teacherId to be the User _id (Teacher.userId),
        // while the page URL param `id` is the Teacher profile _id.
        // Send teacher.userId._id when available (fall back to id).
        const resolvedTeacherId = teacher?.userId?._id || teacher?.userId || id;

        // Extract and trim first subject and class
        const subjectStr = (teacher?.subjects || '')
          .split(',')[0]
          ?.trim() || '';
        const classStr = (teacher?.classes || '')
          .split(',')[0]
          ?.trim() || '';

        if (!subjectStr) {
          toast.error('Teacher subject is missing or empty');
          return;
        }
        if (!classStr) {
          toast.error('Teacher class is missing or empty');
          return;
        }

        const payload = {
          teacherId: resolvedTeacherId,
          teacherProfileId: teacher?._id || id,
          mode: mode as 'online' | 'offline',
          message: meetingMessage,
          subject: subjectStr,
          class: classStr
        };

        console.debug('Sending meeting request payload', payload);

        await requestMeeting(payload);
        toast.success('Meeting request sent successfully!');
        setIsRequestDialogOpen(false);
        setMeetingMessage('');
        setPreferredMode('online');
      } catch (e: any) {
        console.error('meeting request failed', e);
        // Extract detailed error from server response if available
        const errorMsg = e?.response?.data?.message || e?.message || 'Failed to send meeting request';
        toast.error(errorMsg);
      }
    })();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Teacher Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {(teacher.userId?.name || teacher.name || '').charAt(0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{teacher.userId?.name || teacher.name}</h1>
                      <p className="text-xl text-primary font-semibold mb-2">
                        {(teacher.subjects || teacher.subject || '').split(',').join(' • ')}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-semibold">{teacher.rating ?? 0}</span>
                          <span className="ml-1">({(teacher.reviews && teacher.reviews.length) || 0} reviews)</span>
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          <span>{teacher.experience} experience</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{formatLocation(teacher.location)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-700">{teacher.bio || teacher.description || ''}</p>

                    <div className="flex flex-wrap gap-2">
                      {(teacher.specializations || teacher.qualifications || '')
                        .split(',')
                        .filter(Boolean)
                        .map((spec: string) => (
                          <Badge key={spec} variant="outline">{spec.trim()}</Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for detailed info */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {teacher.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Qualifications</h3>
                      <ul className="space-y-2">
                        {(teacher.qualifications || '')
                          .split(',')
                          .filter(Boolean)
                          .map((qual: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <Award className="h-4 w-4 text-primary mt-1 mr-2 flex-shrink-0" />
                              {qual.trim()}
                            </li>
                          ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(teacher.classes || '')
                        .split(',')
                        .filter(Boolean)
                        .map((cls: string) => (
                          <Badge key={cls} variant="secondary">{cls.trim()}</Badge>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>Available teaching hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(teacher.schedule || []).map((slot: any) => (
                        <div key={slot.day} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <span className="font-medium">{slot.day}</span>
                          <span className={`text-sm ${slot.time === 'Closed' ? 'text-red-500' : 'text-gray-600'}`}>{slot.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Reviews</CardTitle>
                    <CardDescription>{teacher.reviews} total reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{review.student}</p>
                              <p className="text-sm text-gray-500">{review.subject}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex">
                                {renderStars(review.rating)}
                              </div>
                              <p className="text-xs text-gray-500">{review.date}</p>
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="achievements" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Achievements & Recognition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {teacher.achievements?.length ? (
                        teacher.achievements.map((achievement, index) => (
                          <li key={index} className="flex items-start">
                            <Award className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                            <span>{achievement}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No achievements added yet.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing & Action Card */}
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">
                  {teacher.fee}
                </CardTitle>
                <CardDescription>Per hour session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <Badge variant="outline">{teacher.mode}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Availability:</span>
                    <Badge className="bg-green-100 text-green-800">{teacher.availability}</Badge>
                  </div>
                </div>

                <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Ask for Meet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Meeting with {teacher.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Your Message</Label>
                        <Textarea
                          placeholder="Tell the teacher about your learning goals and requirements..."
                          value={meetingMessage}
                          onChange={(e) => setMeetingMessage(e.target.value)}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Preferred Mode</Label>
                        <RadioGroup value={preferredMode} onValueChange={setPreferredMode} className="mt-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="online" id="online" />
                            <Label htmlFor="online">Online</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="offline" id="offline" />
                            <Label htmlFor="offline">Offline</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="both" />
                            <Label htmlFor="both">Either (No preference)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <Button onClick={handleMeetingRequest} className="w-full">
                        Send Meeting Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>


              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
