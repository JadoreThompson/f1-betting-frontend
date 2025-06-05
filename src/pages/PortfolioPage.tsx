import {
  ArrowTrendingUpIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, type FC } from "react";
import { UtilsManager } from "../classes/UtilsManager";
import Header from "../components/Header";

interface UserStats {
  currentPositionsValue: number;
  totalVolumeTraded: number;
  totalPnL: number;
  pnlPercentage: number;
  joinedAt: string;
  username: string;
  totalPositions: number;
  winRate: number;
}

interface Position {
  amount: string;
  category: string;
  created_at: string;
  odds: string;
  side: "Yes" | "No";
  title: string;
}

interface Activity {
  type: "Bet Placed" | "Bet Settled" | "Payout Received";
  marketTitle: string;
  amount: string;
  side?: "Yes" | "No";
  timestamp: string;
  status: "Completed" | "Pending" | "Won" | "Lost";
}

const PortfolioPage: FC = () => {
  const [activeTab, setActiveTab] = useState<"positions" | "activity">(
    "positions"
  );
  const [positions, setPositions] = useState<Position[] | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[] | undefined>(
    undefined
  );
  const [user, setUser] = useState<UserStats>({
    currentPositionsValue: 12500,
    totalVolumeTraded: 45600,
    totalPnL: 2340,
    pnlPercentage: 23.4,
    joinedAt: "March 2024",
    username: "cryptotrader_pro",
    totalPositions: 8,
    winRate: 67.5,
  });

  useEffect(() => {
    const loadPositions = async () => {
      try {
        const rsp = await fetch(UtilsManager.BASE_URL + "/user/positions", {
          method: "GET",
          credentials: "include",
        });
        setPositions(await rsp.json());
      } catch (error) {}
    };

    loadPositions();
  }, []);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const rsp = await fetch(UtilsManager.BASE_URL + "/user/activities", {
          method: "GET",
          credentials: "include",
        });
        setActivities(await rsp.json());
      } catch (error) {}
    };

    loadActivities();
  }, []);

  useEffect(() => {
    const loadUserSummary = async () => {
      const rsp = await fetch(UtilsManager.BASE_URL + "/user/summary", {
        method: "GET",
        credentials: "include",
      });
      const d = await rsp.json();
      console.log(d);
    };

    loadUserSummary();
  }, []);

  const getKeys = (data: any) =>
    Object.keys(data[0]) as (keyof (Position | Activity))[];

  function loadMockPositions(): Position[] {
    return [
      {
        title: "Monaco Grand Prix - Race Winner",
        category: "Formula 1",
        odds: "2.45",
        side: "Yes",
        amount: "$2,500",
        created_at: "2 days ago",
      },
      {
        title: "Lewis Hamilton Top 3 Finish",
        category: "Formula 1",
        odds: "1.85",
        side: "Yes",
        amount: "$1,800",
        created_at: "3 days ago",
      },
      {
        title: "Max Verstappen Pole Position",
        category: "Formula 1",
        odds: "1.65",
        side: "No",
        amount: "$3,200",
        created_at: "5 days ago",
      },
      {
        title: "Charles Leclerc Podium Finish",
        category: "Formula 1",
        odds: "2.10",
        side: "Yes",
        amount: "$1,500",
        created_at: "1 week ago",
      },
    ];
  }

  function loadMockActivities(): Activity[] {
    return [
      {
        type: "Bet Placed",
        marketTitle: "Monaco Grand Prix - Race Winner",
        amount: "$2,500",
        side: "Yes",
        timestamp: "2 days ago",
        status: "Pending",
      },
      {
        type: "Payout Received",
        marketTitle: "Spanish Grand Prix Winner",
        amount: "$3,240",
        timestamp: "1 week ago",
        status: "Won",
      },
      {
        type: "Bet Settled",
        marketTitle: "Miami GP Fastest Lap",
        amount: "$800",
        side: "No",
        timestamp: "2 weeks ago",
        status: "Lost",
      },
      {
        type: "Bet Placed",
        marketTitle: "Lewis Hamilton Top 3 Finish",
        amount: "$1,800",
        side: "Yes",
        timestamp: "3 days ago",
        status: "Pending",
      },
      {
        type: "Payout Received",
        marketTitle: "Imola GP Pole Position",
        amount: "$2,100",
        timestamp: "3 weeks ago",
        status: "Won",
      },
    ];
  }

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Won":
        return "text-green-600 bg-green-50";
      case "Lost":
        return "text-red-600 bg-red-50";
      case "Pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getSideColor = (side: string) => {
    return side === "Yes"
      ? "text-green-600 bg-green-50"
      : "text-red-600 bg-red-50";
  };

  const checkUndefined = () =>
    (activeTab === "positions" ? positions : activities) === undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 mb-5">
        {/* User */}
        <section className=" flex flex-col md:flex-row md:items-center gap-3 mt-9">
          <div className="h-30 w-30 flex-center rounded-full bg-red-500 overflow-hidden">
            <img
              src="https://broadway.org.uk/sites/default/files/2024-02/kung-fu-panda-4-banner.png"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-3xl">{user.username}</span>
            <span className="text-gray-500">Joined {user.joinedAt}</span>
          </div>
        </section>

        <section className="mt-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Position Value */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-cyan-100 p-2 flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-cyan-600" />
                </div>
                <span className="text-sm text-gray-500">Position Value</span>
              </div>
              <div className="mt-2 text-xl font-semibold text-gray-900">
                $900
              </div>
            </div>

            {/* Profit / Loss */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-green-100 p-2 flex items-center justify-center">
                  <BanknotesIcon className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Profit / Loss</span>
              </div>
              <div className="mt-2 text-xl font-semibold text-green-600">
                +$120
              </div>
            </div>

            {/* Volume Traded */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 p-2 flex items-center justify-center">
                  <ArrowUpRightIcon className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Volume Traded</span>
              </div>
              <div className="mt-2 text-xl font-semibold text-gray-900">
                $3.5K
              </div>
            </div>

            {/* Markets Participated In */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 p-2 flex items-center justify-center">
                  <Squares2X2Icon className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-sm text-gray-500">Markets Traded</span>
              </div>
              <div className="mt-2 text-xl font-semibold text-gray-900">14</div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          {/* Container card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            {/* Tab buttons */}
            <div className="flex gap-4 border-b border-gray-200 mb-4">
              <button
                className={`pb-2 border-b-2 transition-all text-sm font-medium hover:cursor-pointer ${
                  activeTab === "positions"
                    ? "border-b-blue-500 text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-blue-300"
                }`}
                onClick={() => setActiveTab("positions")}
              >
                Positions
              </button>
              <button
                className={`pb-2 border-b-2 transition-all text-sm font-medium hover:cursor-pointer ${
                  activeTab === "activity"
                    ? "border-b-blue-500 text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-blue-300"
                }`}
                onClick={() => setActiveTab("activity")}
              >
                Activity
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {checkUndefined() ? (
                <h1>No data</h1>
              ) : (
                <table className="w-full text-sm text-gray-700">
                  <thead className="border-b border-gray-200">
                    <tr>
                      {getKeys(
                        activeTab === "positions" ? positions : activities
                      ).map((key, ind) => (
                        <th
                          key={ind}
                          className="px-4 py-2 text-left font-semibold whitespace-nowrap"
                        >
                          {key.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === "positions" ? positions : activities)!.map(
                      (item, ind) => (
                        <tr
                          key={ind}
                          className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                          {getKeys(
                            activeTab === "positions" ? positions : activities
                          ).map((key, innerInd) => (
                            <td
                              key={innerInd}
                              className="px-4 py-2 text-left whitespace-nowrap"
                            >
                              {item[key]}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PortfolioPage;
