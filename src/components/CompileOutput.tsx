import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface CompileResult {
  success: boolean;
  abi?: any[];
  bytecode?: string;
  errors?: string[];
  warnings?: string[];
  gasEstimate?: number;
}

interface CompileOutputProps {
  result: CompileResult | null;
}

const CompileOutput = ({ result }: CompileOutputProps) => {
  if (!result) {
    return (
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Compile your contract to see results here
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="abi">ABI</TabsTrigger>
          <TabsTrigger value="bytecode">Bytecode</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-2">
          {result.success ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Compilation successful! Contract is ready to deploy.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Compilation failed. Check the Issues tab for details.
              </AlertDescription>
            </Alert>
          )}
          
          {result.gasEstimate && (
            <div className="text-sm">
              <span className="font-medium">Estimated Gas:</span> {result.gasEstimate.toLocaleString()}
            </div>
          )}
        </TabsContent>

        <TabsContent value="abi">
          <ScrollArea className="h-[300px]">
            <pre className="text-xs bg-muted p-3 rounded">
              {JSON.stringify(result.abi, null, 2)}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="bytecode">
          <ScrollArea className="h-[300px]">
            <pre className="text-xs bg-muted p-3 rounded break-all whitespace-pre-wrap">
              {result.bytecode}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="issues">
          <ScrollArea className="h-[300px] space-y-2">
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  Errors
                </h4>
                {result.errors.map((error, i) => (
                  <Alert key={i} variant="destructive">
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            
            {result.warnings && result.warnings.length > 0 && (
              <div className="space-y-1 mt-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-yellow-500" />
                  Warnings
                </h4>
                {result.warnings.map((warning, i) => (
                  <Alert key={i}>
                    <AlertDescription className="text-xs">{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            
            {(!result.errors || result.errors.length === 0) && 
             (!result.warnings || result.warnings.length === 0) && (
              <p className="text-sm text-muted-foreground">No issues found</p>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default CompileOutput;
