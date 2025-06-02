import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, type FC, type JSX } from "react";
import { BettingService, type BetResult } from "../classes/BettingService";
import { UtilsManager } from "../classes/UtilsManager";
import type { Market } from "../types";

type Side = "back" | "lay";

interface EnginePayload {
  amount: number;
  side: Side;
  market_id: number;
  wallet_address: string;
}

const BettingSlipCard: FC<{
  market: Market;
  setShow: (arg: boolean) => void;
}> = ({ market, setShow }) => {
  const [curSide, setSide] = useState<Side>("back");
  const [amount, setAmount] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = (): void => {
    setIsClosing(true);
    setTimeout(() => {
      setShow(false);
    }, 300);
  };

  const formatOdds = (numerator: number, denominator: number): string => {
    return `${numerator}/${denominator}`;
  };

  const calculatePayout = (
    stake: number,
    numerator: number,
    denominator: number
  ): number => {
    return stake * (numerator / denominator);
  };

  const calculateTotalReturn = (
    stake: number,
    numerator: number,
    denominator: number
  ): number => {
    return stake + calculatePayout(stake, numerator, denominator);
  };

  const numericAmount = parseFloat(amount) || 0;

  const payout = calculatePayout(
    numericAmount,
    market.numerator,
    market.denominator
  );

  const totalReturn = calculateTotalReturn(
    numericAmount,
    market.numerator,
    market.denominator
  );

  const sanitizeInput = (value: string) => /^\d*\.?\d*$/.test(value.trim());

  async function sendToEngine(payload: EnginePayload): Promise<boolean> {
    try {
      const rsp = await fetch(UtilsManager.BASE_URL + "/bet/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!rsp.ok) throw new Error(`An error occured ${rsp.status}`);
      return true;
    } catch (error) {
      setError("Failed to send bet to engine. Please try again.");
      return false;
    }
  }

  async function handleFormSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!sanitizeInput(amount)) {
      setError("Please enter a valid amount.");
      (e.target as HTMLFormElement).reset();
      return;
    }

    const bs = new BettingService();
    const formData: EnginePayload = {
      amount: Number.parseFloat(amount),
      side: curSide,
      market_id: market.market_id,
      wallet_address: await bs.connectToMetaMask(),
    };

    const result: BetResult = await bs.placeBet(market.market_id, "1000");

    if (!result.success) {
      setError("Failed to place bet. Please try again.");
      return;
    }

    await sendToEngine(formData);
    handleClose();
  }

  function renderCardContent(): JSX.Element {
    return (
      <>
        <div className="flex justify-end p-1">
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors hover:cursor-pointer"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        {/* Market Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">MV</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{market.title}</h4>
              <p className="text-sm text-gray-500">category</p>
            </div>
            <div className="text-right">
              <div className="bg-white px-3 py-1 rounded-lg border border-gray-200">
                <span className="text-lg font-mono font-bold text-gray-900">
                  {formatOdds(market.numerator, market.denominator)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bet Type Selection */}
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bet Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide("back")}
                className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                  curSide === "back"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <ArrowTrendingUpIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Back</div>
                  <div className="text-xs opacity-75">Bet on win</div>
                </div>
              </button>

              <button
                onClick={() => setSide("lay")}
                className={`p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                  curSide === "lay"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <ArrowTrendingDownIcon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Lay</div>
                  <div className="text-xs opacity-75">Bet against</div>
                </div>
              </button>
            </div>
          </div>
          <form ref={formRef} onSubmit={handleFormSubmit}>
            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stake Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-lg">$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!sanitizeInput(value)) {
                      setError("Please enter a valid amount.");
                    } else {
                      setError(null);
                      setAmount(value);
                    }
                  }}
                  name="amount"
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-2">
                {[10, 25, 50, 100].map((quickAmount) => (
                  <button
                    type="button"
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount.toString())}
                    className="flex-1 py-2 px-3 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculation Display */}
            {numericAmount > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stake:</span>
                    <span className="font-semibold">
                      ${numericAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {curSide === "back"
                        ? "Potential Profit:"
                        : "Potential Loss:"}
                    </span>
                    <span
                      className={`font-semibold ${
                        curSide === "back" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ${payout.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-900 font-medium">
                      {curSide === "back" ? "Total Return:" : "Max Liability:"}
                    </span>
                    <span className="font-bold text-lg">
                      $
                      {curSide === "back"
                        ? totalReturn.toFixed(2)
                        : payout.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={!numericAmount || numericAmount <= 0}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 hover:cursor-pointer ${
                  curSide === "back"
                    ? "bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white"
                    : "bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white"
                }`}
              >
                {numericAmount > 0 ? (
                  <>
                    Place {curSide === "back" ? "Back" : "Lay"} Bet - $
                    {numericAmount.toFixed(2)}
                  </>
                ) : (
                  "Enter Amount to Continue"
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 px-6 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors hover:cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Bets are final once placed. Please review your selection carefully.
          </p>
        </div>
      </>
    );
  }

  useEffect(() => {
    const handle = () => document.body.classList.toggle("overflow-hidden");
    handle();

    return () => {
      handle();
    };
  }, []);

  return (
    <>
      <div className="w-screen h-screen fixed top-0 left-0 z-100 backdrop-blur-xs">
        {/* Backdrop for mobile */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300 ${
            isVisible && !isClosing
              ? "opacity-100"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={handleClose}
        />

        {/* Desktop: Slide down from top */}
        <div
          className={`hidden md:block fixed top-0 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out  ${
            isVisible && !isClosing
              ? "translate-y-8 opacity-100"
              : "-translate-y-full opacity-0"
          }`}
        >
          <div className="max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {renderCardContent()}
          </div>
        </div>

        {/* Mobile: Slide up from bottom */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
            isVisible && !isClosing
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0"
          }`}
        >
          <div className="bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 max-h-[90vh] overflow-y-auto">
            {renderCardContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default BettingSlipCard;
