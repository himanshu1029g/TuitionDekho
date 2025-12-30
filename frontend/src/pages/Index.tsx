
import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Users, Award, ChevronRight, GraduationCap, MapPin, Clock, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import LoginModal from '@/components/LoginModal';
import { searchTeachers } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { formatLocation } from '@/lib/utils';
const logo = '/logo.png';

// import city/state package
import { City, State } from 'country-state-city';

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'student' | 'teacher'>('student');

  const [allCities, setAllCities] = useState<{ name: string }[]>([]);

  const navigate = useNavigate();
  const { isLoggedIn, user } = useUser();

  useEffect(() => {
    // Load all Indian cities dynamically
    const indianStates = State.getStatesOfCountry('IN');
    let cities: { name: string }[] = [];
    indianStates.forEach((st) => {
      const stateCities = City.getCitiesOfState('IN', st.isoCode);
      cities = [...cities, ...stateCities];
    });
    setAllCities(cities);
  }, []);

  const handleSearch = () => {
    const searchParams = new URLSearchParams({
      q: searchTerm,
      class: selectedClass,
      subject: selectedSubject,
      city: selectedLocation,
      mode: selectedMode,
    });
    navigate(`/search?${searchParams.toString()}`);
  };

  const handleGetStarted = (role: 'student' | 'teacher') => {
    setLoginMode(role);
    setShowLoginModal(true);
  };

  const [featuredTeachers, setFeaturedTeachers] = React.useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    async function loadFeatured() {
      try {
        const res = await searchTeachers({ page: 1, limit: 6 });
        if (!mounted) return;
        setFeaturedTeachers(res?.teachers || []);
      } catch (e) {
        console.error('Failed to load featured teachers', e);
      }
    }
    loadFeatured();
    return () => { mounted = false; };
  }, []);

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* <GraduationCap className="h-8 w-8 text-primary" /> */}
            <img src={logo} alt="logo_img" width={40} height={50} />
            <h1 className="text-2xl font-bold text-primary"> TuitionDekho.com</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-primary transition-colors">How it Works</a>
            <a href="#teachers" className="text-gray-600 hover:text-primary transition-colors">Teachers</a>
          </nav>
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <Button 
                onClick={() => navigate(user?.role === 'student' ? '/student-dashboard' : '/teacher-dashboard')}
                className="bg-primary hover:bg-primary/90"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleGetStarted('student')}>
                  Student Login
                </Button>
                <Button onClick={() => handleGetStarted('teacher')}>
                  Teacher Login
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Find the Perfect
              <span className="text-primary block">Tutor for You</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Connect with qualified teachers and tuition centers near you. 
              Learn at your own pace with personalized attention.
            </p>
          </div>

          {/* Search Bar with dynamic city */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              {/* Search Input */}
              <div className="md:col-span-2">
                <Input
                  placeholder="Search for subject or teacher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Class */}
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, idx) => (
                    <SelectItem key={idx+1} value={`${idx+1}`}>Class {idx+1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Subject */}
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="chemistry">Chemistry</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="geography">Geography</SelectItem>
                  <SelectItem value="all">All Subjects</SelectItem>
                </SelectContent>
              </Select>

              {/* Dynamic City (autocomplete) */}
              <div>
                <Input
                  placeholder="City"
                  list="city-list"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="h-12"
                />
                <datalist id="city-list">
                  {useMemo(() => Array.from(new Set(allCities.map(c => c.name))).sort(), [allCities]).map((cityName) => (
                    <option key={cityName} value={cityName} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Mode of Teaching" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="both">Both Online & Offline</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="h-12 px-8 bg-primary hover:bg-primary/90">
                <Search className="mr-2 h-5 w-5" />
                Search Teachers
              </Button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-4"
              onClick={() => handleGetStarted('student')}
            >
              I'm a Student
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-2"
              onClick={() => handleGetStarted('teacher')}
            >
              I'm a Teacher
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Why Choose TuitionDekho?</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make finding the right tutor simple, safe, and effective
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover-lift border-0 shadow-lg">
              <CardHeader className="text-center">
                <Search className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Smart Search</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Find teachers based on subject, class, location, and teaching mode with our advanced filtering system.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-lift border-0 shadow-lg">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 text-secondary mx-auto mb-4" />
                <CardTitle>Verified Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  All teachers are verified with proper credentials, experience, and student reviews for quality assurance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-lift border-0 shadow-lg">
              <CardHeader className="text-center">
                <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Easy Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Simple meeting request system allows students to connect with teachers instantly for both online and offline sessions.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Teachers */}
      <section id="teachers" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Featured Teachers</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Meet some of our top-rated teachers who are ready to help you succeed
            </p>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredTeachers.map((teacher: any) => (
                <Card key={teacher._id || teacher.id} onClick={() => navigate(`/teacher/${teacher._id || teacher.id}`)} className="hover-lift border-0 shadow-lg cursor-pointer">
                  <CardHeader className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{(teacher.userId?.name || teacher.name || '').charAt(0)}</span>
                    </div>
                    <CardTitle>{teacher.userId?.name || teacher.name}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-primary">
                      {teacher.subjects || teacher.subject}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-3">
                    <div className="flex items-center justify-center space-x-2">
                      <Award className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{teacher.experience || '—'} experience</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{formatLocation(teacher.location)}</span>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {teacher.mode}
                    </Badge>
                  </CardContent>
                </Card>
              ))} 
            </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting started is easy. Follow these simple steps to find your perfect tutor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Search</h4>
              <p className="text-gray-600">Search for teachers based on your requirements</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Browse</h4>
              <p className="text-gray-600">View detailed profiles and reviews of teachers</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Connect</h4>
              <p className="text-gray-600">Send meeting request to your preferred teacher</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h4 className="text-xl font-semibold mb-2">Learn</h4>
              <p className="text-gray-600">Start learning with personalized attention</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h5 className="text-xl font-bold">TuitionDekho.com</h5>
              </div>
              <p className="text-gray-400">
                Connecting students with the best teachers and tuition centers across India.
              </p>
            </div>
            <div>
              <h6 className="font-semibold mb-4">For Students</h6>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Find Teachers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Student Stories</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-4">For Teachers</h6>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Join as Teacher</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Teacher Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-semibold mb-4">Support</h6>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TuitionDekho.com. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        mode={loginMode}
      />
    </div>
  );
};

export default Index;
