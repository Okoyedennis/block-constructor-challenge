// Import the 'fs' module to read files
const fs = require("fs");

// Function to read and parse the mempool CSV file
const readMempoolFile = (filename) => {
  // Read the file content synchronously
  const data = fs.readFileSync(filename, "utf-8");
  // Initialize an empty object to store transactions
  const transactions = {};
  // Split the data into lines and trim each line
  const content = data.split("\n").map((item) => item.trim());

  // Loop through each line and parse transaction details
  content.forEach((line) => {
    const [txid, fee, weight, parentTxids] = line.split(",");
    // Store transaction details in the transactions object
    transactions[txid] = {
      fee: Number(fee),
      weight: Number(weight),
      parents: parentTxids ? new Set(parentTxids.split(",")) : null,
    };
  });

  return transactions;
};

// Function to find the transaction with the maximum fee
const getMaxFee = (transactions, validTransactions) => {
  // Initialize the variable to store the transaction with the maximum fee
  let maxTransactionFee = null;

  // Iterate through transactions to find the one with the highest fee
  for (const [txid, data] of Object.entries(transactions)) {
    if (!validTransactions.has(txid)) {
      // Check if all parent transactions are already included
      const parentData = data.parents
        ? [...data.parents].every((parent) => validTransactions.has(parent))
        : true;

      // Update maxTransactionFee if conditions are met
      if (
        parentData &&
        (maxTransactionFee === null ||
          data.fee > transactions[maxTransactionFee].fee)
      ) {
        maxTransactionFee = txid;
      }
    }
  }

  return maxTransactionFee;
};

// Function to construct a valid block of transactions
const validBlock = (filename) => {
  // Read the mempool CSV file and get the transactions
  const data = readMempoolFile(filename);

  // Initialize a set to store valid transactions
  const validTransactions = new Set();

  // Initialize an array to store transaction IDs in order
  let transactionBlocks = [];
  let newTransactionMaxFee = "";

  // Continue adding transactions with the highest fees until no more can be added
  do {
    newTransactionMaxFee = getMaxFee(data, validTransactions);
    if (newTransactionMaxFee) {
      // Add the new transaction to the set of valid transactions
      validTransactions.add(newTransactionMaxFee);
      // Add the new transaction to the array of transaction IDs
      transactionBlocks.push(newTransactionMaxFee);
    }
  } while (newTransactionMaxFee);

  // Filter out transactions without parents (orphan transactions)
  transactionBlocks = transactionBlocks.filter(
    (value) => data[value].parents !== null
  );

  return transactionBlocks;
};

// Function to print the sorted mempool
function sortMempool(param) {
  const result = validBlock(param);
  console.log(result);
  return result;
}

// Usage example: Sort and print the mempool from the specified filename
const filename = "./mempool.csv";
sortMempool(filename);
