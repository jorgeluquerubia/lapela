export default function SkeletonAdDetail() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-10 animate-pulse">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="md:w-1/2 lg:w-3/5">
          <div className="w-full h-[300px] md:h-[500px] bg-gray-200 rounded-lg"></div>
        </div>

        {/* Right Column: Info and Actions */}
        <div className="md:w-1/2 lg:w-2/5">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2 mb-6"></div>
          
          <div className="h-20 bg-gray-200 rounded-lg mb-6"></div>
          
          <div className="h-12 bg-gray-200 rounded-lg w-full"></div>

          <div className="mt-8">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="space-y-2 mt-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
