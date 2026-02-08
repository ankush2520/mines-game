"use client";

import React, { useState } from "react";
import Image from "next/image";
import gemImage from "../assets/images/gem.png";

type GridCreatorProps = {
  rows?: number;
  cols?: number;
};

export default function GridCreator({ rows = 5, cols = 5 }: GridCreatorProps) {
  const [opened, setOpened] = useState<boolean[]>(
    Array(rows * cols).fill(false)
  );

  const handleClick = (i: number) => {
    const newOpened = opened.slice();
    newOpened[i] = true;
    setOpened(newOpened);
  };

  const cells: number[] = Array.from({ length: rows * cols }, (_, i) => i);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-amber-200 rounded-lg p-8 min-h-screen flex flex-col items-center pt-12">
        <div
          className="grid gap-2 mx-auto"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, width: cols * 60 }}
        >
        {cells.map((i) =>
          opened[i] ? (
            <div key={i} className="w-full aspect-square border border-sky-400 rounded-lg inline-flex items-center justify-center bg-transparent" aria-label={`gem-${i}`}>
              <Image src={gemImage} alt="gem" className="w-[90%] h-[90%] object-contain" width={60} height={60} />
            </div>
          ) : (
            <button
              key={i}
              className="w-full aspect-square bg-sky-100 border border-sky-400 rounded-lg inline-flex items-center justify-center cursor-pointer active:translate-y-0.5"
              onClick={() => handleClick(i)}
              aria-label={`cell-${i}`}
            />
          )
        )}
      </div>
      <button
        className="mt-6 px-8 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 active:translate-y-0.5"
        style={{ width: cols * 30 }}
      >
        Play
      </button>
      </div>
    </div>
  );
}
