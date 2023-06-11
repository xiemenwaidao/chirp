import { type NextPage } from "next";
import Head from "next/head";
import { PageLayout } from "~/components/Layout";

const SinglePostPage: NextPage = () => {
    return (
        <>
            <Head>
                <title>Post | Chirp</title>
            </Head>
            <PageLayout>
                <div>single post view</div>
            </PageLayout>
        </>
    );
};

export default SinglePostPage;
