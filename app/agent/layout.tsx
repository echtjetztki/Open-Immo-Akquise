import UserFooterNav from "@/components/UserFooterNav";

export default function AgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <main className="w-full p-1 lg:p-2 pt-4 pb-20 transition-all duration-300">
                {children}
            </main>
            <UserFooterNav />
        </div>
    );
}
