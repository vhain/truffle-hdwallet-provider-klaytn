const inherits = require("util").inherits;
const Subprovider = require("./subprovider.js");

// wraps a provider in a subprovider interface

module.exports = ProviderSubprovider;

inherits(ProviderSubprovider, Subprovider);

function ProviderSubprovider(provider) {
  if (!provider) throw new Error("ProviderSubprovider - no provider specified");
  this.provider = provider;
}

function isHexStrict(hex) {
  return (
    (typeof hex === "string" || typeof hex === "number") &&
    /^(-)?0x[0-9a-f]*$/i.test(hex)
  );
}

/**
 * Upon EIP-2718, `type` field is reserved to represent TransactionType of typed transaction
 * envelope (see [this](https://eips.ethereum.org/EIPS/eip-2718)).
 *
 * This function mutates given result and rename unsafe `result.type` to
 * `result.klaytnTransactionType`.
 *
 * @param result inside response object
 * @returns result
 */
function safelyRenameKlaytnTransactionType(result) {
  if (!result) return result;
  if (!result.type) return result;
  if (typeof result.type !== "string") return result;
  if (isHexStrict(result.type)) return result;

  result.klaytnTransactionType = result.type;
  delete result.type;

  return result;
}

ProviderSubprovider.prototype.handleRequest = function (payload, next, end) {
  this.provider.send(payload, function (err, response) {
    if (err) return end(err);
    // if (response.error) return end(new Error(response.error.message))

    // rename response.result.type to something else
    safelyRenameKlaytnTransactionType(response.result);

    end(null, response.result);
  });
};
