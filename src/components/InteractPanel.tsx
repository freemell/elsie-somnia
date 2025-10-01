import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Eye } from "lucide-react";
import { toast } from "sonner";
import { BrowserProvider, Contract } from "ethers";

interface InteractPanelProps {
  contractAddress: string;
  abi: any[];
  provider: BrowserProvider;
}

const InteractPanel = ({ contractAddress, abi, provider }: InteractPanelProps) => {
  const [functionInputs, setFunctionInputs] = useState<Record<string, string[]>>({});
  const [functionOutputs, setFunctionOutputs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const readFunctions = abi.filter(
    (item) => item.type === "function" && (item.stateMutability === "view" || item.stateMutability === "pure")
  );

  const writeFunctions = abi.filter(
    (item) => item.type === "function" && item.stateMutability !== "view" && item.stateMutability !== "pure"
  );

  const callReadFunction = async (func: any) => {
    setLoading({ ...loading, [func.name]: true });
    try {
      const contract = new Contract(contractAddress, abi, provider);
      const inputs = functionInputs[func.name] || [];
      const result = await contract[func.name](...inputs);
      
      setFunctionOutputs({ ...functionOutputs, [func.name]: result.toString() });
      toast.success(`${func.name} executed successfully`);
    } catch (error: any) {
      console.error("Read error:", error);
      toast.error(`Failed to call ${func.name}: ${error.message}`);
    } finally {
      setLoading({ ...loading, [func.name]: false });
    }
  };

  const callWriteFunction = async (func: any) => {
    setLoading({ ...loading, [func.name]: true });
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, abi, signer);
      const inputs = functionInputs[func.name] || [];
      
      toast.info(`Sending transaction for ${func.name}...`);
      const tx = await contract[func.name](...inputs);
      
      toast.info("Waiting for confirmation...");
      await tx.wait();
      
      toast.success(`${func.name} executed successfully!`);
    } catch (error: any) {
      console.error("Write error:", error);
      if (error.code === "ACTION_REJECTED") {
        toast.error("Transaction rejected by user");
      } else {
        toast.error(`Failed to execute ${func.name}: ${error.message}`);
      }
    } finally {
      setLoading({ ...loading, [func.name]: false });
    }
  };

  const updateInput = (funcName: string, index: number, value: string) => {
    const inputs = functionInputs[funcName] || [];
    inputs[index] = value;
    setFunctionInputs({ ...functionInputs, [funcName]: inputs });
  };

  const renderFunction = (func: any, isWrite: boolean) => (
    <Card key={func.name} className="p-4 space-y-3">
      <h4 className="font-medium">{func.name}</h4>
      
      {func.inputs && func.inputs.length > 0 && (
        <div className="space-y-2">
          {func.inputs.map((input: any, i: number) => (
            <div key={i}>
              <Label className="text-xs">
                {input.name || `arg${i}`} ({input.type})
              </Label>
              <Input
                placeholder={input.type}
                value={functionInputs[func.name]?.[i] || ""}
                onChange={(e) => updateInput(func.name, i, e.target.value)}
                className="text-sm"
              />
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={() => isWrite ? callWriteFunction(func) : callReadFunction(func)}
        disabled={loading[func.name]}
        size="sm"
        className="w-full gap-2"
        variant={isWrite ? "default" : "outline"}
      >
        {isWrite ? <Play className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        {loading[func.name] ? "Processing..." : isWrite ? "Execute" : "Query"}
      </Button>

      {functionOutputs[func.name] !== undefined && (
        <div className="p-2 bg-muted rounded text-xs break-all">
          <span className="font-medium">Result:</span> {functionOutputs[func.name]}
        </div>
      )}
    </Card>
  );

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Interact with Contract</h3>
      
      <Tabs defaultValue="read">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="read">Read ({readFunctions.length})</TabsTrigger>
          <TabsTrigger value="write">Write ({writeFunctions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="read">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {readFunctions.length > 0 ? (
                readFunctions.map((func) => renderFunction(func, false))
              ) : (
                <p className="text-sm text-muted-foreground">No read functions available</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="write">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {writeFunctions.length > 0 ? (
                writeFunctions.map((func) => renderFunction(func, true))
              ) : (
                <p className="text-sm text-muted-foreground">No write functions available</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default InteractPanel;
