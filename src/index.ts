export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // CORS 处理
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8",
    };

    // 路由: /api/records
    if (pathname === "/api/records") {
      if (request.method === "POST") {
        try {
          const body = (await request.json()) as any;
          const id = crypto.randomUUID();
          const clientUuid = body.clientUuid || body.client_uuid || "anonymous";
          const studentName = body.studentName || body.student_name || "";
          const studentClass = body.studentClass || body.student_class || "";
          const score = Number.isInteger(body.score) ? body.score : 0;
          const timeSpent = parseInt(body.timeSpent ?? body.time_spent ?? 0, 10);
          const totalPuzzles = parseInt(body.totalPuzzles ?? body.total_puzzles ?? 0, 10);
          const correctPuzzles = parseInt(body.correctPuzzles ?? body.correct_puzzles ?? 0, 10);
          const totalHoles = parseInt(body.totalHoles ?? body.total_holes ?? 0, 10);
          const correctHoles = parseInt(body.correctHoles ?? body.correct_holes ?? 0, 10);
          const difficulty = body.difficulty || "easy";
          const symbolType = body.symbolType || body.symbol_type || "numbers";
          const pagesCount = parseInt(body.pagesCount ?? body.pages_count ?? 1, 10);
          const rowsPerPage = parseInt(body.rowsPerPage ?? body.rows_per_page ?? 2, 10);
          const detailJson = typeof body.detailJson === "string"
            ? body.detailJson
            : JSON.stringify(body.detailJson || {});

          await env.DB.prepare(`
            INSERT INTO exam_records (
              id, client_uuid, student_name, student_class, score,
              time_spent, total_puzzles, correct_puzzles, total_holes,
              correct_holes, difficulty, symbol_type, pages_count,
              rows_per_page, detail_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            id,
            clientUuid,
            studentName,
            studentClass,
            score,
            timeSpent,
            totalPuzzles,
            correctPuzzles,
            totalHoles,
            correctHoles,
            difficulty,
            symbolType,
            pagesCount,
            rowsPerPage,
            detailJson
          ).run();

          return new Response(JSON.stringify({ success: true, id }), {
            headers: corsHeaders,
            status: 201,
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            headers: corsHeaders,
            status: 500,
          });
        }
      }

      if (request.method === "GET") {
        try {
          const clientUuid = searchParams.get("clientUuid") || searchParams.get("client_uuid") || "anonymous";
          const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

          // 聚合统计
          const statsRow = await env.DB.prepare(`
            SELECT
              COUNT(*) as totalRecords,
              COALESCE(MAX(score), 0) as maxScore,
              COALESCE(ROUND(AVG(score), 1), 0) as avgScore,
              COALESCE(SUM(time_spent), 0) as totalTimeSpent
            FROM exam_records
            WHERE client_uuid = ?
          `).bind(clientUuid).first();

          // 记录列表
          const recordsResult = await env.DB.prepare(`
            SELECT
              id, client_uuid, student_name, student_class, score,
              time_spent, total_puzzles, correct_puzzles, total_holes,
              correct_holes, difficulty, symbol_type, pages_count,
              rows_per_page, created_at
            FROM exam_records
            WHERE client_uuid = ?
            ORDER BY created_at DESC
            LIMIT ?
          `).bind(clientUuid, limit).all();

          return new Response(
            JSON.stringify({
              success: true,
              stats: statsRow || {
                totalRecords: 0,
                maxScore: 0,
                avgScore: 0,
                totalTimeSpent: 0,
              },
              records: recordsResult.results || [],
            }),
            { headers: corsHeaders }
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            headers: corsHeaders,
            status: 500,
          });
        }
      }
    }

    // 单条记录查询与删除
    if (pathname.startsWith("/api/records/")) {
      const id = pathname.replace("/api/records/", "");

      if (request.method === "GET") {
        try {
          const record = await env.DB.prepare(`
            SELECT * FROM exam_records WHERE id = ?
          `).bind(id).first();

          if (!record) {
            return new Response(JSON.stringify({ success: false, message: "Record not found" }), {
              headers: corsHeaders,
              status: 404,
            });
          }

          return new Response(JSON.stringify({ success: true, record }), {
            headers: corsHeaders,
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            headers: corsHeaders,
            status: 500,
          });
        }
      }

      if (request.method === "DELETE") {
        try {
          await env.DB.prepare(`DELETE FROM exam_records WHERE id = ?`).bind(id).run();
          return new Response(JSON.stringify({ success: true }), {
            headers: corsHeaders,
          });
        } catch (err: any) {
          return new Response(JSON.stringify({ success: false, error: err.message }), {
            headers: corsHeaders,
            status: 500,
          });
        }
      }
    }

    // 静态资源处理
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
