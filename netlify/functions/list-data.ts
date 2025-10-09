import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export default async (req: Request, context: Context) => {
  try {
    const store = getStore('text-storage');
    
    // 列出所有的 blob
    const { blobs } = await store.list();
    
    // 获取每个 blob 的元数据
    const items = await Promise.all(
      blobs.map(async (blob) => {
        const metadata = await store.getMetadata(blob.key);
        return {
          key: blob.key,
          metadata: metadata || {},
          etag: blob.etag,
        };
      })
    );
    
    // 按创建时间排序（最新的在前）
    items.sort((a, b) => {
      const metaA = a.metadata as { createdAt?: string };
      const metaB = b.metadata as { createdAt?: string };
      const timeA = metaA.createdAt ? new Date(metaA.createdAt).getTime() : 0;
      const timeB = metaB.createdAt ? new Date(metaB.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return new Response(
      JSON.stringify({
        success: true,
        items,
        count: items.length,
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
