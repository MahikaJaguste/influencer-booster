import useAuthKit from '@/hooks/useAuthKit'

export default function Home() {

	const  { safeAuth } = useAuthKit()

    async function handleRegister() {
		if (safeAuth) {
			const response = await safeAuth.signIn();
			console.log(response.eoa, response);
			const r2 = await safeAuth.signOut();
			console.log("r2", r2);
		};
	}

    return (
        <>
            <h1>Hey</h1>
            <button
                onClick={() => {
                    console.log('clicked')
					handleRegister()
                }}
            >Click me</button>
        </>
    )
}
