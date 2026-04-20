import { AuthContext } from "@/ctx/AuthContext";
import { supabase } from "@/utils/supabase";
import { Session } from "@supabase/supabase-js";
import { PropsWithChildren, useEffect, useState } from "react";

export default function AuthProvider({ children }: PropsWithChildren) {
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    const premiumExpiresAt: string | null = profile?.is_premium ?? null
    const isPremium = !!profile?.is_premium && (!premiumExpiresAt || new Date(premiumExpiresAt) > new Date())

    const loadProfile = async (s: Session | null) => {
        if (!s) {
            setProfile(null)
            return
        }

        const { error, data } = await supabase
            .from("profile")
            .select("*")
            .eq("id", s.user.id)
            .maybeSingle()

        /* .maybeSingle() behavior
        If 1 row found → return object
        If 0 rows found → return null
        If multiple rows found → error */

        setProfile(error ? null : data)
    }

    const refreshProfile = () => loadProfile(session)

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const { data } = await supabase.auth.getSession();
            const initialSession = data.session ?? null;
            setSession(initialSession);
            await loadProfile(initialSession);
            setLoading(false);
        };

        init();

        /* onAuthStateChange a real-time auth listener in Supabase that triggers whenever the authentication state changes (login, logout, token refresh). It returns a subscription object that we must clean up to avoid memory leaks. */

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setLoading(true);
            setSession(newSession);
            loadProfile(newSession).finally(() => setLoading(false));
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                session,
                user: session?.user ?? null,
                profile,
                loading,
                isPremium,
                isAdmin: false,
                premiumExpiresAt,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}