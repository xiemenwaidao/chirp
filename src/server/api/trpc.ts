/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * このファイルを編集する必要はおそらくありませんが、以下の場合は編集することができます
 * 1. You want to modify request context (see Part 1).
 * リクエストコンテキストを変更したい場合（Part 1を参照）。
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 * 新しいミドルウェアや手順の種類を作成したい場合（Part 3を参照）。
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 * ここでtRPCサーバーのすべての部分が作成され、接続されます。使用する必要がある部分は、該当する箇所で適切にドキュメント化されています。
 */
import { getAuth } from "@clerk/nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 * このセクションでは、バックエンドAPIで使用可能な「コンテキスト」を定義します。
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 * これにより、データベース、セッションなどのリクエストの処理時にアクセスする必要がある要素にアクセスできます。
 */

// type CreateContextOptions = Record<string, never>;

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 * このヘルパーは、tRPCコンテキストの「内部処理」を生成します。必要な場合は、ここからエクスポートすることができます。
 *
 * Examples of things you may need it for:
 * 使用する場面の例:
 * - testing, so we don't have to mock Next.js' req/res
 * テスト時にNext.jsのreq/resをモックする必要がある場合
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 * tRPCのcreateSSGHelpersで、req/resがない場合
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
// const createInnerTRPCContext = (_opts: CreateContextOptions) => {
//     return {
//         prisma,
//     };
// };

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 * これは、ルーターで使用する実際のコンテキストです。tRPCエンドポイントを通過するすべてのリクエストの処理に使用されます。
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = (opts: CreateNextContextOptions) => {
    const { req } = opts;
    const sesh = getAuth(req);

    const userId = sesh.userId;

    return {
        prisma,
        userId,
    };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 * ここで、tRPC APIが初期化され、コンテキストとトランスフォーマーが接続されます。また、ZodErrorsを解析して、バックエンドでのバリデーションエラーによる手順の失敗時にフロントエンドで型の安全性が得られるようにします。
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
            },
        };
    },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
    if (!ctx.userId) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to perform this action.",
        });
    }

    return next({
        ctx: {
            userId: ctx.userId,
        },
    });
});

export const privateProcedure = t.procedure.use(enforceUserIsAuthed);
