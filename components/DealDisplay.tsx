import { useEffect, useState } from 'react'
import ethers from 'ethers'
import { IUser } from '@/firebase/types';
import { GetDeals, UpdateDeal } from '@/firebase/crud';
import { IDeal } from '@/firebase/types';
import useDealModule from '@/hooks/useDealModule';
import useSafeWallet from '@/hooks/useSafeWallet';
import { DataGrid, GridValueGetterParams, GridRowParams } from "@mui/x-data-grid";
import { Button, LinearProgress } from "@mui/material";
import UpgradeIcon from '@mui/icons-material/Upgrade';

export default function DealDisplay({
    user,
    userSigner
}: {
    user: IUser | undefined
    userSigner: ethers.providers.JsonRpcSigner | undefined
}) {

    const [isLoading, setIsLoading] = useState<boolean>(false)
    const { updateDeal, getBalance, getFlow } = useDealModule()
    const { getSafe } = useSafeWallet()

    const [deals, setDeals] = useState<IDeal[]>([])


    async function getDeals(user: IUser){
        const deals_ = await GetDeals(user.eoa, user.gnosisSafeAddress)
        setDeals(deals_)  
    }

    async function updateDeal_(deal: IDeal){
        if(!user || !userSigner) {
            alert('Sign in to execute deal')
            return
        }
        if(!deal) {
            alert('Please enter deal unique code first.')
            return
        }
        setIsLoading(true)
        const safe = await getSafe(userSigner, deal.enterprise)
        await updateDeal(userSigner, safe, deal.influencer);
        const flowRate = await getFlow(userSigner, safe, deal.influencer)
        await UpdateDeal(deal.id, parseFloat(flowRate));
        await getDeals(user)
        setIsLoading(false)
    }

    async function refreshBalance() {
        if(!user || !userSigner) {
            alert('Sign in to execute deal')
            return
        }
        await getBalance(userSigner, user.gnosisSafeAddress)
    }

    useEffect(() => {
        if(user)
            getDeals(user)
    }, [user]);


    const displayColumns = [
		{ field: "uniqueCode", headerName: "Deal ID", width: 100 },
		{ field: "enterprise", headerName: "Enterprise Safe", width: 400 },
		{ field: "influencer", headerName: "Influencer Safe", width: 400 },
        { field: "flowRate", headerName: "Flow Rate (per sec)", width: 150 },
        { field: "durationSeconds", headerName: "Duration (days)", width: 150, valueGetter: (params: GridValueGetterParams) => {
            return params.row.durationSeconds / 86400
        }},
		{
			field: "attest",
			headerName: "",
			sortable: false,
			width: 150,
			renderCell: ({ row }: Partial<GridRowParams>) =>
			<>
				<Button style={{textTransform: 'none'}} variant="outlined" color="success" hidden={isLoading} onClick={() => updateDeal_(row)}>
					Update &nbsp; <UpgradeIcon/>
				</Button>
			</>,
		},
	];


    return (
        <>
            <div>
                <h2 style={{textAlign: "center", }}>Your currect rocking collaborations!</h2>
                {isLoading && <LinearProgress color="success"/>}
                <div style={{ height: 400, width: '100%' }}>
                    <DataGrid
                        rows={deals}
                        columns={displayColumns}
                    />
                </div>
            </div>
        {/* <button onClick={() => refreshBalance()}>Refresh Balance</button> */}
        </>
    )
}
