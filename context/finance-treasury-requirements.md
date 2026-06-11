# Finance & Treasury: Requirements Checklist

This is a guide for the questions the Engagement Manager should cover with the team's Finance and Treasury leadership, typically after initial scoping (Step 3 of `/start-session`) but before the sequence moves into implementation. These questions are PSP-agnostic and apply to any engagement.

It is not mandatory to answer all questions. Partial answers are useful and can be revisited later. Ask conversationally, skip anything not relevant to this engagement (e.g., marketplace payout questions do not apply to a non-Connect integration), and record answers in `outputs/<short-engagement-name>-finance-treasury-requirements.md`.

Frame the fee reconciliation conversation as a data fidelity problem rather than a billing dispute. Instead of asking whether the bill can be reconciled, describe the Data Warehouse ETL pipeline being built and ask what raw, transaction-level data is required from Day 1 to match the invoice and automate month-end close.

During the review stage and at Implementation Brief time, the `finance-treasury` sub-agent checks the integration plan and decisions against the answers recorded here.

## I. Fee Transparency & Reconciliation

These questions ensure the integration captures fee data at the granularity finance needs for an Interchange Plus (IC+) model.

- How is transaction-level fee granularity received? (Is there an API or report mapping every transaction to its specific Interchange Category, Scheme Fee, and Platform Markup, rather than relying on summary invoices?)
- How does the PSP distinguish "Pass-Through" costs from "Markup"? (Is there a data field identifying which portion is the raw network cost and which is the PSP's margin, for internal audit?)
- What is the protocol for "Reconciliation Delta" investigation? (What is the acceptable variance between the calculated fee and the invoice, and what is the process for querying raw logs to resolve discrepancies?)
- How are "Scheme Fee" changes communicated and updated in raw data extracts? (How does the internal fee-modeling tool stay synchronized as card schemes update their rates?)
- Does reporting isolate "Currency Conversion" markups? (Can FX fees be distinguished from standard card scheme fees to accurately calculate the cost of payments per region?)

## II. Ledger, Accounting & Mapping

These questions ensure the PSP's financial data maps cleanly into the general ledger and ERP.

- What is the mapping schema between the PSP's payout report and the general ledger? (How are processing fees, interchange, and net settlement split in the ERP?)
- How is "Net vs. Gross" accounting handled? (Does the PSP deduct fees before depositing funds, and if so, what data feed is needed to gross up revenue in the books?)
- How are "in-flight" transactions accounted for at month-end? (What logic is required to accrue for transactions that occurred but have not yet settled into the bank account?)
- How is exception reporting handled in the ledger? (When the PSP's report does not match the order database, what is the automated workflow for identifying and correcting the discrepancy?)
- What are the audit trail requirements? (For SOX/internal audit, what logs must be stored to prove a payout was authorized and paid to the correct beneficiary?)

## III. Treasury, FX & Liquidity

These questions cover currency exposure, cash positioning, and reserve handling.

- How is the multi-currency bank account structure architected? (Are dedicated accounts needed with the PSP to avoid unnecessary FX conversion, or does the PSP convert to a single settlement currency automatically?)
- What is the FX gain/loss recognition policy? (Does the FX rate need to be tracked at the time of sale versus the time of settlement for every transaction?)
- What is the liquidity forecasting requirement? (How frequently must the PSP push settlement data to accurately forecast the daily cash position?)
- How are rolling reserves handled? (Does the PSP require a percentage of cash held in a reserve account, and if so, how is this tracked as a restricted asset in the books?)
- How are intercompany settlements managed? (If operating across multiple legal entities, how are payouts split between HQ and regional/branch entities automatically?)

## IV. Platform/Marketplace & Governance

These questions apply where marketplace, split-payment, or tax-reporting flows are in scope.

- How are split payments handled for marketplace commissions? (Does the PSP support automated payout splitting, or does the platform need to calculate and instruct disbursements manually via API?)
- What data is required for seller payouts? (Which tax/KYC fields must be sent to the PSP and stored for compliance?)
- How are dispute and chargeback deductions managed? (How does the PSP deduct dispute funds from the payout pool, and how is this reflected in the seller's ledger?)
- What is the VAT/sales tax data requirement? (Which transaction tags are mandatory to ensure the PSP reports the correct tax rate to local authorities?)
- What is the financial kill switch requirement? (If a systemic error in pricing or tax calculation is detected, how quickly can checkout be disabled via a financial flag?)

## Output

1. Record answers (even partial) in `outputs/<short-engagement-name>-finance-treasury-requirements.md`, grouped under the same four headings.
2. Mark unanswered items `[Open]` rather than guessing.
3. Reference this file when the `finance-treasury` sub-agent is invoked during reviews and at Implementation Brief time.
