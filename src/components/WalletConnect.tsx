import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Check } from "lucide-react";
import { toast } from "sonner";
import { BrowserProvider } from "ethers";

interface WalletConnectProps {
  onWalletConnected: (address: string, provider: BrowserProvider) => void;
}

const SOMNIA_MAINNET = {
  chainId: "0x13a7", // 5031
  chainName: "Somnia Mainnet",
  nativeCurrency: { name: "SOMI", symbol: "SOMI", decimals: 18 },
  rpcUrls: ["https://somnia-json-rpc.stakely.io"],
  blockExplorerUrls: ["https://explorer.somnia.network"]
};

const SOMNIA_TESTNET = {
  chainId: "0xc498", // 50312
  chainName: "Somnia Testnet (Shannon)",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: ["https://50312.rpc.thirdweb.com"],
  blockExplorerUrls: ["https://shannon-explorer.somnia.network"]
};

const WalletConnect = ({ onWalletConnected }: WalletConnectProps) => {
  const [address, setAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const addr = accounts[0].address;
          setAddress(addr);
          onWalletConnected(addr, provider);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const addSomniaNetwork = async (network: typeof SOMNIA_MAINNET | typeof SOMNIA_TESTNET) => {
    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [network]
      });
      return true;
    } catch (error: any) {
      console.error("Error adding network:", error);
      toast.error(`Failed to add ${network.chainName}`);
      return false;
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask not detected. Please install MetaMask.");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      
      setAddress(addr);
      onWalletConnected(addr, provider);
      
      // Add Somnia networks
      await addSomniaNetwork(SOMNIA_TESTNET);
      await addSomniaNetwork(SOMNIA_MAINNET);
      
      toast.success(`Connected: ${addr.slice(0, 6)}...${addr.slice(-4)}`);
    } catch (error: any) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  if (address) {
    return (
      <Button variant="outline" className="gap-2" disabled>
        <Check className="h-4 w-4 text-green-500" />
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={connectWallet} disabled={isConnecting} className="gap-2">
      <Wallet className="h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};

export default WalletConnect;
