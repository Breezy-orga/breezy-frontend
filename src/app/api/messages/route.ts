import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Message } from '@/lib/models/Message';

export async function GET() {
  try {
    await connectDB();
    
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username')
      .lean();

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { content, author } = body;

    if (!content || !author) {
      return NextResponse.json(
        { error: 'Missing content or author' },
        { status: 400 }
      );
    }

    const newMessage = await Message.create({ content, author });
    await newMessage.populate('author', 'username');

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
} 