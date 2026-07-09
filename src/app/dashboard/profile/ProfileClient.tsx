'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Country, State, City } from 'country-state-city';
import { AlertCircle, CheckCircle2, User, Phone, MapPin, Mail, Loader2 } from 'lucide-react';

interface ProfileData {
  fullName: string;
  phone: string;
  phoneCountryCode: string;
  email: string;
  country: string;
  state: string;
  city: string;
  pinCode: string;
}

export default function ProfileClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ProfileData>({
    fullName: '',
    phone: '',
    phoneCountryCode: '',
    email: '',
    country: '',
    state: '',
    city: '',
    pinCode: '',
  });

  const [countries] = useState(Country.getAllCountries());
  const [states, setStates] = useState<ReturnType<typeof State.getStatesOfCountry>>([]);
  const [cities, setCities] = useState<ReturnType<typeof City.getCitiesOfState>>([]);
  
  const [isSetupComplete, setIsSetupComplete] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (res.ok) {
        const data = await res.json();
        const profileData = {
          fullName: data.fullName || '',
          phone: data.phone || '',
          phoneCountryCode: data.phoneCountryCode || '',
          email: data.email || '',
          country: data.country || '',
          state: data.state || '',
          city: data.city || '',
          pinCode: data.pinCode || '',
        };
        setFormData(profileData);
        
        // Check if any required field is missing
        if (!data.fullName || !data.phone || !data.email || !data.country || !data.state || !data.city || !data.pinCode) {
          setIsSetupComplete(false);
        }
        
        if (data.country) {
          setStates(State.getStatesOfCountry(data.country));
          if (data.state) {
            setCities(City.getCitiesOfState(data.country, data.state));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchProfile();
  }, []);

  const handleCountryChange = (countryCode: string) => {
    const phoneCode = Country.getCountryByCode(countryCode)?.phonecode || '';
    setFormData((prev) => ({
      ...prev,
      country: countryCode,
      phoneCountryCode: `+${phoneCode}`,
      state: '',
      city: '',
    }));
    setStates(State.getStatesOfCountry(countryCode));
    setCities([]);
  };

  const handleStateChange = (stateCode: string) => {
    setFormData((prev) => ({ ...prev, state: stateCode, city: '' }));
    if (formData.country) {
      setCities(City.getCitiesOfState(formData.country, stateCode));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return 'Full Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email address';
    if (!formData.country) return 'Country is required';
    if (!formData.phoneCountryCode) return 'Country Code is required';
    if (!formData.phone.trim()) return 'Phone Number is required';
    if (!formData.state) return 'State is required';
    if (!formData.city) return 'City is required';
    if (!formData.pinCode.trim()) return 'Pin Code is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Profile updated successfully');
        setIsSetupComplete(true);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isSetupComplete && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Profile Setup Required</h3>
            <p className="text-xs opacity-90 mt-1">
              Your profile is incomplete. Please fill in all the details below to complete your setup.
            </p>
          </div>
        </div>
      )}

      {isSetupComplete && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl flex items-center gap-4">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Profile Complete</h3>
            <p className="text-xs opacity-90">Your profile information is up to date.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="bg-white/5 border-white/10 overflow-hidden relative">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <CardHeader>
            <CardTitle className="text-xl">Personal Information</CardTitle>
            <CardDescription>Update your personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" /> Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" /> Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Country Selection (Syncs with Phone Code) */}
              <div className="space-y-2">
                <Label htmlFor="country" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" /> Country
                </Label>
                <select
                  id="country"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                >
                  <option value="" className="text-black">Select Country</option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode} className="text-black">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone Number with Prefix */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" /> Phone Number
                </Label>
                <div className="flex">
                  <select
                    className="flex h-10 w-[110px] items-center justify-between rounded-l-md border border-white/10 border-r-0 bg-white/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 appearance-none z-10 relative"
                    value={formData.phoneCountryCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneCountryCode: e.target.value }))}
                  >
                    <option value="" className="text-black">Code</option>
                    {countries.map((c) => (
                      <option key={c.isoCode} value={c.isoCode} className="text-black">
                        +{c.phonecode} ({c.isoCode})
                      </option>
                    ))}
                  </select>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="rounded-l-none bg-white/5 border-white/10 focus:border-primary/50 transition-colors pl-3 flex-1"
                  />
                </div>
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state">State / Province</Label>
                <select
                  id="state"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  disabled={!formData.country}
                >
                  <option value="" className="text-black">Select State</option>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.isoCode} className="text-black">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  name="city"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!formData.state}
                >
                  <option value="" className="text-black">Select City</option>
                  {cities.map((c) => (
                    <option key={c.name} value={c.name} className="text-black">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pin Code */}
              <div className="space-y-2">
                <Label htmlFor="pinCode">Pin / Zip Code</Label>
                <Input
                  id="pinCode"
                  name="pinCode"
                  placeholder="Enter pin code"
                  value={formData.pinCode}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 focus:border-primary/50 transition-colors"
                />
              </div>

            </div>
          </CardContent>
          <CardFooter className="bg-white/5 border-t border-white/10 pt-6">
            <Button 
              type="submit" 
              className="w-full md:w-auto min-w-[150px] relative overflow-hidden group"
              disabled={saving}
            >
              {/* Button hover effect */}
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              
              <span className="relative z-10 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
