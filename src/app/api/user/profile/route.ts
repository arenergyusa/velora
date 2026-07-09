import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/jwt';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await getSession();
    const walletAddress = session?.user?.walletAddress;
    if (typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        fullName: true,
        phone: true,
        phoneCountryCode: true,
        email: true,
        country: true,
        state: true,
        city: true,
        pinCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    const walletAddress = session?.user?.walletAddress;
    if (typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const profileSchema = z.object({
      fullName: z.string().min(2, "Full Name is required").max(100),
      phone: z.string().min(5, "Valid phone number is required").max(15),
      phoneCountryCode: z.string().min(1, "Country code is required").max(10),
      email: z.string().email("Valid email is required").max(100),
      country: z.string().min(2, "Country is required").max(50),
      state: z.string().min(2, "State is required").max(50),
      city: z.string().min(2, "City is required").max(50),
      pinCode: z.string().min(3, "Pin code is required").max(20),
    });

    const parsedData = profileSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json({ error: parsedData.error.issues[0].message }, { status: 400 });
    }

    const { fullName, phone, phoneCountryCode, email, country, state, city, pinCode } = parsedData.data;

    const updatedUser = await prisma.user.update({
      where: { walletAddress },
      data: {
        fullName,
        phone,
        phoneCountryCode,
        email,
        country,
        state,
        city,
        pinCode,
      },
      select: {
        fullName: true,
        phone: true,
        phoneCountryCode: true,
        email: true,
        country: true,
        state: true,
        city: true,
        pinCode: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
