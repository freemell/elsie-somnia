import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Coins, Image, Users, TrendingUp } from "lucide-react";

interface ContractTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

const ContractTemplates = ({ onSelectTemplate }: ContractTemplatesProps) => {
  const templates = [
    {
      id: "erc20",
      name: "ERC-20 Token",
      icon: Coins,
      description: "Fungible token standard"
    },
    {
      id: "nft",
      name: "NFT Contract",
      icon: Image,
      description: "ERC-721 collectibles"
    },
    {
      id: "dao",
      name: "DAO Governance",
      icon: Users,
      description: "Voting and proposals"
    },
    {
      id: "defi",
      name: "DeFi Staking",
      icon: TrendingUp,
      description: "Yield farming contract"
    }
  ];

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Quick Start Templates</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Button
              key={template.id}
              variant="outline"
              className="h-auto flex-col gap-2 p-3 hover:bg-primary/10 hover:border-primary transition-all"
              onClick={() => onSelectTemplate(template.id)}
            >
              <Icon className="h-5 w-5 text-primary" />
              <div className="text-center">
                <div className="text-xs font-medium">{template.name}</div>
                <div className="text-[10px] text-muted-foreground">{template.description}</div>
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default ContractTemplates;
