import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

const StaticMap = ({ height = '400px' }) => {
  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height }}>
      {/* Simple static map visualization */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
        {/* Map grid lines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Sample markers */}
        <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">A+</span>
            </div>
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 animate-ping rounded-full"></div>
          </div>
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded px-2 py-1 shadow text-xs whitespace-nowrap">
            <div className="font-semibold">John Doe</div>
            <div className="text-gray-600">Critical: A+</div>
          </div>
        </div>

        <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <span className="text-white text-xs">♥</span>
          </div>
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded px-2 py-1 shadow text-xs whitespace-nowrap">
            <div className="font-semibold">Available Donor</div>
            <div className="text-gray-600">Ready to help</div>
          </div>
        </div>

        <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 translate-y-1/2">
          <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded px-2 py-1 shadow text-xs whitespace-nowrap">
            <div className="font-semibold">City Hospital</div>
            <div className="text-gray-600">Your location</div>
          </div>
        </div>

        <div className="absolute top-1/3 right-1/3 transform translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">O-</span>
            </div>
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 animate-ping rounded-full"></div>
          </div>
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white rounded px-2 py-1 shadow text-xs whitespace-nowrap">
            <div className="font-semibold">Jane Smith</div>
            <div className="text-gray-600">Urgent: O-</div>
          </div>
        </div>
      </div>

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
        <button className="p-2 hover:bg-gray-100 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button className="p-2 hover:bg-gray-100 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Blood Requests</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Available Donors</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Hospitals</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticMap;
