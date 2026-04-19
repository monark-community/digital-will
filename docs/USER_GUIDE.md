# WillChain User Guide

Welcome to WillChain! This guide explains what the application does and how to use it. WillChain helps you create, deploy, and manage your will as a secure digital document on the blockchain.

---

## What is WillChain?

WillChain is a platform that allows you to:

- **Draft a will** — Create your digital will with details about what you want to happen after you pass away
- **Deploy it securely** — Store your will on the blockchain so no one can lose it or tamper with it
- **Add trusted people** — Invite family members or friends (called "secondary members") to help validate and execute your will
- **Manage your will** — Update details, add or remove people, or cancel your will anytime
- **Execution by secondary members** — After the protection period ends and death is confirmed, your secondary members can execute your will to distribute assets according to your wishes

---

## Getting Started

### 1. Sign In with Your Wallet

When you first visit WillChain, you'll need a **wallet**. A wallet is like a digital purse that securely holds your identity on the blockchain. Most people use **MetaMask**, a browser extension that makes this easy.

**Steps:**

1. Install the [MetaMask browser extension](https://metamask.io/) if you don't have it
2. Create a wallet in MetaMask (or use an existing one)
3. Go to WillChain and click **Sign In**
4. MetaMask will ask you to sign a message — this proves you own the wallet without sharing any password
5. If this is your first time, you'll be asked to create an account with your name and email

### 2. Add Your Wallets

You must use MetaMask to sign in and interact with WillChain. You can add multiple wallet addresses to your profile:

- Go to the **Wallets** section
- Click **Add Wallet**
- Use MetaMask to sign a message from the new address
- Give it a label (e.g., "Personal Wallet", "Hardware Wallet") so you remember what it's for

Later, when you create a will, you can choose which wallet to use as the **will owner**.

### 3. Build Your Contact List

Before creating a will, it's helpful to add people you trust to your contact list:

- Go to **Contacts**
- Click **Add Contact**
- Enter their name, email, phone number, and wallet address
- Save it

This contact list will make it easier when you invite secondary members to your will (see below).

---

## Creating and Managing a Will

### Step 1: Create a Draft

A **draft will** is a will that only you can see. You can edit it as many times as you want before deploying it.

**To create a draft:**

1. Go to **My Wills**
2. Click **Create New Will**
3. Give your will a name (e.g., "My Estate Plan")
4. Set the **security period** — this is how long you want to wait after someone declares you have passed away before the will is executed. You can set a minimum and maximum time.
5. Click **Save Draft**

### Step 2: Add Secondary Members

**Secondary members** are people who will help execute your will. They might be family members, lawyers, or trusted friends. Think of them as executors.

**To add secondary members:**

1. Open your draft will
2. Click **Add Secondary Members**
3. Select people from your contact list, or enter their details manually
4. Assign them any relevant information
5. Save

You can add or remove secondary members at any time while your will is still a draft.

### Step 3: Deploy Your Will

Once you're happy with your draft, you can **deploy** it to the blockchain. This stores your will on the blockchain so no one can lose it or tamper with it.

**To deploy:**

1. Open your draft will
2. Review all the details one final time
3. Click **Deploy to Blockchain**
4. MetaMask will ask you to confirm the transaction
5. You'll need a small amount of test ETH to pay the gas fee (the cost of recording it on the blockchain)
6. Once confirmed, your will is now live!

---

## Managing Your Deployed Will

### As the Will Owner

Once your will is deployed, you can:

- **Fund your will** — Add tokens (in the form of assets on the blockchain) that will be distributed when the will is executed
- **Withdraw funds** — Take back any tokens you've added. Once the protection period ends, they are locked in the will.
- **Prove you're alive** — If someone incorrectly declares that you've passed away, you can veto the declaration and prove you're still alive by signing a transaction
- **Update secondary members** — Add, remove, or change secondary members and their voting weights
- **Change the security period** — Adjust the protection period duration
- **Cancel your will** — Remove the will entirely from the blockchain (you can do this at any time)

> **Note:** Any change to your deployed will requires your MetaMask signature and costs a small gas fee (the blockchain transaction cost). Keep in mind: **once the protection period has ended, no action can be performed** — your will becomes immutable.

### As a Secondary Member

If someone has invited you to be a secondary member of their will, you can:

- **Refuse the invitation** — If you don't want to be a secondary member, you can refuse the request when you receive it
- **View the will** — See the details of the will you've been invited to
- **Validate the will** — Confirm that you agree to help execute it
- **Withdraw from the will** — If you've already accepted but change your mind, you can withdraw as a secondary member **as long as the protection period has not ended**. Once the protection period ends, you cannot withdraw
- **Declare the owner's death** — If you believe the will owner has passed away, you can declare it. When you do this, the **protection period starts**. The other secondary members can also declare the death to accelerate the protection period. The more people who declare the death, the faster the protection period completes
- **Execute the will** — Once the protection period has elapsed and enough secondary members have declared the death, you can execute the will and trigger the asset distribution. The funds are converted to USDC stablecoins and locked in the will account. The subsequent transfer of funds to the designated beneficiaries is handled through notaries and legal procedures (planned for future phases)

---

## Real-Time Notifications

WillChain keeps you informed with **notifications**:

- When someone adds you as a secondary member
- When the death of a will owner is declared
- When the protection period is ending
- When a will is executed
- When other important events happen

You can view these notifications in the app at any time. If you prefer, you can also opt-in to receive **email notifications** so you don't miss important updates.

---

## Account Settings

### Email Preferences

Go to your **Profile** and toggle email notifications on or off. You'll control what types of emails you want to receive about your wills and responsibilities.

### Delete Your Account

You can delete your account anytime, but only if:

- You don't own any active (non-canceled) wills
- You're not a secondary member of any active wills

Once these conditions are met, the app will let you delete your account permanently.

---

## Understanding the Will Lifecycle

Your will goes through these stages:

1. **Draft** — You're editing it, everything is private and changeable. You can add, update, or remove secondary members at this stage. Since your draft is not on the blockchain yet, no signatures or gas fees are required — you can edit freely as many times as you want.

2. **Deployed** — Your will is live on the blockchain and secondary members are notified. You can still modify everything (name, secondary members, voting weights, funds) and you keep full control — **until the protection period ends**.
   - **Status: Inactive** — At least one secondary member has not yet validated and approved their participation
   - **Status: Active** — All secondary members have validated and approved their participation

3. **Death Declared** — A secondary member has declared that you've passed away. **The protection period starts at this moment.** You can still veto the declaration and prove you're alive if it's incorrect.

4. **Protection Period Active** — A countdown timer is active, starting from the **maximum security period** you set and decreasing based on secondary members' declaration weights. The more secondary members who declare your death, the faster this period counts down. To make modifications to your will during this period, you must first **veto the death declaration** to prove you're alive. Once you veto, a **3-day cooldown period** begins during which secondary members cannot declare your death again, giving you time to edit your will. **After the veto cooldown ends**, secondary members can re-declare your death.

5. **Executable** — Enough secondary members have agreed and the protection period has elapsed. The will is now ready to be executed and assets can be swapped.

6. **Executed** — The will has been executed and all assets have been swapped to stable coins.

7. **Canceled** — You canceled the will before it was executed. All funds are returned to you.

---

## Security & Privacy

- **Your identity is your wallet** — Everything you do is signed with your wallet, proving it's really you
- **Blockchain immutability** — Once the protection period ends, your will cannot be edited or deleted by anyone, not even WillChain — it's permanently locked on the blockchain. While the protection period is active, you have full control to modify your will.
- **Protected by time** — The protection period ensures there's time for multiple people to agree before anything happens
- **Email notification opt-in** — You control whether you receive emails; we never send unsolicited messages

---

## Frequently Asked Questions

**Can I edit my will after I deploy it?**

Yes! You can modify almost everything in your deployed will **as long as the protection period has not ended**:

- Change the will name
- Add or remove secondary members
- Change secondary members' voting weights
- Update the security period
- Fund or withdraw funds
- Modify any other will details

Once the protection period ends, your will becomes immutable and cannot be modified. 

**What if I'm offline when something happens to my will?**

All notifications are stored in the app. When you sign back in, you'll see everything that happened while you were away. Optionally, you can also receive email notifications.

**Do I need to know about cryptocurrency?**

Not really! WillChain handles the blockchain details for you. You just interact with a normal web app. The "blockchain" part just means your will is permanently stored and can't be changed.

**What is the protection period for?**

The protection period gives secondary members time to agree and ensures no hasty decisions are made. It corresponds to the time that the implicated users must wait before executing the will, and it is defined via the predicted execution time. It's a safety feature to protect the will owner's legacy.

The protection period has a **minimum** and **maximum duration** that you set:

- The secondary members involved in the contract can never wait more than **maximum duration** and less than **minimum duration**. In other words, they must wait at least **minimum period** before executing the contract starting from the moment of the first declaration. 
- As more secondary members declare your death, the waiting period **decreases** proportionally based on their voting weights compared to the total of weights. This is why despite a first declaration, voting weights are already considered and the security period is always less than **maximum duration**
- Once **all secondary members have declared**, the predicted execution time moves to **first declaration time** + **minimum duration**
- Once the remaining time until execution shown in the interface reaches zero (the predicted execution time has been passed), the will becomes executable

**Can I have multiple wills?**

Yes! You can create multiple wills at different times. Each one is independent and can have different secondary members or asset distributions.

**Can I have multiple deployed wills with the same wallet?**

Yes! You can deploy multiple wills from the same wallet address. Each will is independent and can have different secondary members, funding amounts, and configurations.

**What if I lose access to my wallet?**

If you lose your wallet, you can add a new wallet to your WillChain account and use that for future actions. However, any wills associated with the lost wallet will still be visible to you, but you **cannot perform any actions on them** — since every action (modifying, funding, veto, etc.) requires your wallet signature. If you need to make changes to those wills, you'll need to recover access to the original wallet.

---

## Need Help?

For technical issues or questions about how to use WillChain, please reach out to our support team. We're here to help!

---

**Thank you for using WillChain to secure your legacy.**
