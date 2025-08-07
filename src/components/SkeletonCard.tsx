export default function SkeletonCard() {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white animate-pulse">
      <div className="w-full h-48 bg-gray-200"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
      </div>
    </div>
  );
}
