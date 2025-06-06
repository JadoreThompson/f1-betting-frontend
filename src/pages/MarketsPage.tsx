import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, type FC } from "react";
import { UtilsManager } from "../classes/UtilsManager";
import Header from "../components/Header";
import MarketCard from "../components/MarketCard";
import type { Market } from "../types";

function generateMockMarkets(count: number): Market[] {
  const categories = ["top3", "winner"];

  return Array.from({ length: count }, (_, i) => {
    const title = `Market ${i}`;
    const category = categories[i % categories.length];
    const numerator = Math.floor(Math.random() * 90 + 10); // 10–99
    const denominator = 100;
    return {
      title,
      category,
      numerator,
      denominator,
      market_id: i + 1,
    };
  });
}

function loadMockMarkets(): {
  titles: string[];
  winners: any[][];
  top3: any[][];
} {
  const markets = generateMockMarkets(20);
  const titles = Object.keys(markets[0]);
  const winners = markets.filter((m) => m.category == "winner");
  const top3s = markets.filter((m) => m.category == "top3");
  const data = {
    titles,
    winners: winners.map((wm) => Object.values(wm)),
    top3: top3s.map((t3m) => Object.values(t3m)),
  };

  return data;
}

const MarketsPage: FC = () => {
  const [winnerMarkets, setWinnerMarkets] = useState<Market[]>([]);
  const [top3Markets, setTop3Markets] = useState<Market[]>([]);
  const [totalVolume, setTotalVolume] = useState<bigint | undefined>(undefined);
  const [activeBetCount, setActiveBetCount] = useState<bigint | undefined>(
    undefined
  );

  useEffect(() => {
    function parseMarketsData(keys: string[], data: any[][]): Market[] {
      return data.map((data) => {
        let market: any = {};
        keys.forEach((key, index) => {
          market[key] = data[index];
        });
        return market as Market;
      });
    }

    async function loadMarkets(): Promise<void> {
      try {
        const response = await fetch(UtilsManager.BASE_URL + "/markets");
        const data = await response.json();
        // const data = loadMockMarkets();
        setWinnerMarkets(parseMarketsData(data.titles, data.winners));
        setTop3Markets(parseMarketsData(data.titles, data.top3));
      } catch (error) {
        console.error("Error fetching markets:", error);
      }
    }

    loadMarkets();
  }, []);

  useEffect(() => {
    const fetchMarketSummary = async (): Promise<void> => {
      try {
        const rsp = await fetch(UtilsManager.BASE_URL + "/markets/summary");
        const d = await rsp.json();
        setActiveBetCount(d.active_bets);
        setTotalVolume(d.total_volume);
      } catch (error) {}
    };

    fetchMarketSummary();
  }, []);

  function formatVolume(value: bigint): string {
    const million = 1_000_000n;
    const thousand = 1_000n;

    const formatSmart = (num: number, suffix: string): string => {
      return Math.round(num * 10) % 10 === 0
        ? `${Math.round(num)}${suffix}`
        : `${num.toFixed(1)}${suffix}`;
    };

    if (value >= million) {
      const num = Number(value) / Number(million);
      return value <= 10_000_000n
        ? formatSmart(num, "M")
        : `${Math.round(num)}M`;
    } else if (value >= thousand) {
      const num = Number(value) / Number(thousand);
      return formatSmart(num, "K");
    } else {
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }

  function formatActiveBetCount(value: bigint): string {
    const num = Number(value);
    if (isNaN(num)) return "Invalid number";

    if (value >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + "M";
    } else if (value >= 100_000n) {
      return (num / 1_000).toFixed(0) + "K";
    } else if (value > 10_000) {
      return (num / 1_000).toFixed(1) + "K";
    } else {
      return num.toLocaleString();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-200 px-3 py-1 rounded-full text-sm mb-4">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Live Event
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Monaco Grand Prix
                <span className="block text-2xl lg:text-3xl text-blue-300 font-normal mt-2">
                  Formula 1 Championship
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Place your bets on the most prestigious race in Formula 1. Live
                odds, instant settlements, and transparent markets.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    $
                    {totalVolume !== undefined ? formatVolume(totalVolume) : ""}
                  </div>
                  <div className="text-sm text-gray-400">Total Volume</div>
                </div>
                <div className="w-px h-12 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {activeBetCount !== undefined
                      ? formatActiveBetCount(activeBetCount)
                      : ""}
                  </div>
                  <div className="text-sm text-gray-400">Active Bets</div>
                </div>
                <div className="w-px h-12 bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold">Live</div>
                  <div className="text-sm text-gray-400">Market Status</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Market Overview</h3>
                    <p className="text-sm text-gray-300">
                      Real-time betting data
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Most Backed</span>
                    <span className="font-semibold">Max Verstappen</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Biggest Upset</span>
                    <span className="font-semibold">Lando Norris</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Latest Bet</span>
                    <span className="font-semibold">$500 on Hamilton</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Markets Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Race Winner */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Race Winner
              </h2>
              <p className="text-gray-600">
                Who will cross the finish line first?
              </p>
            </div>

            <div className="space-y-4">
              {winnerMarkets.map((market, index) => (
                <MarketCard key={index} market={market} category="Winner" />
              ))}
            </div>
          </div>

          {/* Top 3 Finish */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Podium Finish
              </h2>
              <p className="text-gray-600">
                Who will finish in the top 3 positions?
              </p>
            </div>

            <div className="space-y-4">
              {top3Markets.map((market, index) => (
                <MarketCard key={index} market={market} category="Top 3" />
              ))}
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowTrendingUpIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Live Odds</h3>
              <p className="text-sm text-gray-600">
                Real-time odds updates based on market sentiment and expert
                analysis
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Instant Settlement</h3>
              <p className="text-sm text-gray-600">
                Automated payouts as soon as race results are confirmed
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-2">Transparent Markets</h3>
              <p className="text-sm text-gray-600">
                All bets and odds are publicly verifiable on the blockchain
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MarketsPage;
