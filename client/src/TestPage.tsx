import { useState, useEffect, useCallback, useMemo } from 'react'
import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
import {
  useWallets,
  useSignTransaction,
  useFundWallet,
} from '@privy-io/react-auth/solana'
import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js'
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor'
import toast, { Toaster } from 'react-hot-toast'
import IDL from './idl/valhalla.json'

// ── Addresses ────────────────────────────────────────────────────────────────
const PROG     = new PublicKey('F43KEBNRX7AkbAjvW4LQq9A698yrp6Uh6kDsKjfqAMXz')
const DELEG    = new PublicKey('DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh')
const MAGIC_P  = new PublicKey('Magic11111111111111111111111111111111111111')
const MAGIC_C  = new PublicKey('MagicContext1111111111111111111111111111111')

// ── Endpoints ────────────────────────────────────────────────────────────────
type Net = 'mainnet' | 'er' | 'tee'
const RPC: Record<Net, string> = {
  mainnet: import.meta.env.VITE_PROVIDER_ENDPOINT        ?? 'https://api.devnet.solana.com',
  er:      import.meta.env.VITE_EPHEMERAL_PROVIDER_ENDPOINT ?? 'https://devnet.magicblock.app',
  tee:     import.meta.env.VITE_TEE_PROVIDER_ENDPOINT    ?? 'https://devnet-tee.magicblock.app',
}

const conn = (net: Net) => new Connection(RPC[net], 'confirmed')

function explorerUrl(sig: string, net: Net) {
  if (net === 'mainnet') return `https://solscan.io/tx/${sig}?cluster=devnet`
  if (net === 'er')      return `${RPC.er}/tx/${sig}`
  return `${RPC.tee}/tx/${sig}`
}

// ── PDA helpers ───────────────────────────────────────────────────────────────
const pda = (seeds: (string | Uint8Array)[], prog = PROG) =>
  PublicKey.findProgramAddressSync(
    seeds.map(s => (typeof s === 'string' ? Buffer.from(s) : Buffer.from(s))),
    prog,
  )[0]

const p = (player: PublicKey) => ({
  profile:  pda(['profile',  player.toBuffer()]),
  map:      pda(['map',      player.toBuffer()]),
  storage:  pda(['storage',  player.toBuffer()]),
  vault:    pda(['vault',    player.toBuffer()]),
  barracks: pda(['barracks', player.toBuffer()]),
  upgrades: pda(['upgrades', player.toBuffer()]),
  spells:   pda(['spells',   player.toBuffer()]),
  builder:  (i: number) => pda(['builder', player.toBuffer(), Buffer.from([i])]),
  mine:     (i: number) => pda(['mine',    player.toBuffer(), Buffer.from([i])]),
  farm:     (i: number) => pda(['farm',    player.toBuffer(), Buffer.from([i])]),
  trainAuth:(nonce: bigint) => { const b = Buffer.allocUnsafe(8); b.writeBigUInt64LE(nonce); return pda(['train_auth', player.toBuffer(), b]) },
  battle:   pda(['battle',   player.toBuffer()]),
})

const dp = (account: PublicKey) => ({
  buf:  pda(['buffer',               account.toBuffer()], DELEG),
  rec:  pda(['delegation',           account.toBuffer()], DELEG),
  meta: pda(['delegation-metadata',  account.toBuffer()], DELEG),
})

// ── Anchor program builder ────────────────────────────────────────────────────
const mkProg = (net: Net, player: PublicKey): Program =>
  new Program(IDL as any, new AnchorProvider(conn(net), {
    publicKey: player,
    signTransaction: async (t: Transaction) => t,
    signAllTransactions: async (ts: Transaction[]) => ts,
  } as any, { commitment: 'confirmed' }))

// ── Sign + send ───────────────────────────────────────────────────────────────
async function send(
  tx: Transaction, net: Net, player: PublicKey,
  signTx: ReturnType<typeof useSignTransaction>['signTransaction'],
  wallet: any,
): Promise<string> {
  const c = conn(net)
  const { blockhash, lastValidBlockHeight } = await c.getLatestBlockhash()
  tx.recentBlockhash = blockhash
  tx.feePayer = player
  const raw = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
  const { signedTransaction } = await signTx({ transaction: new Uint8Array(raw), wallet })
  const sig = await c.sendRawTransaction(Buffer.from(signedTransaction))
  await c.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight })
  return sig
}

// ── Toast helpers ─────────────────────────────────────────────────────────────
const okToast = (label: string, sig: string, net: Net) =>
  toast.custom(t => (
    <div
      onClick={() => window.open(explorerUrl(sig, net), '_blank')}
      className={`cursor-pointer font-mono text-xs px-4 py-2 rounded border
        bg-black border-green-700 text-green-400 shadow-xl flex items-center gap-3
        ${t.visible ? 'opacity-100' : 'opacity-0'} transition-opacity`}
    >
      <span className="text-green-500">✓</span>
      <span className="text-green-600">{label}</span>
      <span className="text-green-400">{sig.slice(0, 12)}…</span>
      <span className="text-green-800 text-[10px]">[{net}] ↗</span>
    </div>
  ), { duration: 10_000 })

const errToast = (label: string, err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err)
  toast.custom(t => (
    <div className={`font-mono text-xs px-4 py-2 rounded border
      bg-black border-red-800 text-red-400 shadow-xl flex items-center gap-3 max-w-sm
      ${t.visible ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
      <span className="text-red-500">✗</span>
      <span className="text-red-600">{label}</span>
      <span className="text-red-400 truncate">{msg.slice(0, 80)}</span>
    </div>
  ), { duration: 10_000 })
}

// ── Types ─────────────────────────────────────────────────────────────────────
type FieldDef = { key: string; label: string; placeholder: string; default?: string }
type InstrDef = {
  key: string; label: string; cat: string; desc: string; net: Net; fields: FieldDef[]
  build: (prog: Program, player: PublicKey, v: Record<string, string>) => Promise<Transaction>
}

// ── All instructions ──────────────────────────────────────────────────────────
function allInstrs(): InstrDef[] {
  return [
    /* ── Profile ────────────────────────────────────────────────────────── */
    { key: 'initializePlayer', label: 'initializePlayer()', cat: 'PROFILE',
      desc: 'Create profile, map, storage, vault, barracks, upgrades, spells, builder0, builder1',
      net: 'mainnet', fields: [],
      build: async (prog, player) => {
        const pp = p(player)
        return prog.methods.initializePlayer().accounts({
          player, profile: pp.profile, map: pp.map, storage: pp.storage, vault: pp.vault,
          barracks: pp.barracks, upgrades: pp.upgrades, spells: pp.spells,
          builder0: pp.builder(0), builder1: pp.builder(1),
        }).transaction()
      },
    },
    { key: 'syncProfile', label: 'syncProfile()', cat: 'PROFILE',
      desc: 'Recompute tc_level / barracks_level / pop_cap from map after undelegate',
      net: 'mainnet', fields: [],
      build: async (prog, player) => {
        const pp = p(player)
        return prog.methods.syncProfile().accounts({ player, profile: pp.profile, map: pp.map }).transaction()
      },
    },

    /* ── Map ─────────────────────────────────────────────────────────────── */
    { key: 'saveMap', label: 'saveMap()', cat: 'MAP',
      desc: 'Write building layout on mainnet — 4 arrays of 50 u8 values',
      net: 'mainnet',
      fields: [
        { key: 'slotType',  label: 'slot_type[50]',  placeholder: '[0,0,…]', default: JSON.stringify(Array(50).fill(0)) },
        { key: 'slotLevel', label: 'slot_level[50]', placeholder: '[0,0,…]', default: JSON.stringify(Array(50).fill(0)) },
        { key: 'slotRow',   label: 'slot_row[50]',   placeholder: '[0,0,…]', default: JSON.stringify(Array(50).fill(0)) },
        { key: 'slotCol',   label: 'slot_col[50]',   placeholder: '[0,0,…]', default: JSON.stringify(Array(50).fill(0)) },
      ],
      build: async (prog, player, v) => {
        const pp = p(player); const j = (k: string) => JSON.parse(v[k] || '[]') as number[]
        return prog.methods.saveMap(j('slotType'), j('slotLevel'), j('slotRow'), j('slotCol'))
          .accounts({ player, profile: pp.profile, map: pp.map }).transaction()
      },
    },
    { key: 'delegateMap', label: 'delegateMap()', cat: 'MAP',
      desc: 'Delegate map to the ephemeral rollup for build-mode',
      net: 'mainnet', fields: [],
      build: async (prog, player) => {
        const pp = p(player); const d = dp(pp.map)
        return prog.methods.delegateMap().accounts({
          player, profile: pp.profile,
          bufferMap: d.buf, delegationRecordMap: d.rec, delegationMetadataMap: d.meta,
          map: pp.map, ownerProgram: PROG, delegationProgram: DELEG,
        }).transaction()
      },
    },
    { key: 'saveMapEr', label: 'saveMapEr()', cat: 'MAP',
      desc: 'Write building layout on ER (map must be delegated)',
      net: 'er',
      fields: [
        { key: 'slotType',  label: 'slot_type[50]',  placeholder: '[0,0,…]', default: JSON.stringify(Array(50).fill(0)) },
        { key: 'slotLevel', label: 'slot_level[50]', placeholder: '[0,0,…]', default: JSON.stringify(Array(50).fill(0)) },
        { key: 'slotRow',   label: 'slot_row[50]',   placeholder: '[0,0,…]', default: JSON.stringify(Array(50).fill(0)) },
        { key: 'slotCol',   label: 'slot_col[50]',   placeholder: '[0,0,…]', default: JSON.stringify(Array(50).fill(0)) },
      ],
      build: async (prog, player, v) => {
        const pp = p(player); const j = (k: string) => JSON.parse(v[k] || '[]') as number[]
        return prog.methods.saveMapEr(j('slotType'), j('slotLevel'), j('slotRow'), j('slotCol'))
          .accounts({ player, profile: pp.profile, map: pp.map }).transaction()
      },
    },
    { key: 'undelegateMap', label: 'undelegateMap()', cat: 'MAP',
      desc: 'Commit map state from ER → mainnet and release delegation',
      net: 'er', fields: [],
      build: async (prog, player) => {
        const pp = p(player)
        return prog.methods.undelegateMap().accounts({
          player, map: pp.map, magicProgram: MAGIC_P, magicContext: MAGIC_C,
        }).transaction()
      },
    },

    /* ── Economy ─────────────────────────────────────────────────────────── */
    { key: 'initMine', label: 'initMine(index)', cat: 'ECONOMY',
      desc: 'Create gold mine PDA for index 0–2',
      net: 'mainnet', fields: [{ key: 'index', label: 'index', placeholder: '0', default: '0' }],
      build: async (prog, player, v) => {
        const i = +v.index
        return prog.methods.initMine(i).accounts({ player, mine: p(player).mine(i) }).transaction()
      },
    },
    { key: 'initFarm', label: 'initFarm(index)', cat: 'ECONOMY',
      desc: 'Create food farm PDA for index 0–2',
      net: 'mainnet', fields: [{ key: 'index', label: 'index', placeholder: '0', default: '0' }],
      build: async (prog, player, v) => {
        const i = +v.index
        return prog.methods.initFarm(i).accounts({ player, farm: p(player).farm(i) }).transaction()
      },
    },
    { key: 'collectMine', label: 'collectMine()', cat: 'ECONOMY',
      desc: 'Harvest accrued gold from a mine into storage',
      net: 'mainnet', fields: [{ key: 'index', label: 'mine index', placeholder: '0', default: '0' }],
      build: async (prog, player, v) => {
        const pp = p(player); const i = +v.index
        return prog.methods.collectMine().accounts({ player, storage: pp.storage, mine: pp.mine(i) }).transaction()
      },
    },
    { key: 'harvestFood', label: 'harvestFood()', cat: 'ECONOMY',
      desc: 'Harvest accrued food from a farm into storage',
      net: 'mainnet', fields: [{ key: 'index', label: 'farm index', placeholder: '0', default: '0' }],
      build: async (prog, player, v) => {
        const pp = p(player); const i = +v.index
        return prog.methods.harvestFood().accounts({ player, storage: pp.storage, farm: pp.farm(i) }).transaction()
      },
    },
    { key: 'collectPort', label: 'collectPort()', cat: 'ECONOMY',
      desc: 'Harvest accrued gold from the port (mine index 3)',
      net: 'mainnet', fields: [{ key: 'index', label: 'port index', placeholder: '3', default: '3' }],
      build: async (prog, player, v) => {
        const pp = p(player); const i = +v.index
        return prog.methods.collectPort().accounts({ player, storage: pp.storage, port: pp.mine(i) }).transaction()
      },
    },

    /* ── Builder ─────────────────────────────────────────────────────────── */
    { key: 'startUpgrade', label: 'startUpgrade(slotIndex, catalogId)', cat: 'BUILDER',
      desc: 'Queue a building upgrade; deducts gold from storage',
      net: 'mainnet',
      fields: [
        { key: 'slotIndex',    label: 'slot_index',    placeholder: '0', default: '0' },
        { key: 'catalogId',    label: 'catalog_id',    placeholder: '1', default: '1' },
        { key: 'builderIndex', label: 'builder_index', placeholder: '0', default: '0' },
      ],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.startUpgrade(+v.slotIndex, +v.catalogId).accounts({
          player, profile: pp.profile, map: pp.map, storage: pp.storage, builder: pp.builder(+v.builderIndex),
        }).transaction()
      },
    },
    { key: 'completeUpgrade', label: 'completeUpgrade()', cat: 'BUILDER',
      desc: 'Finish a queued upgrade when timer expires',
      net: 'mainnet',
      fields: [
        { key: 'builderIndex', label: 'builder_index', placeholder: '0', default: '0' },
        { key: 'mineIndex',    label: 'mine_index (-1=none)', placeholder: '-1', default: '-1' },
        { key: 'farmIndex',    label: 'farm_index (-1=none)', placeholder: '-1', default: '-1' },
      ],
      build: async (prog, player, v) => {
        const pp = p(player); const mi = +v.mineIndex; const fi = +v.farmIndex
        return prog.methods.completeUpgrade().accounts({
          player, profile: pp.profile, map: pp.map, storage: pp.storage, barracks: pp.barracks,
          builder: pp.builder(+v.builderIndex),
          mine: mi >= 0 ? pp.mine(mi) : null,
          farm: fi >= 0 ? pp.farm(fi) : null,
        } as any).transaction()
      },
    },
    { key: 'cancelUpgrade', label: 'cancelUpgrade()', cat: 'BUILDER',
      desc: 'Cancel a pending upgrade and refund partial cost',
      net: 'mainnet',
      fields: [{ key: 'builderIndex', label: 'builder_index', placeholder: '0', default: '0' }],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.cancelUpgrade().accounts({
          player, storage: pp.storage, builder: pp.builder(+v.builderIndex),
        }).transaction()
      },
    },

    /* ── Shop ────────────────────────────────────────────────────────────── */
    { key: 'buyBuilding', label: 'buyBuilding(catalogId)', cat: 'SHOP',
      desc: 'Purchase a building from the market (requires market)',
      net: 'mainnet',
      fields: [{ key: 'catalogId', label: 'catalog_id', placeholder: '1', default: '1' }],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.buyBuilding(+v.catalogId).accounts({
          player, profile: pp.profile, storage: pp.storage,
        }).transaction()
      },
    },
    { key: 'buySpell', label: 'buySpell(spellType, quantity)', cat: 'SHOP',
      desc: 'Purchase spells from the market',
      net: 'mainnet',
      fields: [
        { key: 'spellType', label: 'spell_type', placeholder: '0', default: '0' },
        { key: 'quantity',  label: 'quantity',   placeholder: '1', default: '1' },
      ],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.buySpell(+v.spellType, +v.quantity).accounts({
          player, profile: pp.profile, storage: pp.storage, spells: pp.spells,
        }).transaction()
      },
    },
    { key: 'slotSpell', label: 'slotSpell(slot, spellType)', cat: 'SHOP',
      desc: 'Assign a spell to a battle slot (0–4)',
      net: 'mainnet',
      fields: [
        { key: 'slot',      label: 'slot',       placeholder: '0', default: '0' },
        { key: 'spellType', label: 'spell_type', placeholder: '0', default: '0' },
      ],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.slotSpell(+v.slot, +v.spellType).accounts({ player, spells: pp.spells }).transaction()
      },
    },
    { key: 'upgradeTroop', label: 'upgradeTroop(troopType)', cat: 'SHOP',
      desc: 'Unlock a permanent troop upgrade using gold',
      net: 'mainnet',
      fields: [{ key: 'troopType', label: 'troop_type', placeholder: '0', default: '0' }],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.upgradeTroop(+v.troopType).accounts({
          player, profile: pp.profile, storage: pp.storage, upgrades: pp.upgrades,
        }).transaction()
      },
    },

    /* ── Barracks ────────────────────────────────────────────────────────── */
    { key: 'authorizeTraining', label: 'authorizeTraining(troopType, qty, nonce, expiresIn)', cat: 'BARRACKS',
      desc: 'Burn gold+food on mainnet; create TrainingAuth PDA for private ER',
      net: 'mainnet',
      fields: [
        { key: 'troopType', label: 'troop_type',  placeholder: '0',    default: '0' },
        { key: 'quantity',  label: 'quantity',    placeholder: '10',   default: '10' },
        { key: 'nonce',     label: 'nonce (u64)', placeholder: '...',  default: Date.now().toString() },
        { key: 'expiresIn', label: 'expires_in',  placeholder: '3600', default: '3600' },
      ],
      build: async (prog, player, v) => {
        const pp = p(player); const nonce = BigInt(v.nonce ?? Date.now())
        return prog.methods.authorizeTraining(+v.troopType, +v.quantity, new BN(nonce.toString()), new BN(v.expiresIn ?? '3600'))
          .accounts({ player, profile: pp.profile, storage: pp.storage, auth: pp.trainAuth(nonce) }).transaction()
      },
    },
    { key: 'delegateBarracks', label: 'delegateBarracks()', cat: 'BARRACKS',
      desc: 'Delegate barracks to private ER for troop training',
      net: 'mainnet', fields: [],
      build: async (prog, player) => {
        const pp = p(player); const d = dp(pp.barracks)
        return prog.methods.delegateBarracks().accounts({
          player, bufferBarracks: d.buf, delegationRecordBarracks: d.rec,
          delegationMetadataBarracks: d.meta, barracks: pp.barracks,
          ownerProgram: PROG, delegationProgram: DELEG,
        }).transaction()
      },
    },
    { key: 'trainTroops', label: 'trainTroops()', cat: 'BARRACKS',
      desc: 'Consume a TrainingAuth nonce on private ER, add troops',
      net: 'er',
      fields: [{ key: 'nonce', label: 'nonce (matches auth)', placeholder: '0', default: '0' }],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.trainTroops().accounts({
          player, barracks: pp.barracks, auth: pp.trainAuth(BigInt(v.nonce ?? '0')),
        }).transaction()
      },
    },
    { key: 'markForBattle', label: 'markForBattle(battle_counts)', cat: 'BARRACKS',
      desc: 'Reserve troop subset for battle on private ER',
      net: 'er',
      fields: [{ key: 'counts', label: 'battle_counts[9]', placeholder: '[0,0,0,0,0,0,0,0,0]', default: '[0,0,0,0,0,0,0,0,0]' }],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.markForBattle(JSON.parse(v.counts ?? '[0,0,0,0,0,0,0,0,0]'))
          .accounts({ player, barracks: pp.barracks }).transaction()
      },
    },
    { key: 'commitBarracks', label: 'commitBarracks()', cat: 'BARRACKS',
      desc: 'Commit barracks state from private ER → mainnet',
      net: 'er', fields: [],
      build: async (prog, player) => {
        const pp = p(player)
        return prog.methods.commitBarracks().accounts({
          player, barracks: pp.barracks, magicProgram: MAGIC_P, magicContext: MAGIC_C,
        }).transaction()
      },
    },
    { key: 'undelegateBarracks', label: 'undelegateBarracks()', cat: 'BARRACKS',
      desc: 'Clear consumed_auths after commit (mainnet cleanup)',
      net: 'mainnet', fields: [],
      build: async (prog, player) => {
        const pp = p(player)
        return prog.methods.undelegateBarracks().accounts({ player, barracks: pp.barracks }).transaction()
      },
    },
    { key: 'deductDeployed', label: 'deductDeployed()', cat: 'BARRACKS',
      desc: 'Subtract battle_counts from troop counts after battle',
      net: 'mainnet', fields: [],
      build: async (prog, player) => {
        const pp = p(player)
        return prog.methods.deductDeployed().accounts({ player, barracks: pp.barracks }).transaction()
      },
    },
    { key: 'closeTrainingAuth', label: 'closeTrainingAuth()', cat: 'BARRACKS',
      desc: 'Reclaim rent from a used TrainingAuth PDA',
      net: 'mainnet',
      fields: [{ key: 'nonce', label: 'nonce', placeholder: '0', default: '0' }],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.closeTrainingAuth().accounts({
          player, auth: pp.trainAuth(BigInt(v.nonce ?? '0')),
        }).transaction()
      },
    },

    /* ── Battle ──────────────────────────────────────────────────────────── */
    { key: 'initializeSession', label: 'initializeSession()', cat: 'BATTLE',
      desc: 'Create battle session against a defender',
      net: 'mainnet',
      fields: [
        { key: 'defender', label: 'defender pubkey', placeholder: 'Base58...' },
        { key: 'defMine0', label: 'def mine0 (optional)', placeholder: 'leave empty to skip' },
        { key: 'defMine1', label: 'def mine1 (optional)', placeholder: 'leave empty to skip' },
        { key: 'defMine2', label: 'def mine2 (optional)', placeholder: 'leave empty to skip' },
      ],
      build: async (prog, player, v) => {
        const pp = p(player)
        const def = new PublicKey(v.defender)
        const dp2 = p(def)
        const mk = (s: string) => s.trim() ? new PublicKey(s.trim()) : null
        return prog.methods.initializeSession().accounts({
          attacker: player, attackerProfile: pp.profile,
          attackerBarracks: pp.barracks, attackerSpells: pp.spells,
          defenderProfile: dp2.profile, defenderStorage: dp2.storage,
          defenderMine0: mk(v.defMine0 ?? ''), defenderMine1: mk(v.defMine1 ?? ''),
          defenderMine2: mk(v.defMine2 ?? ''), session: pp.battle,
        } as any).transaction()
      },
    },
    { key: 'delegateSession', label: 'delegateSession()', cat: 'BATTLE',
      desc: 'Delegate battle session to public ER',
      net: 'mainnet', fields: [],
      build: async (prog, player) => {
        const pp = p(player); const d = dp(pp.battle)
        return prog.methods.delegateSession().accounts({
          attacker: player, bufferSession: d.buf,
          delegationRecordSession: d.rec, delegationMetadataSession: d.meta,
          session: pp.battle, ownerProgram: PROG, delegationProgram: DELEG,
        }).transaction()
      },
    },
    { key: 'spawnTroops', label: 'spawnTroops(troopType, count)', cat: 'BATTLE',
      desc: 'Deploy troops into battle session on ER',
      net: 'er',
      fields: [
        { key: 'troopType', label: 'troop_type', placeholder: '0', default: '0' },
        { key: 'count',     label: 'count',      placeholder: '5', default: '5' },
      ],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.spawnTroops(+v.troopType, +v.count).accounts({
          attacker: player, session: pp.battle,
        }).transaction()
      },
    },
    { key: 'useSpell', label: 'useSpell(slot)', cat: 'BATTLE',
      desc: 'Fire a slotted spell during battle on ER',
      net: 'er',
      fields: [{ key: 'slot', label: 'slot (0–4)', placeholder: '0', default: '0' }],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.useSpell(+v.slot).accounts({ attacker: player, session: pp.battle }).transaction()
      },
    },
    { key: 'endBattle', label: 'endBattle(stars, goldLooted, foodLooted)', cat: 'BATTLE',
      desc: 'Record battle result on ER',
      net: 'er',
      fields: [
        { key: 'stars',      label: 'stars (0–3)',      placeholder: '1',       default: '1' },
        { key: 'goldLooted', label: 'gold_looted (u64)', placeholder: '1000000', default: '1000000' },
        { key: 'foodLooted', label: 'food_looted (u64)', placeholder: '500000',  default: '500000' },
      ],
      build: async (prog, player, v) => {
        const pp = p(player)
        return prog.methods.endBattle(+v.stars, new BN(v.goldLooted ?? '1000000'), new BN(v.foodLooted ?? '500000'))
          .accounts({ attacker: player, session: pp.battle }).transaction()
      },
    },
    { key: 'settleBattle', label: 'settleBattle()', cat: 'BATTLE',
      desc: 'Commit loot to attacker vault; deduct from defender storage',
      net: 'mainnet',
      fields: [{ key: 'defender', label: 'defender pubkey', placeholder: 'Base58...' }],
      build: async (prog, player, v) => {
        const pp = p(player); const def = new PublicKey(v.defender)
        return prog.methods.settleBattle().accounts({
          attacker: player, attackerProfile: pp.profile, attackerVault: pp.vault,
          session: pp.battle, defenderStorage: p(def).storage,
        }).transaction()
      },
    },
    { key: 'claimLoot', label: 'claimLoot()', cat: 'BATTLE',
      desc: 'Transfer pending loot from vault into storage',
      net: 'mainnet', fields: [],
      build: async (prog, player) => {
        const pp = p(player)
        return prog.methods.claimLoot().accounts({ player, storage: pp.storage, vault: pp.vault }).transaction()
      },
    },
    { key: 'closeSession', label: 'closeSession()', cat: 'BATTLE',
      desc: 'Reclaim rent from the battle session PDA',
      net: 'mainnet', fields: [],
      build: async (prog, player) => {
        const pp = p(player)
        return prog.methods.closeSession().accounts({ attacker: player, session: pp.battle }).transaction()
      },
    },
  ]
}

// ── Terminal field ─────────────────────────────────────────────────────────────
function TField({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }) {
  const isArray = (def.default ?? '').startsWith('[')
  const cls = `bg-transparent border-b border-green-900 focus:border-green-500 outline-none
    text-green-300 font-mono text-xs w-full py-0.5 placeholder-green-900`
  return (
    <div className="flex items-start gap-2 py-0.5">
      <span className="text-green-700 text-xs font-mono shrink-0 w-36 truncate">{def.label}</span>
      <span className="text-green-800 text-xs shrink-0">:</span>
      {isArray ? (
        <textarea rows={2}
          className={`${cls} resize-none`}
          placeholder={def.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input type="text"
          className={cls}
          placeholder={def.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

// ── Terminal instruction card ─────────────────────────────────────────────────
const NET_BADGE: Record<Net, string> = {
  mainnet: 'text-blue-500 border-blue-900',
  er:      'text-purple-500 border-purple-900',
  tee:     'text-cyan-500 border-cyan-900',
}

function InstrCard({ def, player, signTx, wallet }: {
  def: InstrDef; player: PublicKey
  signTx: ReturnType<typeof useSignTransaction>['signTransaction']; wallet: any
}) {
  const [vals, setVals] = useState<Record<string, string>>(
    () => Object.fromEntries(def.fields.map(f => [f.key, f.default ?? '']))
  )
  const [net, setNet]     = useState<Net>(def.net)
  const [busy, setBusy]   = useState(false)
  const [lastSig, setLastSig] = useState<string | null>(null)

  const run = useCallback(async () => {
    setBusy(true)
    try {
      const prog = mkProg(net, player)
      const tx   = await def.build(prog, player, vals)
      const sig  = await send(tx, net, player, signTx, wallet)
      setLastSig(sig)
      okToast(def.key, sig, net)
    } catch (e) {
      console.error(e)
      errToast(def.key, e)
    } finally {
      setBusy(false)
    }
  }, [def, player, vals, net, signTx, wallet])

  return (
    <div className="border border-green-950 hover:border-green-800 transition-colors bg-[#050e05] rounded">
      {/* card header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-green-950">
        <span className="text-green-400 font-mono text-xs font-semibold">{def.label}</span>
        <select
          value={net}
          onChange={e => setNet(e.target.value as Net)}
          className={`text-[10px] font-mono bg-transparent border rounded px-1.5 py-0.5
            focus:outline-none cursor-pointer ${NET_BADGE[net]}`}
        >
          <option value="mainnet">mainnet</option>
          <option value="er">er</option>
          <option value="tee">tee</option>
        </select>
      </div>

      {/* desc */}
      <div className="px-3 py-1.5">
        <p className="text-green-800 text-[10px] font-mono"># {def.desc}</p>
      </div>

      {/* fields */}
      {def.fields.length > 0 && (
        <div className="px-3 pb-2 flex flex-col gap-0.5">
          {def.fields.map(f => (
            <TField key={f.key} def={f} value={vals[f.key] ?? ''} onChange={v => setVals(prev => ({ ...prev, [f.key]: v }))} />
          ))}
        </div>
      )}

      {/* run button */}
      <div className="px-3 pb-3 flex items-center justify-between gap-2">
        <button
          onClick={run}
          disabled={busy}
          className="flex items-center gap-1.5 bg-green-950 hover:bg-green-900 disabled:opacity-30
            disabled:cursor-not-allowed text-green-400 font-mono text-xs px-3 py-1.5 rounded
            border border-green-800 hover:border-green-600 transition-colors"
        >
          <span className="text-green-600">{busy ? '⟳' : '$'}</span>
          <span>{busy ? 'sending…' : 'run'}</span>
        </button>
        {lastSig && (
          <span
            className="text-green-800 font-mono text-[10px] cursor-pointer hover:text-green-600 truncate"
            onClick={() => window.open(explorerUrl(lastSig, net), '_blank')}
            title={lastSig}
          >
            ✓ {lastSig.slice(0, 16)}…↗
          </span>
        )}
      </div>
    </div>
  )
}

// ── Category nav ──────────────────────────────────────────────────────────────
const CATS = ['PROFILE', 'MAP', 'ECONOMY', 'BUILDER', 'SHOP', 'BARRACKS', 'BATTLE']

// ── Wallet status bar ─────────────────────────────────────────────────────────
function StatusBar({ player }: { player: PublicKey }) {
  const { fundWallet } = useFundWallet()
  const [bal, setBal] = useState<number | null>(null)
  const addr = player.toBase58()

  useEffect(() => {
    let dead = false
    const refresh = async () => {
      try { const b = await conn('mainnet').getBalance(player); if (!dead) setBal(b / LAMPORTS_PER_SOL) } catch {}
    }
    refresh()
    const id = setInterval(refresh, 15_000)
    return () => { dead = true; clearInterval(id) }
  }, [player])

  const copy = () => { navigator.clipboard.writeText(addr); toast('copied', { duration: 1000 }) }

  return (
    <div className="border-b border-green-950 px-4 py-2 flex items-center gap-4 flex-wrap">
      {bal !== null && bal < 0.05 && (
        <div className="flex items-center gap-3 text-yellow-600 font-mono text-xs">
          <span>⚠ low balance: {bal.toFixed(4)} SOL</span>
          <button
            onClick={() => fundWallet({ address: addr })}
            className="border border-yellow-800 hover:border-yellow-600 text-yellow-500
              px-2 py-0.5 rounded text-[10px] hover:text-yellow-400 transition-colors"
          >
            fund wallet
          </button>
        </div>
      )}
      <div className="flex items-center gap-3 ml-auto font-mono text-xs">
        <span className="text-green-900">wallet:</span>
        <span
          className="text-green-600 cursor-pointer hover:text-green-400 transition-colors"
          onClick={copy}
          title={addr}
        >
          {addr.slice(0, 8)}…{addr.slice(-6)}
        </span>
        <span className="text-green-900">|</span>
        <span className="text-green-700">{bal !== null ? `${bal.toFixed(4)} SOL` : '…'}</span>
        <button
          onClick={() => fundWallet({ address: addr })}
          className="text-green-900 hover:text-green-600 transition-colors"
        >
          [fund]
        </button>
      </div>
    </div>
  )
}

// ── Main console ──────────────────────────────────────────────────────────────
function Console() {
  const { ready, authenticated, login, logout } = usePrivy()
  const { wallets, ready: wReady } = useWallets()
  const { signTransaction: signTx } = useSignTransaction()
  const [cat, setCat] = useState('PROFILE')

  const wallet = wallets.find((w: any) => w.walletClientType === 'privy')
  const player = wallet ? new PublicKey(wallet.address) : null

  const instrs = useMemo(allInstrs, [])
  const visible = instrs.filter(i => i.cat === cat)

  /* ── boot screen ── */
  if (!ready || !wReady) return (
    <Screen>
      <Blink>initializing privy…</Blink>
    </Screen>
  )

  /* ── login screen ── */
  if (!authenticated) return (
    <Screen>
      <div className="text-green-600 text-xs mb-6 leading-relaxed">
        <p>╔══════════════════════════════════════╗</p>
        <p>║   VALHALLA DEV CONSOLE  v0.1.0       ║</p>
        <p>║   program: F43KEB…XZ                 ║</p>
        <p>╚══════════════════════════════════════╝</p>
      </div>
      <p className="text-green-700 text-xs font-mono mb-4"># authenticate to access the console</p>
      <button
        onClick={login}
        className="font-mono text-xs text-green-400 border border-green-800 hover:border-green-500
          hover:text-green-300 px-6 py-2 rounded transition-colors"
      >
        $ privy login
      </button>
    </Screen>
  )

  /* ── wallet not ready yet (privy is creating it) ── */
  if (!player) return (
    <Screen>
      <Blink>creating embedded wallet…</Blink>
      <p className="text-green-800 text-xs font-mono mt-2">
        # privy creates your solana wallet automatically
      </p>
    </Screen>
  )

  return (
    <div className="h-screen flex flex-col bg-black text-green-400 font-mono overflow-hidden">
      {/* ── top bar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-green-950">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-600 font-bold">VALHALLA</span>
          <span className="text-green-900">DEV CONSOLE</span>
          <span className="text-green-950">│</span>
          <span className="text-green-900 text-[10px]">program: {PROG.toBase58().slice(0, 8)}…</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-green-900 font-mono">
            rpc: {RPC.mainnet.replace('https://', '')}
          </span>
          <button
            onClick={logout}
            className="text-[10px] text-green-900 hover:text-red-600 transition-colors"
          >
            [logout]
          </button>
        </div>
      </div>

      {/* ── status bar ── */}
      <StatusBar player={player} />

      {/* ── category tabs ── */}
      <div className="flex gap-0 border-b border-green-950 px-4 overflow-x-auto shrink-0">
        {CATS.map(c => {
          const count = instrs.filter(i => i.cat === c).length
          const active = cat === c
          return (
            <button key={c} onClick={() => setCat(c)}
              className={`font-mono text-xs px-4 py-2 border-b-2 whitespace-nowrap transition-colors
                ${active
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-green-800 hover:text-green-600'}`}>
              {c}<span className="text-green-900 ml-1">({count})</span>
            </button>
          )
        })}
      </div>

      {/* ── instructions grid ── */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map(def => (
            <InstrCard key={def.key} def={def} player={player} signTx={signTx} wallet={wallet} />
          ))}
        </div>
      </div>

      {/* ── footer ── */}
      <div className="px-4 py-1.5 border-t border-green-950 flex gap-6 text-[10px] text-green-950">
        <span>mainnet:{RPC.mainnet}</span>
        <span>er:{RPC.er}</span>
        <span>tee:{RPC.tee}</span>
      </div>
    </div>
  )
}

/* helpers */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-black flex flex-col items-center justify-center gap-2 font-mono">
      {children}
    </div>
  )
}
function Blink({ children }: { children: React.ReactNode }) {
  return <p className="text-green-600 text-xs animate-pulse">&gt; {children}</p>
}

// ── Export (with PrivyProvider) ───────────────────────────────────────────────
export default function TestPage() {
  return (
    <PrivyProvider
      appId="cmpp3ts2200a40cl2ttcl6zdw"
      config={{
        loginMethods: ['email'],
        embeddedWallets: { solana: { createOnLogin: 'all-users' } } as any,
      }}
    >
      <Console />
      <Toaster position="bottom-right" containerStyle={{ fontFamily: 'monospace' }} />
    </PrivyProvider>
  )
}
