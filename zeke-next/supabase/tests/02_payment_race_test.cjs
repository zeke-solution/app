// Proves the `for update` lock in mark_payment_sent_transaction actually
// serialises two brands hitting "mark payment sent" on the same deal at the
// same instant. Without the lock, both sessions would read status
// 'link_submitted', both would pass the checks, and the second would blow up
// on the payments_one_per_deal unique index with a raw 23505 instead of a
// clean 'already_sent'/'wrong_status'.
const { Client } = require("pg");

const CFG = { host: "127.0.0.1", port: 55432, user: "postgres", database: "zeke" };
const BRAND = "22222222-2222-2222-2222-222222222222";
const CREATOR = "11111111-1111-1111-1111-111111111111";
const DEAL = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function asBrand(c) {
  await c.query("set local role authenticated");
  await c.query(`set local request.jwt.claims = '{"sub":"${BRAND}"}'`);
}

(async () => {
  const setup = new Client(CFG);
  await setup.connect();
  await setup.query("delete from public.deals where id = $1", [DEAL]);
  await setup.query(
    `insert into public.deals (id, brand_id, influencer_id, title, amount, status)
     values ($1, $2, $3, 'Race Deal', 5000, 'link_submitted')`,
    [DEAL, BRAND, CREATOR]
  );
  await setup.end();

  const a = new Client(CFG);
  const b = new Client(CFG);
  await a.connect();
  await b.connect();

  // A opens a transaction and calls the function, taking the deal row lock,
  // but does not commit yet.
  await a.query("begin");
  await asBrand(a);
  const ra = await a.query("select public.mark_payment_sent_transaction($1, 5000) as r", [DEAL]);
  console.log(`A (holds lock, uncommitted): ${JSON.stringify(ra.rows[0].r)}`);

  // B tries the same while A still holds the lock. This must BLOCK, not race.
  await b.query("begin");
  await asBrand(b);
  let bDone = false;
  const bPromise = b
    .query("select public.mark_payment_sent_transaction($1, 5000) as r", [DEAL])
    .then((res) => { bDone = true; return { ok: true, r: res.rows[0].r }; })
    .catch((e) => { bDone = true; return { ok: false, code: e.code, msg: e.message }; });

  await sleep(600);
  console.log(`B after 600ms while A holds lock: ${bDone ? "RETURNED (not blocked!)" : "still blocked (correct)"}`);

  await a.query("commit");
  const rb = await bPromise;
  await b.query("commit").catch(() => {});
  console.log(`B after A committed: ${JSON.stringify(rb)}`);

  const check = new Client(CFG);
  await check.connect();
  const pays = await check.query("select count(*)::int n from public.payments where deal_id=$1", [DEAL]);
  const deal = await check.query("select status from public.deals where id=$1", [DEAL]);
  console.log(`\npayments rows for deal: ${pays.rows[0].n} (must be 1)`);
  console.log(`deal status: ${deal.rows[0].status} (must be payment_sent)`);

  const clean =
    pays.rows[0].n === 1 &&
    deal.rows[0].status === "payment_sent" &&
    rb.ok === true &&
    rb.r !== null;
  console.log(
    clean
      ? "\nRESULT: PASS - lock serialised the race, B got a clean error code, exactly one payment."
      : `\nRESULT: FAIL - ${JSON.stringify(rb)}`
  );

  await check.end();
  await a.end();
  await b.end();
})();
