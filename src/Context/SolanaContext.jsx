import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
// Default styles for wallet modal
import '@solana/wallet-adapter-react-ui/styles.css';

const SolanaContext = createContext();

export const SolanaProvider = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  const [wallet, setWallet] = useState(null);
  const [connected, setConnected] = useState(false);
  const [balance, setBalance] = useState(0);

  // Context value that will be supplied to components
  const value = {
    wallet,
    connected,
    balance,
    connectWallet: async () => {
      // This would trigger the wallet connection modal
      console.log('Connect wallet triggered');
    },
    disconnectWallet: () => {
      setWallet(null);
      setConnected(false);
      setBalance(0);
    },
    sendTransaction: async (transactionData) => {
      // Mock transaction - replace with actual Solana transaction
      console.log('Sending transaction:', transactionData);
      return 'mock-transaction-signature';
    },
    requestAirdrop: async () => {
      try {
        // Mock airdrop - in real app, this would be your airdrop service
        console.log('Requesting airdrop...');
        return { success: true, amount: 100 };
      } catch (error) {
        console.error('Airdrop failed:', error);
        return { success: false, error: error.message };
      }
    }
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <SolanaContext.Provider value={value}>
            {children}
          </SolanaContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const useSolana = () => {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error('useSolana must be used within a SolanaProvider');
  }
  return context;
};

// Wallet Connect Button Component
export const WalletConnectButton = () => {
  return (
    <div className="wallet-connect-container">
      <WalletMultiButton className="wallet-button" />
    </div>
  );
};