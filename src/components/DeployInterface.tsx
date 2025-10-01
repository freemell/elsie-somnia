import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BrowserProvider, ContractFactory } from "ethers";

interface DeployInterfaceProps {
  abi: any[] | null;
  bytecode: string | null;
  provider: BrowserProvider | null;
  onDeploySuccess: (address: string, abi: any[]) => void;
}

const DeployInterface = ({ abi, bytecode, provider, onDeploySuccess }: DeployInterfaceProps) => {
  const [network, setNetwork] = useState("testnet");
  const [constructorArgs, setConstructorArgs] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");

  const switchNetwork = async (chainId: string) => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }]
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        toast.error("Network not found. Please add it first.");
      } else {
        toast.error("Failed to switch network");
      }
      return false;
    }
  };

  const deployContract = async () => {
    if (!abi || !bytecode || !provider) {
      toast.error("Missing compilation artifacts or wallet connection");
      return;
    }

    setIsDeploying(true);
    try {
      // Switch to correct network
      const targetChainId = network === "testnet" ? "0xc498" : "0x13a7";
      const switched = await switchNetwork(targetChainId);
      if (!switched) {
        setIsDeploying(false);
        return;
      }

      // Parse constructor arguments
      const args = constructorArgs.trim() ? constructorArgs.split(",").map(arg => arg.trim()) : [];

      // Deploy contract
      const signer = await provider.getSigner();
      const factory = new ContractFactory(abi, bytecode, signer);
      
      toast.info("Deploying contract...");
      const contract = await factory.deploy(...args);
      
      toast.info("Waiting for confirmation...");
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      const deployTx = contract.deploymentTransaction();
      
      setDeployedAddress(address);
      setTxHash(deployTx?.hash || "");
      onDeploySuccess(address, abi);
      
      const explorerUrl = network === "testnet" 
        ? `https://shannon-explorer.somnia.network/tx/${deployTx?.hash}`
        : `https://explorer.somnia.network/tx/${deployTx?.hash}`;
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span>Contract deployed successfully!</span>
          <span className="text-xs">Address: {address}</span>
        </div>
      );
      
    } catch (error: any) {
      console.error("Deployment error:", error);
      if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Insufficient funds for deployment");
      } else if (error.code === "ACTION_REJECTED") {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(`Deployment failed: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const canDeploy = abi && bytecode && provider;

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Deploy Contract</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="network">Network</Label>
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger id="network">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="testnet">Somnia Testnet (Shannon)</SelectItem>
                <SelectItem value="mainnet">Somnia Mainnet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="constructor">Constructor Arguments (comma-separated)</Label>
            <Input
              id="constructor"
              placeholder="e.g., Hello World, 100, 0x..."
              value={constructorArgs}
              onChange={(e) => setConstructorArgs(e.target.value)}
            />
          </div>

          <Button
            onClick={deployContract}
            disabled={!canDeploy || isDeploying}
            className="w-full gap-2"
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Deploy to {network === "testnet" ? "Testnet" : "Mainnet"}
              </>
            )}
          </Button>

          {deployedAddress && (
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <div className="text-sm">
                <span className="font-medium">Contract Address:</span>
                <p className="break-all">{deployedAddress}</p>
              </div>
              {txHash && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const explorerUrl = network === "testnet"
                      ? `https://shannon-explorer.somnia.network/tx/${txHash}`
                      : `https://explorer.somnia.network/tx/${txHash}`;
                    window.open(explorerUrl, "_blank");
                  }}
                >
                  View on Explorer
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DeployInterface;
