import { Bars3Icon, UserIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, type FC } from "react";

interface Odd {
  numerator: number;
  denominator: number;
  title: string;
}

const App: FC = () => {
  const [oddsCollection, setOddsCollection] = useState<Odd[] | undefined>(
    undefined
  );

  useEffect(() =>
    setOddsCollection([
      {
        numerator: 5,
        denominator: 1,
        title: "Charles Leclerc finishing top 3",
      },
      {
        numerator: 9,
        denominator: 1,
        title: "Yuki Tsunoda finishing top 3",
      },
      {
        numerator: 9,
        denominator: 1,
        title: "Yuki Tsunoda finishing top 3",
      },
      
    ])
  );

  return (
    <>
      <header className="h-9 sticky flex items-center justify-end px-9 bg-red-500">
        <div className="w-auto h-full flex flex-row items-center gap-3">
          <a
            href="#"
            className="w-[1.5rem] h-full flex items-center justify-center text-white cursor-pointer"
          >
            <UserIcon className="h-full w-full flex items-center justify-center text-white" />
          </a>
          <a
            href="#"
            className="w-[1.5rem] h-full flex items-center justify-center text-white cursor-pointer"
          >
            <Bars3Icon />
          </a>
        </div>
      </header>
      <main className="px-9">
        <div className="w-3/4 h-auto m-auto">
          {/* Hero Section */}
          <div className="w-full h-65 flex items-center justify-center">
            <div className="w-full h-50 max-h-50 rounded-lg relative m-auto bg-gray-900">
              <img
                src="src/assets/images/oscpia01.png"
                alt=""
                className="h-full absolute right-0"
              />
              <img
                src="src/assets/images/lewham01.png"
                alt=""
                className="w-auto h-full absolute right-20"
              />
              <img
                src="src/assets/images/maxver01.png"
                alt=""
                className="w-auto h-full absolute right-40"
              />
            </div>
          </div>
          {/* Current Odds */}
          <div className="w-full h-auto m-auto">
            <div className="grid grid-cols-3 gap-3">
              {oddsCollection?.map((data, ind) => (
                <div
                  key={ind}
                  className="flex flex-col items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 cursor-pointer"
                >
                  <span className="text-xs font-thin">{data.title}</span>
                  <span className="text-lg font-bold">
                    {data.numerator}/{data.denominator}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
export default App;
