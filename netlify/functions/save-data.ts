import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  // 只允许 POST 请求
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 解析请求体
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid request: text is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 获取 Netlify Blob store
    const store = getStore({
      name: "text-transfer",
      siteID: context.site.id,
    });

    // 生成唯一的键名（使用时间戳 + 随机字符串）
    const key = `text-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 保存到 Blob
    await store.set(key, text, {
      metadata: {
        createdAt: new Date().toISOString(),
        length: text.length.toString(),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        key,
        message: "Text saved successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error saving text:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to save text",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
