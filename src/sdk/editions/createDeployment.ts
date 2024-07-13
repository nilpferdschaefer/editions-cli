import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  PublicKey
} from "@solana/web3.js";
import BN from "bn.js";

import { TOKEN_2022_PROGRAM_ID } from "spl-token-4";
import { getProgramInstanceEditions } from "../../anchor/editions/getProgramInstanceEditions";
import { getEditionsPda } from "../../anchor/editions/pdas/getEditionsPda";
import { IExecutorParams } from "../../cli/IExecutorParams";
import { sendSignedTransaction } from "../tx_utils";
import { getHashlistPda } from "../../anchor/editions/pdas/getHashlistPda";

export const PROGRAM_ID_GROUP_EXTENSIONS = new PublicKey("TGRPp2mDGxSyH3We9hH8pwcmhajtszPAvWjVdVgsPa5");

export interface IInitializeLaunch {
  symbol: string;
  jsonUrl: string;
  maxTokens?: number;
  name?: string;
}

export const createDeployment = async ({
  wallet,
  params,
  connection,
}: IExecutorParams<IInitializeLaunch>) => {

  const {
    symbol,
    jsonUrl,
    maxTokens,
    name
  } = params;

  const editionProgram = getProgramInstanceEditions(connection);

  const editionsPda = getEditionsPda(symbol);

  const groupMint = Keypair.generate();
  const group = Keypair.generate();

  console.log({groupMint: groupMint.publicKey.toBase58()})

  const hashlist = getHashlistPda(editionsPda)[0];

  const instructions: TransactionInstruction[] = [];

  console.log({ editionsDeployment: editionsPda.toBase58(),
    hashlist: hashlist.toBase58(),
    payer: wallet.publicKey.toBase58(),
    creator: wallet.publicKey.toBase58(),
    groupMint: groupMint.publicKey.toBase58(),
    group: group.publicKey.toBase58(),
    systemProgram: SystemProgram.programId.toBase58(),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
    groupExtensionProgram: PROGRAM_ID_GROUP_EXTENSIONS.toBase58()})
  /// creates an open editions launch
  instructions.push(
    await editionProgram.methods
      .initialise({
        maxNumberOfTokens: maxTokens ? new BN(maxTokens) : new BN(0), // 0 means open edition i.e. no max tokens
        symbol,
        name: name ? name : symbol,
        offchainUrl: jsonUrl, // this points to ERC721 compliant JSON metadata
        creatorCosignProgramId: null,
      })
      .accounts({
        editionsDeployment: editionsPda,
        hashlist,
        payer: wallet.publicKey,
        creator: wallet.publicKey,
        groupMint: groupMint.publicKey,
        group: group.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        groupExtensionProgram: PROGRAM_ID_GROUP_EXTENSIONS
      })
      .signers([groupMint, group])
      .instruction()
  );

  // transaction boilerplate - ignore for now
  const tx = new Transaction().add(...instructions);
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.feePayer = wallet.publicKey;
  tx.sign(groupMint, group);
  await wallet.signTransaction(tx);

  const txid = await sendSignedTransaction({
    signedTransaction: tx,
    connection,
    skipPreflight: false
  });;

  return {editionsPda}
};
