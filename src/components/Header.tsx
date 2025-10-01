import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import elsieLogo from "@/assets/elsie-logo.png";

const Header = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");

  const connectWallet = async () => {
    try {
      const ethereum = (window as any).ethereum;
      if (ethereum) {
        const accounts = await ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setAddress(accounts[0]);
        setIsConnected(true);
        toast.success("Wallet connected successfully!");
      } else {
        toast.error("Please install MetaMask to connect your wallet");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      toast.error("Failed to connect wallet");
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={elsieLogo} 
            alt="Elsie AI Logo" 
            className="h-10 w-10 animate-pulse"
            style={{ filter: "drop-shadow(var(--glow-primary))" }}
          />
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
              Elsie
            </h1>
            <p className="text-xs text-muted-foreground">AI Assistant for Somnia</p>
          </div>
        </div>

        <Button 
          onClick={connectWallet}
          variant={isConnected ? "secondary" : "default"}
          className="gap-2"
        >
          <Wallet className="h-4 w-4" />
          {isConnected 
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : "Connect Wallet"
          }
        </Button>
      </div>
    </header>
  );
};

export default Header;
