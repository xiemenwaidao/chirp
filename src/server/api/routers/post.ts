import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { filterUserForClient } from "~/server/helpers/filterUserForClient";

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(1, "10 m"),
    analytics: true,
    /**
     * Optional prefix for the keys used in redis. This is useful if you want to share a redis
     * instance with other applications and want to avoid key collisions. The default prefix is
     * "@upstash/ratelimit"
     * Redisで使用されるキーのオプションのプレフィックス。他のアプリケーションとRedisインスタンスを共有し、キーコリジョンを避けたい場合に便利です。デフォルトのプレフィックスは「@upstash/ratelimit」です。
     */
    //   prefix: "@upstash/ratelimit",
});

export const postRouter = createTRPCRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        const posts = await ctx.prisma.post.findMany({
            take: 100,
            orderBy: [
                {
                    createdAt: "desc",
                },
            ],
        });

        const users = (
            await clerkClient.users.getUserList({
                userId: posts.map((post) => post.authorId),
                limit: 100,
            })
        ).map(filterUserForClient);

        return posts.map((post) => {
            const author = users.find((user) => user.id === post.authorId);

            if (!author || !author.username) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Author for post not found" });

            return {
                post,
                author: {
                    ...author,
                    username: author.username,
                },
            };
        });
    }),

    create: privateProcedure
        .input(
            z.object({
                content: z.string().emoji("Only Emojis are Allowed").min(1).max(280),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const authorId = ctx.userId;

            const { success } = await ratelimit.limit(authorId);
            if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You are doing that too much. Please try again later." });

            const post = await ctx.prisma.post.create({
                data: {
                    authorId,
                    content: input.content,
                },
            });

            return post;
        }),
});
