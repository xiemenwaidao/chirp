import { type InferGetStaticPropsType, type GetServerSidePropsContext, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";

const calcHeight = (n: number) => {
    return {
        halfHeight: `h-[${n / 2}px]`,
        n,
    };
};

type PageProps = InferGetStaticPropsType<typeof getStaticProps>;

const ProfilePage: NextPage<PageProps> = ({ username }) => {
    const { data } = api.profile.getUserByUsername.useQuery({
        username,
    });

    const { n } = calcHeight(128);

    if (!data) return <div>404</div>;
    if (!data.username) return <div>Something went wrong</div>;

    return (
        <>
            <Head>
                <title>{`${data.username} | Chirp`}</title>
            </Head>
            <PageLayout>
                <div className="relative h-36 bg-slate-600">
                    <Image
                        src={data.profilePicture}
                        alt={`@${data.username}'s profile picture`}
                        className={`absolute bottom-0 left-0 -mb-[64px] ml-4 rounded-full border-4  border-black bg-black`}
                        width={n}
                        height={n}
                    />
                </div>
                <div className={`h-[64px]`}></div>
                <div className="p-4 text-2xl font-bold">{`@${data.username}`}</div>
                <div className="w-full border-b border-slate-400" />
            </PageLayout>
        </>
    );
};

import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";
import { PageLayout } from "~/components/Layout";
import Image from "next/image";

export const getStaticProps = async (context: GetServerSidePropsContext<{ slug: string }>) => {
    const helpers = createServerSideHelpers({
        router: appRouter,
        ctx: { prisma, userId: null },
        transformer: superjson,
    });

    const slug = context.params?.slug;
    if (typeof slug !== "string") throw new Error("no slug");

    const username = slug.replace("@", "");

    /*
     * Prefetching the `post.byId` query.
     * post.byId クエリのプリフェッチ。
     * `prefetch` does not return the result and never throws - if you need that behavior, use `fetch` instead.
     * prefetch は結果を返さず、例外も発生しません - その動作が必要な場合は、代わりに fetch を使用してください。
     */
    await helpers.profile.getUserByUsername.prefetch({ username });

    // Make sure to return { props: { trpcState: helpers.dehydrate() } }
    // 必ず { props: { trpcState: helpers.dehydrate() } } を返すようにしてください。
    return {
        props: {
            trpcState: helpers.dehydrate(),
            username,
        },
    };
};

export const getStaticPaths = () => {
    return {
        paths: [],
        fallback: "blocking",
    };
};

export default ProfilePage;
