import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Hammer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import { BrowserProvider } from "ethers";
import CompileOutput from "./CompileOutput";
import DeployInterface from "./DeployInterface";
import InteractPanel from "./InteractPanel";
import { fetchAndLoadSolc } from "web-solc";

interface CodeEditorEnhancedProps {
  code: string;
  onCodeChange: (code: string) => void;
  provider: BrowserProvider | null;
}

interface CompileResult {
  success: boolean;
  abi?: any[];
  bytecode?: string;
  errors?: string[];
  warnings?: string[];
  gasEstimate?: number;
}

const CodeEditorEnhanced = ({ code, onCodeChange, provider }: CodeEditorEnhancedProps) => {
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [deployedContract, setDeployedContract] = useState<{ address: string; abi: any[] } | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contract.sol";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Contract downloaded!");
  };

  const compileContract = async () => {
    setIsCompiling(true);
    let solcInstance: any = null;
    
    try {
      toast.info("Loading Solidity compiler...");
      
      // Fetch and load the Solidity compiler for browser (returns WebSolc instance)
      solcInstance = await fetchAndLoadSolc("0.8.26");
      
      // Extract contract name from code
      const contractNameMatch = code.match(/contract\s+(\w+)/);
      const contractName = contractNameMatch ? contractNameMatch[1] : "Contract";
      const fileName = `${contractName}.sol`;

      // Prepare input for solc
      const input = {
        language: "Solidity",
        sources: {
          [fileName]: {
            content: code
          }
        },
        settings: {
          outputSelection: {
            "*": {
              "*": ["abi", "evm.bytecode", "evm.gasEstimates"]
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      };

      toast.info("Compiling contract...");
      
      // Compile using the WebSolc instance
      const output = await solcInstance.compile(input);

      // Process compilation results
      const errors: string[] = [];
      const warnings: string[] = [];

      if (output.errors) {
        output.errors.forEach((error: any) => {
          const message = `${error.severity}: ${error.message}`;
          if (error.severity === "error") {
            errors.push(message);
          } else {
            warnings.push(message);
          }
        });
      }

      if (errors.length > 0) {
        setCompileResult({
          success: false,
          errors,
          warnings
        });
        toast.error("Compilation failed. Check the output for details.");
        return;
      }

      // Extract compiled contract
      const contract = output.contracts[fileName][contractName];
      
      if (!contract) {
        toast.error("Contract not found in compilation output");
        return;
      }

      const result: CompileResult = {
        success: true,
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
        warnings,
        gasEstimate: contract.evm.gasEstimates?.creation?.totalCost
      };

      setCompileResult(result);
      toast.success("Contract compiled successfully!");
    } catch (error: any) {
      console.error("Compilation error:", error);
      setCompileResult({
        success: false,
        errors: [error.message || "Unknown compilation error"]
      });
      toast.error("Compilation failed");
    } finally {
      // Clean up the web worker
      if (solcInstance && typeof solcInstance.stopWorker === 'function') {
        solcInstance.stopWorker();
      }
      setIsCompiling(false);
    }
  };

  const lineCount = code.split("\n").length;
  const canCompile = code.includes("pragma solidity");
  const canDeploy = compileResult?.success && compileResult.abi && compileResult.bytecode;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Editor Card */}
      <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Smart Contract Editor</h2>
            <p className="text-xs text-muted-foreground">
              {lineCount} lines | Solidity ^0.8.0
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={compileContract}
              disabled={!canCompile || isCompiling}
              size="sm"
              className="gap-2"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Compiling...
                </>
              ) : (
                <>
                  <Hammer className="h-4 w-4" />
                  Compile
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-[400px]">
          <Editor
            height="400px"
            defaultLanguage="sol"
            value={code}
            onChange={(value) => onCodeChange(value || "")}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on"
            }}
          />
        </div>
      </div>

      {/* Compilation Output */}
      {compileResult && <CompileOutput result={compileResult} />}

      {/* Deploy Interface */}
      {canDeploy && (
        <DeployInterface
          abi={compileResult.abi || null}
          bytecode={compileResult.bytecode || null}
          provider={provider}
          onDeploySuccess={(address, abi) => setDeployedContract({ address, abi })}
        />
      )}

      {/* Interact Panel */}
      {deployedContract && provider && (
        <InteractPanel
          contractAddress={deployedContract.address}
          abi={deployedContract.abi}
          provider={provider}
        />
      )}
    </div>
  );
};

export default CodeEditorEnhanced;
