const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config();

// Connection profile and wallet paths from environment variables
const connectionProfilePath = process.env.CONNECTION_PROFILE_PATH || './connection-profiles/connection-org1.yaml';
const walletPath = process.env.WALLET_PATH || './wallet';

// Channel and chaincode configuration from environment variables
const channelName = process.env.CHANNEL_NAME || 'logchannel';
const chaincodeName = process.env.CHAINCODE_NAME || 'logging-chaincode';

// Organization configuration
const orgMsp = process.env.ORG_MSP || 'Org1MSP';
const orgName = process.env.ORG_NAME || 'org1.example.com';
const caName = process.env.CA_NAME || 'ca.org1.example.com';

// Admin credentials
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'adminpw';

/**
 * Load the connection profile from file
 */
const loadConnectionProfile = () => {
  try {
    let connectionProfile;
    const fileExtension = path.extname(connectionProfilePath);
    const filePath = path.resolve(connectionProfilePath);

    if (fileExtension === '.yaml' || fileExtension === '.yml') {
      // Load YAML connection profile
      const fileContents = fs.readFileSync(filePath, 'utf8');
      connectionProfile = yaml.load(fileContents);
    } else {
      // Load JSON connection profile
      connectionProfile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return connectionProfile;
  } catch (error) {
    console.error(`Error loading connection profile: ${error}`);
    throw error;
  }
};

/**
 * Build an in-memory CA client using the connection profile
 */
const buildCAClient = (connectionProfile) => {
  const caInfo = connectionProfile.certificateAuthorities[caName];
  if (!caInfo) {
    throw new Error(`CA information not found for ${caName}`);
  }
  
  const caTLSCACerts = caInfo.tlsCACerts.pem;
  const caClient = new FabricCAServices(
    caInfo.url, 
    { trustedRoots: caTLSCACerts, verify: caInfo.httpOptions.verify }, 
    caInfo.caName
  );
  
  console.log(`Built a CA Client named ${caInfo.caName}`);
  return caClient;
};

/**
 * Enroll an admin user and store credentials in the wallet
 */
const enrollAdmin = async () => {
  try {
    // Load the connection profile
    const connectionProfile = loadConnectionProfile();
    
    // Create a new file system based wallet for managing identities
    const wallet = await Wallets.newFileSystemWallet(path.resolve(walletPath));
    
    // Check if admin already exists in the wallet
    const adminIdentity = await wallet.get(adminUser);
    if (adminIdentity) {
      console.log('Admin identity already exists in the wallet');
      return true;
    }
    
    // Build a CA client
    const caClient = buildCAClient(connectionProfile);
    
    // Enroll the admin user
    const enrollment = await caClient.enroll({
      enrollmentID: adminUser,
      enrollmentSecret: adminPassword
    });
    
    // Create admin identity
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes()
      },
      mspId: orgMsp,
      type: 'X.509'
    };
    
    // Import the identity into the wallet
    await wallet.put(adminUser, x509Identity);
    console.log('Successfully enrolled admin user and imported it into the wallet');
    return true;
  } catch (error) {
    console.error(`Failed to enroll admin user: ${error}`);
    return false;
  }
};

/**
 * Register and enroll a new user with the CA
 */
const registerUser = async (userId) => {
  try {
    // Load the connection profile
    const connectionProfile = loadConnectionProfile();
    
    // Create a new file system based wallet for managing identities
    const wallet = await Wallets.newFileSystemWallet(path.resolve(walletPath));
    
    // Check if user already exists in the wallet
    const userIdentity = await wallet.get(userId);
    if (userIdentity) {
      console.log(`User identity for ${userId} already exists in the wallet`);
      return true;
    }
    
    // Check if admin exists in the wallet
    const adminIdentity = await wallet.get(adminUser);
    if (!adminIdentity) {
      console.log(`Admin identity not found in the wallet, enrolling admin first`);
      await enrollAdmin();
    }
    
    // Build a CA client
    const caClient = buildCAClient(connectionProfile);
    
    // Create a new gateway for connecting to the peer node
    const gateway = new Gateway();
    await gateway.connect(connectionProfile, {
      wallet,
      identity: adminUser,
      discovery: { enabled: true, asLocalhost: true }
    });
    
    // Register the user
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, adminUser);
    
    const secret = await caClient.register({
      affiliation: `${orgName}`,
      enrollmentID: userId,
      role: 'client'
    }, adminUser);
    
    // Enroll the user
    const enrollment = await caClient.enroll({
      enrollmentID: userId,
      enrollmentSecret: secret
    });
    
    // Create user identity
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes()
      },
      mspId: orgMsp,
      type: 'X.509'
    };
    
    // Import the identity into the wallet
    await wallet.put(userId, x509Identity);
    console.log(`Successfully registered and enrolled user ${userId} and imported it into the wallet`);
    
    // Disconnect from the gateway
    gateway.disconnect();
    
    return true;
  } catch (error) {
    console.error(`Failed to register user ${userId}: ${error}`);
    return false;
  }
};

/**
 * Connect to the gateway and return a contract instance
 */
const connectToContract = async (userId = adminUser) => {
  try {
    // Load the connection profile
    const connectionProfile = loadConnectionProfile();
    
    // Create a new file system based wallet for managing identities
    const wallet = await Wallets.newFileSystemWallet(path.resolve(walletPath));
    
    // Check if user exists in the wallet
    const userIdentity = await wallet.get(userId);
    if (!userIdentity) {
      console.log(`User identity for ${userId} not found in the wallet`);
      if (userId === adminUser) {
        console.log('Enrolling admin user...');
        await enrollAdmin();
      } else {
        console.log(`Registering and enrolling user ${userId}...`);
        await registerUser(userId);
      }
    }
    
    // Create a new gateway for connecting to the peer node
    const gateway = new Gateway();
    await gateway.connect(connectionProfile, {
      wallet,
      identity: userId,
      discovery: { enabled: true, asLocalhost: true }
    });
    
    // Get the network (channel) and contract
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);
    
    return { gateway, contract };
  } catch (error) {
    console.error(`Failed to connect to contract: ${error}`);
    throw error;
  }
};

module.exports = {
  enrollAdmin,
  registerUser,
  connectToContract
};
