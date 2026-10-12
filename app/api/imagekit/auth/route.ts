import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
      return NextResponse.json({ error: "ImageKit configuration is missing" }, { status: 500 });
    }

    const imagekit = new ImageKit({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
    });

    const authParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authParameters);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate auth parameters" }, { status: 500 });
  }
}

