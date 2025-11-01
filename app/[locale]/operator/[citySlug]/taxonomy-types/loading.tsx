/**
 * Loading State for Taxonomy Types List Page
 * ==========================================
 */

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded"></div>
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-6 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-16 bg-gray-200 rounded"></div>
                  <div className="h-5 w-20 bg-gray-200 rounded"></div>
                  <div className="h-5 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-9 w-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Info card skeleton */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="h-6 w-48 bg-gray-200 rounded"></div>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}
