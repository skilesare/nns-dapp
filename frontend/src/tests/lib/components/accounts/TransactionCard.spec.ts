/**
 * @jest-environment jsdom
 */

import TransactionCard from "$lib/components/accounts/TransactionCard.svelte";
import { formatToken } from "$lib/utils/token.utils";
import { render } from "@testing-library/svelte";
import en from "../../../mocks/i18n.mock";
import {
  mockTransactionReceiveDataFromMain,
  mockTransactionSendDataFromMain,
} from "../../../mocks/transaction.mock";

describe("TransactionCard", () => {
  const renderTransactionCard = (
    transaction = mockTransactionSendDataFromMain
  ) =>
    render(TransactionCard, {
      props: {
        transaction,
      },
    });

  it("renders received headline", () => {
    const { container } = renderTransactionCard(
      mockTransactionReceiveDataFromMain
    );

    expect(container.querySelector(".title")?.textContent).toBe(
      en.transaction_names.receive
    );
  });

  it("renders sent headline", () => {
    const { container } = renderTransactionCard(
      mockTransactionSendDataFromMain
    );

    expect(container.querySelector(".title")?.textContent).toBe(
      en.transaction_names.send
    );
  });

  it("renders transaction ICPs with - sign", () => {
    const { getByTestId } = renderTransactionCard(
      mockTransactionSendDataFromMain
    );

    expect(getByTestId("token-value")?.textContent).toBe(
      `-${formatToken({
        value: mockTransactionSendDataFromMain.displayAmount.toE8s(),
        detailed: true,
      })}`
    );
  });

  it("renders transaction ICPs with + sign", () => {
    const { getByTestId } = renderTransactionCard(
      mockTransactionReceiveDataFromMain
    );

    expect(getByTestId("token-value")?.textContent).toBe(
      `+${formatToken({
        value: mockTransactionReceiveDataFromMain.displayAmount.toE8s(),
        detailed: true,
      })}`
    );
  });

  it("displays transaction date and time", () => {
    const { container } = renderTransactionCard(
      mockTransactionSendDataFromMain
    );

    expect(container.querySelector("p")?.textContent).toContain(
      "March 14, 2021 12:00 AM"
    );
    expect(container.querySelector("p")?.textContent).toContain("12:00 AM");
  });

  it("displays identifier for received", () => {
    const { getByTestId } = renderTransactionCard(
      mockTransactionReceiveDataFromMain
    );
    const identifier = getByTestId("identifier")?.textContent;

    expect(identifier).toContain(mockTransactionReceiveDataFromMain.from);
    expect(identifier).toContain(en.wallet.direction_from);
  });

  it("displays identifier for sent", () => {
    const { getByTestId } = renderTransactionCard(
      mockTransactionSendDataFromMain
    );
    const identifier = getByTestId("identifier")?.textContent;

    expect(identifier).toContain(mockTransactionSendDataFromMain.to);
    expect(identifier).toContain(en.wallet.direction_to);
  });
});
