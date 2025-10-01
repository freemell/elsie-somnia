import elsieLogo from "@/assets/elsie-logo.png";
import WalletConnect from "./WalletConnect";
import { BrowserProvider } from "ethers";

interface HeaderProps {
  onWalletConnected: (address: string, provider: BrowserProvider) => void;
}

const Header = ({ onWalletConnected }: HeaderProps) => {

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

        <WalletConnect onWalletConnected={onWalletConnected} />
      </div>
    </header>
  );
};

export default Header;
