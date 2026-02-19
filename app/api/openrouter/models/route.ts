import { NextResponse } from "next/server";
import { getChatModels, getImageModels, groupModelsByProvider } from "@/lib/openrouter";

export async function GET() {
  try {
    const [chatModels, imageModels] = await Promise.all([
      getChatModels(),
      getImageModels(),
    ]);

    const chatGrouped = groupModelsByProvider(chatModels);
    const imageGrouped = groupModelsByProvider(imageModels);

    return NextResponse.json({
      chatModels,
      imageModels,
      chatGrouped,
      imageGrouped,
      openRouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    });
  } catch (error: any) {
    console.error("Failed to fetch OpenRouter models:", error?.message);
    return NextResponse.json(
      { error: "Failed to fetch models", chatModels: [], imageModels: [] },
      { status: 500 }
    );
  }
}
