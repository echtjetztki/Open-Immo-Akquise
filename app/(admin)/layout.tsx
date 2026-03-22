import { Sidebar } from "@/components/Sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeSessionValue } from "@/lib/session";

export default async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');

    if (!session) {
        redirect('/login');
    }

    const userData = await decodeSessionValue(session.value);
    if (!userData) {
        redirect('/login');
    }

    if (userData.role !== 'admin') {
        if (userData.role === 'agent') {
            const agentName = userData.displayName || userData.username || '';
            const agentPath = agentName ? `/agent/${encodeURIComponent(agentName)}` : '/agent';
            redirect(agentPath);
        }
        redirect('/user');
    }

    return (
        <div className="min-h-screen">
            <Sidebar />
            <main className="lg:ml-56 p-1 lg:p-2 pt-16 lg:pt-4 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
