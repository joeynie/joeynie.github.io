import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export default async (req: Request, context: Context) => {
  try {
    const store = getStore({
      name: 'text-transfer',
      siteID: context.site.id,
    });
    
    // 列出所有的 blob
    const { blobs } = await store.list();
    
    // 获取每个 blob 的内容和元数据
    const items = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const blobContent = await store.get(blob.key, { type: "text" });
          if (!blobContent) {
            return null;
          }
          
          // 尝试解析 JSON
          let blobData;
          try {
            blobData = JSON.parse(blobContent);
          } catch (e) {
            // 旧格式：纯文本，创建默认 metadata
            blobData = {
              text: blobContent,
              metadata: {
                preview: blobContent.substring(0, 150).replace(/\n/g, ' '),
                length: blobContent.length,
              },
            };
          }
          
          return {
            key: blob.key,
            metadata: blobData.metadata || {},
            etag: blob.etag,
          };
        } catch (error) {
          console.error(`Error loading blob ${blob.key}:`, error);
          return null;
        }
      })
    );
    
    // 过滤掉加载失败的项
    const validItems = items.filter(item => item !== null);
    
    // 按创建时间排序（最新的在前）
    validItems.sort((a, b) => {
      const metaA = a!.metadata as { createdAt?: string };
      const metaB = b!.metadata as { createdAt?: string };
      const timeA = metaA.createdAt ? new Date(metaA.createdAt).getTime() : 0;
      const timeB = metaB.createdAt ? new Date(metaB.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return new Response(
      JSON.stringify({
        success: true,
        items: validItems,
        count: validItems.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('List error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: '获取列表失败',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};
