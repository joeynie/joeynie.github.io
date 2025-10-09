import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  // 只允许 GET 请求
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 从 URL 参数获取 key
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return new Response(
        JSON.stringify({ error: "Missing key parameter" }),
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

    // 从 Blob 获取数据
    const text = await store.get(key, { type: "text" });

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text not found or expired" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 获取元数据
    const metadata = await store.getMetadata(key);

    return new Response(
      JSON.stringify({
        success: true,
        key,
        text,
        metadata,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error retrieving text:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to retrieve text",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
