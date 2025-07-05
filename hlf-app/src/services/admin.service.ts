import { connectGateway } from '@/lib/gateway';

export async function initLedger(identityLabel: string) {
  const gateway = await connectGateway(identityLabel);
  const network = gateway.getNetwork('mychannel');
  const contract = network.getContract('admincontract');

  const result = await contract.submitTransaction('initLedger');
  await gateway.close();
  return result.toString();
}