const { ethers } = require('ethers');

async function main() {
    const privateKey = '2CE46A1C3B5E5F73EDB79C343BB869EF94709E6BEBB3B29B70937D7B5C6D5751';
    const rpcUrl = 'https://evmrpc-testnet.0g.ai';
    const contractAddress = '0x4e4158DF35CfdC0ac63264D3E112F5B8E9a5c569'; // testnetDev fine-tuning
    const providerAddress = '0x1F0E3DA33725B7f0CF427B0Fb2b9F1Ce76b230A4';
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('Owner address:', wallet.address);
    
    // ABI for acknowledgeTEESignerByOwner
    const abi = [
        'function acknowledgeTEESignerByOwner(address provider) external',
        'function getService(address provider) view returns (tuple(address provider, string url, tuple(uint256 cpuCount, uint256 nodeMemory, uint256 gpuCount, uint256 nodeStorage, string gpuType) quota, uint256 pricePerToken, bool occupied, string[] models, address teeSignerAddress, bool teeSignerAcknowledged))',
        'function owner() view returns (address)'
    ];
    
    const contract = new ethers.Contract(contractAddress, abi, wallet);
    
    // Check owner
    const owner = await contract.owner();
    console.log('Contract owner:', owner);
    console.log('Is owner?', owner.toLowerCase() === wallet.address.toLowerCase());
    
    // Check current state
    console.log('\n=== Before acknowledgement ===');
    const serviceBefore = await contract.getService(providerAddress);
    console.log('Provider:', serviceBefore.provider);
    console.log('TEE Signer:', serviceBefore.teeSignerAddress);
    console.log('TEE Signer Acknowledged:', serviceBefore.teeSignerAcknowledged);
    
    if (serviceBefore.teeSignerAcknowledged) {
        console.log('\nTEE Signer already acknowledged!');
        return;
    }
    
    // Acknowledge TEE signer
    console.log('\n=== Acknowledging TEE Signer ===');
    const tx = await contract.acknowledgeTEESignerByOwner(providerAddress);
    console.log('Transaction hash:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    // Check state after
    console.log('\n=== After acknowledgement ===');
    const serviceAfter = await contract.getService(providerAddress);
    console.log('TEE Signer Acknowledged:', serviceAfter.teeSignerAcknowledged);
}

main().catch(console.error);
