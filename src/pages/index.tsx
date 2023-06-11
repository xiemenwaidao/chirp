import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { api } from "~/utils/api";

import Image from "next/image";
import { LoadingPage } from "~/components/Loading";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { PageLayout } from "~/components/Layout";
import { PostFeedView } from "~/components/PostFeedView";

const CreatePostWizard = () => {
    const { user } = useUser();

    const [input, setInput] = useState<string>("");

    const ctx = api.useContext();

    const { mutate, isLoading: isPosting } = api.post.create.useMutation({
        onSuccess: () => {
            setInput("");
            void ctx.post.getAll.invalidate();
        },
        onError: (err) => {
            const errorMessage = err.data?.zodError?.fieldErrors.content;

            if (errorMessage && errorMessage[0]) {
                toast.error(errorMessage[0]);
            } else {
                if (err.message) {
                    toast.error(err.message);
                } else {
                    toast.error("Failed to post, please try again later");
                }
            }
        },
    });

    // console.log(user);

    if (!user) return null;

    return (
        <div className="flex w-full gap-4">
            <Image src={user.profileImageUrl} alt="Profile image" className="h-14 w-14 rounded-full" width={56} height={56} />
            <input
                type="text"
                placeholder="Type some emojis!"
                className="grow bg-transparent"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isPosting}
            />
            {input !== "" && !isPosting && (
                <button
                    type="button"
                    className="mb-2 mr-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                    onClick={() => {
                        mutate({ content: input });
                    }}
                >
                    Post
                </button>
            )}
        </div>
    );
};

const Feed = () => {
    const { data, isLoading: postLoading } = api.post.getAll.useQuery();
    if (postLoading) return <LoadingPage />;
    if (!data) return <div>Something went wrong</div>;

    return (
        <div className="flex flex-col">
            {data.map((fullPost) => (
                <PostFeedView key={fullPost.post.id} {...fullPost} />
            ))}
        </div>
    );
};

const Home: NextPage = () => {
    const { isLoaded: userLoaded, isSignedIn } = useUser();

    // start fetching asap
    api.post.getAll.useQuery();

    // return empty div if user is not loaded
    if (!userLoaded) return <div />;

    return (
        <PageLayout>
            <div className="flex border-b border-slate-400 p-4">
                {!isSignedIn && (
                    <div className="flex justify-center">
                        <SignInButton />
                    </div>
                )}
                {!!isSignedIn && <CreatePostWizard />}
            </div>

            <Feed />
        </PageLayout>
    );
};

export default Home;
