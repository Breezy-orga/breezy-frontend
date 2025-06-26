"use client";
import React from 'react';
import Image from 'next/image';

// Composant simplifié de suggestions à suivre
export function Follows() {
  return (
    <div className="h-full bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 w-full p-5 pb-32 overflow-y-auto">
      <h3 className="font-bold text-xl mb-6 text-gray-900 dark:text-gray-100">Suggestions pour vous</h3>
      
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image 
                src={`/pp${i + 1}.jpg`} 
                alt="User" 
                width={40} 
                height={40} 
                className="rounded-full" 
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">User {i + 1}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">@user{i + 1}</div>
              </div>
            </div>
            <button className="text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 rounded-full transition">Suivre</button>
          </div>
        ))}
      </div>
    </div>
  );
}