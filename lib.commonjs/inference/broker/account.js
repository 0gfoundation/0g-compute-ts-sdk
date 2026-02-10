"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountProcessor = void 0;
const base_1 = require("./base");
const utils_1 = require("../../common/utils");
/**
 * AccountProcessor contains methods for creating, depositing funds, and retrieving 0G Serving Accounts.
 */
class AccountProcessor extends base_1.ZGServingUserBrokerBase {
    async getAccount(provider) {
        try {
            return await this.contract.getAccount(provider);
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async getAccountWithDetail(provider) {
        try {
            const [account, lockTime] = await Promise.all([
                this.contract.getAccount(provider),
                this.contract.lockTime(),
            ]);
            const now = BigInt(Math.floor(Date.now() / 1000));
            // Use validRefundsLength to determine valid refunds
            // Valid refunds are in range [0, validRefundsLength)
            const validRefundsLength = Number(account.validRefundsLength);
            const refunds = account.refunds
                .slice(0, validRefundsLength) // Only consider valid refunds
                .filter((refund) => refund.amount !== BigInt(0))
                .map((refund) => ({
                amount: refund.amount,
                remainTime: lockTime - (now - refund.createdAt),
            }));
            return [account, refunds];
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
    async listAccount() {
        try {
            return await this.contract.listAccount();
        }
        catch (error) {
            (0, utils_1.throwFormattedError)(error);
        }
    }
}
exports.AccountProcessor = AccountProcessor;
//# sourceMappingURL=account.js.map