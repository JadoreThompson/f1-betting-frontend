import { useState, type FC } from "react";
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
  marketTitle: string;
  category: string;
  odds: string;
  side: "Yes" | "No";
  amount: string;
  createdAt: string;
  currentValue: string;
  pnl: string;
  pnlPercentage: string;
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
  const getKeys = (data: any) =>
    Object.keys(data[0]) as (keyof (Position | Activity))[];

  const positions: Position[] = [
    {
      marketTitle: "Monaco Grand Prix - Race Winner",
      category: "Formula 1",
      odds: "2.45",
      side: "Yes",
      amount: "$2,500",
      createdAt: "2 days ago",
      currentValue: "$2,750",
      pnl: "+$250",
      pnlPercentage: "+10.0%",
    },
    {
      marketTitle: "Lewis Hamilton Top 3 Finish",
      category: "Formula 1",
      odds: "1.85",
      side: "Yes",
      amount: "$1,800",
      createdAt: "3 days ago",
      currentValue: "$1,980",
      pnl: "+$180",
      pnlPercentage: "+10.0%",
    },
    {
      marketTitle: "Max Verstappen Pole Position",
      category: "Formula 1",
      odds: "1.65",
      side: "No",
      amount: "$3,200",
      createdAt: "5 days ago",
      currentValue: "$2,880",
      pnl: "-$320",
      pnlPercentage: "-10.0%",
    },
    {
      marketTitle: "Charles Leclerc Podium Finish",
      category: "Formula 1",
      odds: "2.10",
      side: "Yes",
      amount: "$1,500",
      createdAt: "1 week ago",
      currentValue: "$1,650",
      pnl: "+$150",
      pnlPercentage: "+10.0%",
    },
  ];

  const activities: Activity[] = [
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 mb-5">
        {/* User */}
        <section className=" flex flex-col md:flex-row md:items-center gap-3">
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
          <div className="flex flex-row gap-3">
            <button
              className={`p-1 hover:text-gray-700 border-b-2 hover:border-b-blue-300  hover:cursor-pointer ${
                activeTab == "positions"
                  ? "border-b-blue-500 font-semibold text-black"
                  : "text-gray-500 border-b-transparent"
              }`}
              onClick={() => setActiveTab("positions")}
            >
              Positions
            </button>
            <button
              className={`p-1 hover:text-gray-700 border-b-2 hover:border-b-blue-300  hover:cursor-pointer ${
                activeTab == "activity"
                  ? "border-b-blue-500 font-semibold text-black"
                  : "text-gray-500 border-b-transparent"
              }`}
              onClick={() => setActiveTab("activity")}
            >
              Activity
            </button>
          </div>

          <div className="border-t-1 border-t-gray-300">
            <table className="w-full">
              <thead>
                <tr>
                  {getKeys(
                    activeTab === "positions" ? positions : activities
                  ).map((key, ind) => (
                    <th key={ind} className="text-left whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(activeTab === "positions" ? positions : activities).map(
                  (item, ind) => (
                    <>
                      <tr key={ind}>
                        {getKeys(
                          activeTab === "positions" ? positions : activities
                        ).map((key, ind) => (
                          <td
                            key={ind}
                            className="py-2 text-left whitespace-nowrap"
                          >
                            {item[key]}
                          </td>
                        ))}
                      </tr>
                    </>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PortfolioPage;
