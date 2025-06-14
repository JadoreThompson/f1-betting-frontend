import {
  ArrowTrendingUpIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState, type FC, type JSX } from "react";

import Header from "../components/Header";
import { UtilsManager } from "../lib/classes/UtilsManager";

interface UserStats {
  total_pos_value: number;
  volume: number;
  pnl: number;
  joined_at: string;
  username: string;
  markets_traded: number;
}

export interface Position {
  amount: string;
  category: string;
  created_at: string;
  odds: string;
  side: "Yes" | "No";
  title: string;
}

export interface Activity {
  type: "Bet Placed" | "Bet Settled" | "Payout Received";
  amount: number;
  address: string;
  title: string;
  category: string;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_quantity: number;
  has_next: boolean;
  has_prev: boolean;
}

// Placeholder data functions
const generatePlaceholderPositions = (
  page: number,
  perPage: number = 10
): { data: Position[]; pagination: PaginationInfo } => {
  const totalItems = 47; // Total placeholder positions
  const totalPages = Math.ceil(totalItems / perPage);
  const startIndex = (page - 1) * perPage;

  const positions: Position[] = [];
  const categories = [
    "Sports",
    "Politics",
    "Crypto",
    "Entertainment",
    "Technology",
  ];
  const sides: ("Yes" | "No")[] = ["Yes", "No"];
  const titles = [
    "Will Bitcoin reach $100k by end of 2024?",
    "Will Democrats win the next election?",
    "Will Tesla stock price double this year?",
    "Will the new Marvel movie break box office records?",
    "Will AI replace 50% of jobs by 2030?",
    "Will inflation drop below 2% this quarter?",
    "Will the housing market crash in 2024?",
    "Will renewable energy reach 80% by 2025?",
    "Will remote work become permanent for most companies?",
    "Will cryptocurrency regulation pass this year?",
  ];

  for (let i = 0; i < Math.min(perPage, totalItems - startIndex); i++) {
    const index = startIndex + i;
    positions.push({
      amount: `${(Math.random() * 5000 + 100).toFixed(2)}`,
      category: categories[index % categories.length],
      created_at: new Date(Date.now() - Math.random() * 10000000000)
        .toISOString()
        .split("T")[0],
      odds: `${(Math.random() * 0.8 + 0.1).toFixed(2)}`,
      side: sides[index % 2],
      title: titles[index % titles.length],
    });
  }

  return {
    data: positions,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_quantity: totalItems,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
  };
};

const generatePlaceholderActivities = (
  page: number,
  perPage: number = 8
): { data: Activity[]; pagination: PaginationInfo } => {
  const totalItems = 33; // Total placeholder activities
  const totalPages = Math.ceil(totalItems / perPage);
  const startIndex = (page - 1) * perPage;

  const activities: Activity[] = [];
  const types: ("Bet Placed" | "Bet Settled" | "Payout Received")[] = [
    "Bet Placed",
    "Bet Settled",
    "Payout Received",
  ];
  const categories = [
    "Sports",
    "Politics",
    "Crypto",
    "Entertainment",
    "Technology",
  ];
  const titles = [
    "Bitcoin Price Prediction Market",
    "2024 Presidential Election",
    "Tesla Stock Performance",
    "Marvel Movie Box Office",
    "AI Job Displacement",
    "Inflation Rate Forecast",
    "Housing Market Crash",
    "Renewable Energy Adoption",
    "Remote Work Future",
    "Crypto Regulation Timeline",
  ];

  for (let i = 0; i < Math.min(perPage, totalItems - startIndex); i++) {
    const index = startIndex + i;
    activities.push({
      type: types[index % types.length],
      amount: Math.floor(Math.random() * 2000 + 50),
      address: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random()
        .toString(16)
        .substr(2, 4)}`,
      title: titles[index % titles.length],
      category: categories[index % categories.length],
    });
  }

  return {
    data: activities,
    pagination: {
      current_page: page,
      total_pages: totalPages,
      total_quantity: totalItems,
      has_next: page < totalPages,
      has_prev: page > 1,
    },
  };
};

const generatePlaceholderUser = (): UserStats => {
  return {
    total_pos_value: 15420,
    volume: 47580,
    pnl: 2340,
    joined_at: "March 2023",
    username: "PandaTrader",
    markets_traded: 23,
  };
};

const PortfolioPage: FC = () => {
  const [activeTab, setActiveTab] = useState<"positions" | "activity">(
    "positions"
  );
  const [positions, setPositions] = useState<Position[] | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[] | undefined>(
    undefined
  );
  const [user, setUser] = useState<UserStats>({} as UserStats);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [positionsPagination, setPositionsPagination] =
    useState<PaginationInfo>({
      current_page: 1,
      total_pages: 1,
      total_quantity: 0,
      has_next: false,
      has_prev: false,
    });
  const [activitiesPagination, setActivitiesPagination] =
    useState<PaginationInfo>({
      current_page: 1,
      total_pages: 1,
      total_quantity: 0,
      has_next: false,
      has_prev: false,
    });

  const positionsRef = useRef<Position[] | undefined>(undefined);
  const activitiesRef = useRef<Activity[] | undefined>(undefined);

  const currentPaginationInfo: PaginationInfo =
    activeTab === "positions" ? positionsPagination : activitiesPagination;

  useEffect(() => {
    const loadPositions = async () => {
      if (activeTab !== "positions") return;

      if (positionsRef.current) {
        const existingData = checkCache(positionsRef.current, page);
        if (existingData) {
          setPositions(existingData as Position[]);
          setPositionsPagination((prev) => {
            const newInfo = { ...prev };
            newInfo.has_next = newInfo.total_pages > page;
            newInfo.has_prev = page > 1;
            newInfo.current_page = page;
            return newInfo;
          });
          return;
        }
      }

      setIsLoading(true);

      try {
        // Simulate API delay
        // await new Promise((resolve) => setTimeout(resolve, 800));
        // const data = generatePlaceholderPositions(page);
        // setPositions(data.data.length ? data.data : undefined);
        // setPositionsPagination(data.pagination);

        const rsp = await fetch(
          UtilsManager.BASE_URL + `/user/positions?page=${page}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (rsp.ok) {
          const data = await rsp.json();

          setPositions(data.data.length ? data.data : undefined);
          setPositionsPagination(data.pagination);

          if (positionsRef.current) {
            positionsRef.current.push(...data.data);
          } else {
            positionsRef.current = data.data;
          }
        }
      } catch (error) {
        console.error("Error loading positions:", error);
        setPositions(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    loadPositions();
  }, [page, activeTab]);

  useEffect(() => {
    const loadActivities = async () => {
      if (activeTab !== "activity") return;

      if (activitiesRef.current) {
        const existingData = checkCache(activitiesRef.current, page);
        if (existingData) {
          setActivities(existingData as Activity[]);
          setActivitiesPagination((prev) => {
            const newInfo = { ...prev };
            newInfo.has_next = newInfo.total_pages > page;
            newInfo.has_prev = page > 1;
            newInfo.current_page = page;
            return newInfo;
          });
          return;
        }
      }

      setIsLoading(true);

      try {
        // Simulate API delay
        // await new Promise((resolve) => setTimeout(resolve, 600));
        // const data = generatePlaceholderActivities(page);
        // setActivities(data.data.length ? data.data : undefined);
        // setActivitiesPagination(data.pagination);

        const rsp = await fetch(
          UtilsManager.BASE_URL + `/user/activity?page=${page}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (rsp.ok) {
          const data = await rsp.json();

          setActivities(data.data.length ? data.data : undefined);
          setActivitiesPagination(data.pagination);

          if (activitiesRef.current) {
            activitiesRef.current.push(...data.data);
          } else {
            activitiesRef.current = data.data;
          }
        }
      } catch (error) {
        console.error("Error loading activities:", error);
        setActivities(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, [page, activeTab]);

  useEffect(() => {
    const loadUserSummary = async () => {
      const rsp = await fetch(UtilsManager.BASE_URL + "/user/summary", {
        method: "GET",
        credentials: "include",
      });

      const d: UserStats = await rsp.json();
      setUser(d);
    };

    loadUserSummary();
  }, []);

  /**
   * Checks if the data for `page` already exists.
   * @param data
   * @param page
   */
  function checkCache(
    data: Position[] | Activity[],
    page: number
  ): Position[] | Activity[] | null {
    const start = (page - 1) * 10;
    const prev = data.slice(start, start + 10);

    if (prev.length) return prev;
    return null;
  }

  const handleTabChange = (tab: "positions" | "activity") => {
    setActiveTab(tab);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= currentPaginationInfo.total_pages) {
      setPage(newPage);
    }
  };

  const getKeys = (data: any) =>
    Object.keys(data[0]) as (keyof Position)[] | (keyof Activity)[];

  const formatNumber = (value: number): string => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const formatValue = (value: any): any => {
    if (typeof value === "string") {
      return UtilsManager.toCamelCase(value);
    } else if (typeof value === "number") {
      return formatNumber(value);
    }
    return value;
  };

  const checkUndefined = (): boolean =>
    (activeTab === "positions" ? positions : activities) === undefined;

  const renderPagination = (): JSX.Element | null => {
    if (currentPaginationInfo.total_pages <= 1) return null;

    const {
      current_page: currentPage,
      total_pages: totalPages,
      has_prev: hasPrev,
      has_next: hasNext,
    } = currentPaginationInfo;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center text-sm text-gray-500">
          <span>
            Page {currentPage} of {totalPages}
            {currentPaginationInfo.total_quantity > 0 && (
              <span className="ml-2">
                ({currentPaginationInfo.total_quantity} items)
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrev || isLoading}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              !hasPrev || isLoading
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Previous
          </button>

          {/* Page numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isLoading}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pageNum === currentPage
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext || isLoading}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              !hasNext || isLoading
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            Next
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  };

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
            <span className="text-gray-500">Joined {user.joined_at}</span>
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
                {user.total_pos_value}
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
                {user.pnl}
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
                ${user.volume}
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
              <div className="mt-2 text-xl font-semibold text-gray-900">
                {user.markets_traded}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          {/* Container card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Tab buttons */}
            <div className="flex gap-4 border-b border-gray-200 mb-4 p-4 pb-0">
              <button
                className={`pb-2 border-b-2 transition-all text-sm font-medium hover:cursor-pointer ${
                  activeTab === "positions"
                    ? "border-b-blue-500 text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-blue-300"
                }`}
                onClick={() => handleTabChange("positions")}
                disabled={isLoading}
              >
                Positions
              </button>
              <button
                className={`pb-2 border-b-2 transition-all text-sm font-medium hover:cursor-pointer ${
                  activeTab === "activity"
                    ? "border-b-blue-500 text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-blue-300"
                }`}
                onClick={() => handleTabChange("activity")}
                disabled={isLoading}
              >
                Activity
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Loading...</span>
                </div>
              ) : checkUndefined() ? (
                <div className="text-center py-8">
                  <h1 className="text-gray-500">No data available</h1>
                </div>
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
                          {formatValue(key.toUpperCase())}
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
                              {key === "address" ? (
                                <a
                                  href={`#`}
                                  target="_blank"
                                  className="underline text-blue-500 hover:text-blue-700"
                                >
                                  {item[key as keyof typeof item]}
                                </a>
                              ) : (
                                formatValue(item[key as keyof typeof item])
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </div>
        </section>
      </main>
    </div>
  );
};

export default PortfolioPage;
