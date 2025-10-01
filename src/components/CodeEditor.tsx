import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Rocket, Check } from "lucide-react";
import { toast } from "sonner";

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
}

const CodeEditor = ({ code, onCodeChange }: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contract.sol";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contract downloaded!");
  };

  const handleDeploy = () => {
    toast.info("Deploy feature coming soon! Connect your wallet and we'll help you deploy to Somnia testnet.");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Smart Contract Editor</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            onClick={handleDownload}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            onClick={handleDeploy}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Rocket className="h-4 w-4" />
            Deploy
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <Textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          className="h-full font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0 bg-input"
          spellCheck={false}
          style={{
            tabSize: 4,
            fontFamily: "'Fira Code', 'Courier New', monospace"
          }}
        />
      </div>

      <div className="p-2 border-t border-border bg-muted/50 text-xs text-muted-foreground flex items-center justify-between">
        <span>Solidity v0.8.0</span>
        <span>{code.split('\n').length} lines</span>
      </div>
    </div>
  );
};

export default CodeEditor;
