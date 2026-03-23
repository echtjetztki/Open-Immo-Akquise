import UserHeader from "@/components/UserHeader";

export default function AgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background">
            <UserHeader />
            <main className="flex-grow w-full p-1 lg:p-2 pt-4 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
