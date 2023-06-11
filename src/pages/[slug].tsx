import { type InferGetStaticPropsType, type GetServerSidePropsContext, type NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PostFeedView } from "~/components/PostFeedView";
import { LoadingPage } from "~/components/Loading";
import Image from "next/image";
import { PageLayout } from "~/components/Layout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const PrifileFeed = (props: { userId: string }) => {
    const { data, isLoading } = api.post.getPostByUserId.useQuery({
        userId: props.userId,
    });

    if (isLoading) return <LoadingPage />;

    if (!data || data.length === 0) return <div>User has no posted</div>;

    return (
        <div className="flex flex-col">
            {data.map((fullPost) => (
                <PostFeedView key={fullPost.post.id} {...fullPost} />
            ))}
        </div>
    );
};

type PageProps = InferGetStaticPropsType<typeof getStaticProps>;

const ProfilePage: NextPage<PageProps> = ({ username }) => {
    const { data } = api.profile.getUserByUsername.useQuery({
        username,
    });

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
                        width={128}
                        height={128}
                    />
                </div>
                <div className={`h-[64px]`}></div>
                <div className="p-4 text-2xl font-bold">{`@${data.username}`}</div>
                <div className="w-full border-b border-slate-400" />
                <PrifileFeed userId={data.id} />
            </PageLayout>
        </>
    );
};

export const getStaticProps = async (context: GetServerSidePropsContext<{ slug: string }>) => {
    const helpers = generateSSGHelper();

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
