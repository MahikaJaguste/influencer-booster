import { useEffect, useState } from 'react'
import useAuthKit from '@/hooks/useAuthKit'
import useSafeSigner from '@/hooks/useSafeSigner';
import useDealModule from '@/hooks/useDealModule';
import axios from 'axios';
import DealCreation from '@/components/DealCreation';
import DealAccept from '@/components/DealAccept';
import DealDisplay from '@/components/DealDisplay';
import About from '@/components/About';
import useSafeWallet from '@/hooks/useSafeWallet';
import * as ethers from 'ethers';
import { CreateUser, GetUser } from '@/firebase/crud';
import { IUser } from '@/firebase/types';
import { Tab, Tabs, Box, Typography, Card, CardContent, Button, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CopyIcon from '@mui/icons-material/CopyAll';
import LogoutIcon from '@mui/icons-material/Logout';



export default function Home() {

	const  { safeAuth } = useAuthKit()
    const { createSafeWallet } = useSafeWallet()
    const { getSafeSigner } = useSafeSigner()
    const { approveDeal, initDeal, startDeal, updateDeal, getDeal, getFlow, getBalance } = useDealModule()
    const [user, setUser] = useState<IUser>()
    const [safeSigner, setSafeSigner] = useState<ethers.providers.JsonRpcSigner>()
    const [balance, setBalance] = useState<string>()

    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    // async function handleSignIn() {
	// 	if (safeAuth) {
	// 		const response = await safeAuth.signIn();
	// 		console.log(response.eoa, response);
    //         setUser(response.eoa);
    //         const safeSigner = await getSafeSigner(safeAuth)
    //         console.log(safeSigner)
    //         if(!safeSigner) return
    //         const gnosisSafe = await createSafeWallet(safeSigner)
    //         console.log(gnosisSafe)
    //         const influencer = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
    //         const flowRate = 1000000000
    //         const tweetId = ethers.utils.formatBytes32String("123456");
    //         await approveDeal(safeSigner, gnosisSafe, influencer, flowRate);
    //         await initDeal(safeSigner, gnosisSafe, influencer, tweetId);
    //         await startDeal(safeSigner, gnosisSafe, influencer, tweetId, flowRate);
    //         await getDeal(safeSigner, gnosisSafe, influencer);
    //         await getFlow(safeSigner, gnosisSafe, influencer);
    //         await updateDeal(safeSigner, gnosisSafe, influencer);
    //         await getDeal(safeSigner, gnosisSafe, influencer);
    //         await getFlow(safeSigner, gnosisSafe, influencer);
    //         await updateDeal(safeSigner, gnosisSafe, influencer);
    //         await getDeal(safeSigner, gnosisSafe, influencer);
    //         await getFlow(safeSigner, gnosisSafe, influencer);
    //         await updateDeal(safeSigner, gnosisSafe, influencer);
    //         await getDeal(safeSigner, gnosisSafe, influencer);
    //         await getFlow(safeSigner, gnosisSafe, influencer);
	// 	};
	// }

    async function handleSignIn() {
		if (safeAuth) {
			const response = await safeAuth.signIn();
            let { user } = await GetUser(response.eoa)
            const safeSigner_ = await getSafeSigner(safeAuth)

            if(!user) {
                if(!safeSigner_) return
                const gnosisSafe = await createSafeWallet(safeSigner_);
                ({ user } = await CreateUser({
                    eoa: response.eoa,
                    gnosisSafeAddress: gnosisSafe.address,
                }))
            }
            console.log(user)
            setUser(user)
            setSafeSigner(safeSigner_)
            if(!safeSigner_) return

            const balance_ = await getBalance(safeSigner_, user.gnosisSafeAddress)
            if(!balance_) return
            setBalance(balance_)

		};
	}

    async function handleSignOut() {
        if (safeAuth) {
            await safeAuth.signOut();
            setUser(undefined)
        };
    }

    return (
        <div>
            <div style={{textAlign: "center", }}>
                <Typography ><h2>Influencer Booster</h2></Typography>
            </div>
            <Card sx={user ? { minWidth: 700, marginLeft: 45, marginRight: 70 } : { minWidth: 400, marginLeft: 65, marginRight: 100}} elevation={0}>
            <CardContent>
            <div style={{textAlign: "center", }}>
                {user && <>
                    <Typography variant="body1">
                        {`Your safe address : ${user.gnosisSafeAddress}`}
                        <IconButton aria-label="delete" size="small"
                            onClick={() => {
                                navigator.clipboard.writeText(user.gnosisSafeAddress)
                            }}>
                            <CopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton aria-label="delete" size="small"
                            onClick={() => {
                                handleSignOut()
                            }}>
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </Typography>
                    {balance && balance?.length && <Typography variant="body1">
                        {`Your balance : ${balance} DAIx`}
                        { user && safeSigner && <IconButton aria-label="delete" size="small" 
                            onClick={(async () => {
                                setBalance(await getBalance(safeSigner, user.gnosisSafeAddress))
                            })}>
                            <RefreshIcon fontSize="small" />
                            </IconButton> 
                        }
                    </Typography>}
                </>}
                {!user && <Button variant="contained" onClick={() => {
                    handleSignIn()
                }}>Sign In</Button>}
            </div>
            </CardContent>
            </Card>
            
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" centered>
                <Tab label="Create" {...a11yProps(0)} />
                <Tab label="Inbox" {...a11yProps(1)} />
                <Tab label="Active" {...a11yProps(2)} />
                <Tab label="About" {...a11yProps(3)} />
            </Tabs>
            <TabPanel value={value} index={0}>
                <DealCreation enterprise={user} enterpriseSigner={safeSigner} safeAuth={safeAuth}/>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <DealAccept user={user} userSigner={safeSigner}/>
            </TabPanel>
            <TabPanel value={value} index={2}>
                <DealDisplay user={user} userSigner={safeSigner}/>
            </TabPanel> 
            <TabPanel value={value} index={3}>
                <About/>
            </TabPanel>
        </div>
    )
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    
    return (
        <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
        >
        {value === index && (
            <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
            </Box>
        )}
        </div>
    );
}
    
function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}