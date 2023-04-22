import { useState, useEffect } from "react";
import {
    SafeAuthKit,
    Web3AuthAdapter
} from "@safe-global/auth-kit";
import { Web3AuthOptions } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";

const useAuthKit = () => {
    const [safeAuth, setSafeAuth] = useState<SafeAuthKit<any>>();
    const [loading, setLoading] = useState(true);

    console.log("process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID", process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID)

    const options: Web3AuthOptions = {
        clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
        web3AuthNetwork: 'testnet',
        // chainConfig: { chainNamespace: "eip155", chainId: '0x13881', rpcTarget: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_PROJECT_ID}` },
        chainConfig: {
            chainNamespace: "eip155",
            chainId: '0x7A69',
            rpcTarget: `http://127.0.0.1:8545/`
        }
    };

    const openloginAdapter = new OpenloginAdapter({ 
        clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || ""
    });

    const modalConfig = {};

    const web3AuthAdapter = new Web3AuthAdapter(options, [openloginAdapter], modalConfig);
  
    useEffect(() => {
      (async () => {
        setLoading(true);
        const safeAuth = await SafeAuthKit.init(web3AuthAdapter, {
             // Optional. Only if want to retrieve related safes
        });
        setSafeAuth(safeAuth);
        setLoading(false);
      })();
    }, []);
  
    return { safeAuth, loading };
};
  
export default useAuthKit;
  