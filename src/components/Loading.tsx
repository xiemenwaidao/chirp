export const LoadingSpinner = () => {
    return (
        <div className="flex justify-center" aria-label="loading">
            <div className="h-16 w-16 animate-spin rounded-3xl bg-slate-300"></div>
        </div>
    );
};

export const LoadingPage = () => {
    return (
        <div className="absolute right-0 top-0 grid h-screen w-screen place-items-center">
            <LoadingSpinner />
        </div>
    );
};
