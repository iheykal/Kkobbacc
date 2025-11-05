import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(req: Request) {
  try {
    const { name, fullName, phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
    }

    await dbConnect()

    const exists = await User.findOne({ phone })


    if (exists) {
      return NextResponse.json({ error: 'Account already exists' }, { status: 409 })
    }

    // Ignore role from client; schema default applies ('user')
    const user = await User.create({
      fullName: name || fullName || 'New User',
      phone,
      // Keep numeric password flows separate; not handled here
    })

    return NextResponse.json(
      { id: user._id, name: user.fullName, phone: user.phone, role: user.role },
      { status: 201 }
    )
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
