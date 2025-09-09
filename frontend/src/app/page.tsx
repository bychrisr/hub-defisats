export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">Hub DefiSats</h1>
      </div>

      <div className="relative flex place-items-center">
        <h2 className="text-2xl">Welcome to the Future of DeFi</h2>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">Automation</h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Automate your trading strategies with advanced algorithms.
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">Real-time</h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Monitor your positions in real-time with live updates.
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">Secure</h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Built with security in mind using the latest technologies.
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">Lightning</h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Integrated with Lightning Network for fast payments.
          </p>
        </div>
      </div>
    </main>
  );
}
