# Elsie Somnia 

**Elsie Somnia** is an intelligent AI-powered smart contract development platform designed specifically for the Somnia blockchain. Built with modern web technologies, it provides an intuitive chat interface for generating, editing, and deploying Solidity smart contracts with AI assistance.

##  Features

###  AI-Powered Code Generation
- **Intelligent Chat Interface**: Describe your smart contract requirements in natural language
- **Real-time Code Generation**: Watch as Elsie generates Solidity code in real-time
- **Context-Aware Responses**: Maintains conversation context for iterative development
- **Somnia-Optimized**: Specialized for Somnia blockchain's high-throughput capabilities

### Advanced Code Editor
- **Monaco Editor Integration**: Professional code editing experience with syntax highlighting
- **Live Compilation**: Real-time Solidity compilation with error detection
- **Code Templates**: Pre-built contract templates for common use cases
- **Export Options**: Download contracts as `.sol` files

###  Blockchain Integration
- **Wallet Connection**: Seamless integration with Web3 wallets
- **Somnia Testnet Support**: Deploy directly to Somnia testnet
- **Transaction Management**: Handle deployments and interactions
- **Gas Optimization**: Built-in gas estimation and optimization

### Modern UI/UX
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Dark/Light Themes**: Customizable interface themes
- **Component Library**: Built with shadcn/ui for consistent design
- **Real-time Updates**: Live collaboration and instant feedback

##  Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **Monaco Editor** - VS Code's editor in the browser
- **Ethers.js** - Ethereum library for blockchain interactions

### Backend & AI
- **Supabase** - Backend-as-a-Service for authentication and database
- **Supabase Edge Functions** - Serverless functions for AI integration
- **Lovable AI Gateway** - AI model integration
- **Google Gemini 2.5 Flash** - Advanced AI model for code generation

### Blockchain
- **Somnia Blockchain** - High-performance EVM-compatible L1
- **Solidity ^0.8.0** - Smart contract programming language
- **OpenZeppelin** - Secure smart contract libraries

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- A modern web browser with Web3 wallet support (MetaMask, etc.)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/elsie-somnia.git
   cd elsie-somnia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to see Elsie Somnia in action!

##  Usage

### 1. Chat with Elsie
- Open the chat interface on the left side
- Describe what you want to build (e.g., "Create an ERC-20 token with minting capabilities")
- Watch as Elsie generates the complete Solidity contract

### 2. Edit and Customize
- Use the code editor on the right to modify generated code
- Real-time syntax highlighting and error detection
- Copy, download, or share your contracts

### 3. Deploy to Somnia
- Connect your Web3 wallet
- Deploy directly to Somnia testnet
- Interact with your deployed contracts

## Project Structure

```
elsie-somnia/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ChatInterface.tsx
│   │   ├── CodeEditor.tsx
│   │   └── ...
│   ├── pages/              # Application pages
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── integrations/       # External service integrations
├── supabase/
│   └── functions/          # Edge functions for AI integration
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Somnia Blockchain Features

Elsie Somnia is optimized for Somnia's unique capabilities:

- **High Throughput**: >1,000,000 TPS support
- **Sub-second Finality**: ~400ms block time
- **Ultra-low Fees**: Optimized for frequent transactions
- **Reactive Capabilities**: Advanced event indexing
- **EVM Compatibility**: Full Ethereum compatibility

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Somnia](https://somnia.network/) - The high-performance blockchain platform
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract libraries
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Lovable](https://lovable.dev/) - AI-powered development platform

## 📞 Support

- **Documentation**: [docs.elsie-somnia.com](https://docs.elsie-somnia.com)
- **Discord**: [Join our Discord](https://discord.gg/elsie-somnia)
- **Twitter**: [@ElsieSomnia](https://twitter.com/ElsieSomnia)
- **Issues**: [GitHub Issues](https://github.com/your-username/elsie-somnia/issues)

---

**Built with ❤️ for the Somnia ecosystem**
