import { useState } from 'react'
import useAuthKit from '@/hooks/useAuthKit'
import axios from 'axios';
import CreateDeal from '@/components/CreateDeal';
import useSafeWallet from '@/hooks/useSafeWallet';

export default function Home() {

	const  { safeAuth } = useAuthKit()
    const { createSafeWallet } = useSafeWallet()
    const [user, setUser] = useState<string>('')

    async function handleSignIn() {
		if (safeAuth) {
			const response = await safeAuth.signIn();
			console.log(response.eoa, response);
            setUser(response.eoa);
            const safeAddress = await createSafeWallet(safeAuth, [response.eoa])
            console.log(safeAddress)
		};
	}

    async function handleSignOut() {
        if (safeAuth) {
            await safeAuth.signOut();
        };
    }

    return (
        <>
            <h1>Hey</h1>
            <button
                onClick={() => {
                    console.log('clicked')
					handleSignIn()
                }}
            >Sign In</button>

            {user && user.length ?
                <CreateDeal enterprise={user} enterpriseEmail={user} />
            : null}
        </>
    )
}
