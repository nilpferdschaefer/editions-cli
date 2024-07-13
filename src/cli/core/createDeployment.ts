export {};
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { createDeployment } from "../../sdk/editions/createDeployment";
import { Wallet as AnchorWallet, Program } from "@coral-xyz/anchor";
import fs from "fs";
import { Command } from "commander";
import { LibreWallet } from "../../anchor/LibreWallet";

const cli = new Command();

cli
  .version("1.0.0")
  .description("Add node id to the database")
  .requiredOption("-k, --keypairPath <keypairPath>", "Keypair")
  .requiredOption("-s, --symbol <symbol>", "Symbol")
  .requiredOption("-j, --jsonUrl <jsonUrl>", "Json URL")
  .requiredOption("-r, --rpc <rpc>", "RPC")
  .option("-n, --name <name>", "Name")
  .option("-mt, --maxTokens <maxTokens>", "Max tokens")
  .parse(process.argv);
// get all fair launches

const opts = cli.opts();

(async () => {

  const connection = new Connection(opts.rpc);

  
  const keyfile = JSON.parse(fs.readFileSync(opts.keypairPath, "utf8"));

  const signerKeypair = Keypair.fromSecretKey(new Uint8Array(keyfile));
  const wallet = new LibreWallet(signerKeypair);

  try {
    const {editionsPda} = await createDeployment({
      wallet,
      params: {
        symbol: opts.symbol,
        jsonUrl: opts.jsonUrl,
        maxTokens: opts.maxTokens ?? 0,
        name: opts.name ?? opts.symbol
      },
      connection,
    });

    console.log(`New edition id: ${editionsPda.toBase58()}`);
  } catch (e) {
    console.log({ e });
  }
})();
