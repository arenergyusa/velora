import ProfileClient from './ProfileClient';
import { getSession } from '@/lib/auth/jwt';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getSession();
  
  if (!session?.user?.walletAddress) {
    redirect('/');
  }

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8 animate-fade-in pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your personal information and contact details.
        </p>
      </div>
      
      <ProfileClient />
    </div>
  );
}
