/**
 * @jest-environment jsdom
 */

import NnsTransactionCard from "$lib/components/accounts/NnsTransactionCard.svelte";
import { formatToken } from "$lib/utils/token.utils";
import { mapNnsTransaction } from "$lib/utils/transactions.utils";
import { render } from "@testing-library/svelte";
import {
  mockMainAccount,
  mockSubAccount,
} from "../../../mocks/accounts.store.mock";
import en from "../../../mocks/i18n.mock";
import {
  mockReceivedFromMainAccountTransaction,
  mockSentToSubAccountTransaction,
} from "../../../mocks/transaction.mock";

describe("NnsTransactionCard", () => {
  const renderTransactionCard = (
    account = mockMainAccount,
    transaction = mockReceivedFromMainAccountTransaction
  ) =>
    render(NnsTransactionCard, {
      props: {
        account,
        transaction,
      },
    });

  it("renders received headline", () => {
    const { container } = renderTransactionCard(
      mockSubAccount,
      mockReceivedFromMainAccountTransaction
    );

    expect(container.querySelector(".title")?.textContent).toBe(
      en.transaction_names.receive
    );
  });

  it("renders sent headline", () => {
    const { container } = renderTransactionCard(
      mockMainAccount,
      mockSentToSubAccountTransaction
    );

    expect(container.querySelector(".title")?.textContent).toBe(
      en.transaction_names.send
    );
  });

  it("renders transaction ICPs with - sign", () => {
    const account = mockMainAccount;
    const transaction = mockSentToSubAccountTransaction;
    const { getByTestId } = renderTransactionCard(account, transaction);
    const { displayAmount } = mapNnsTransaction({ account, transaction });

    expect(getByTestId("token-value")?.textContent).toBe(
      `-${formatToken({ value: displayAmount.toE8s(), detailed: true })}`
    );
  });

  it("renders transaction ICPs with + sign", () => {
    const account = mockSubAccount;
    const transaction = mockReceivedFromMainAccountTransaction;
    const { getByTestId } = renderTransactionCard(account, transaction);
    const { displayAmount } = mapNnsTransaction({ account, transaction });

    expect(getByTestId("token-value")?.textContent).toBe(
      `+${formatToken({ value: displayAmount.toE8s(), detailed: true })}`
    );
  });

  it("displays transaction date and time", () => {
    const { container } = renderTransactionCard(
      mockMainAccount,
      mockSentToSubAccountTransaction
    );

    expect(container.querySelector("p")?.textContent).toContain(
      "January 1, 1970"
    );
    expect(container.querySelector("p")?.textContent).toContain("12:00 AM");
  });

  it("displays identifier for reseived", () => {
    const { getByTestId } = renderTransactionCard(
      mockSubAccount,
      mockReceivedFromMainAccountTransaction
    );
    const identifier = getByTestId("identifier")?.textContent;

    expect(identifier).toContain(mockMainAccount.identifier);
    expect(identifier).toContain(en.wallet.direction_from);
  });

  it("displays identifier for sent", () => {
    const { getByTestId } = renderTransactionCard(
      mockMainAccount,
      mockSentToSubAccountTransaction
    );
    const identifier = getByTestId("identifier")?.textContent;

    expect(identifier).toContain(mockSubAccount.identifier);
    expect(identifier).toContain(en.wallet.direction_to);
  });
});
