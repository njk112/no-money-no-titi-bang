'use client'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="rounded-lg border p-4">
            <h2 className="font-semibold mb-4">Filters</h2>
            <p className="text-sm text-muted-foreground">
              Filters coming soon...
            </p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 space-y-4">
          {/* Search */}
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Search coming soon...
            </p>
          </div>

          {/* Table */}
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Items table coming soon...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
