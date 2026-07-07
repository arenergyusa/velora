import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email address'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message cannot exceed 1000 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body using zod
    const validationResult = contactSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, message } = validationResult.data;

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message,
      },
    });

    return NextResponse.json({ success: true, contactMessage }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error saving contact message:', error);
    return NextResponse.json(
      { error: 'Internal server error while saving the message.' },
      { status: 500 }
    );
  }
}
