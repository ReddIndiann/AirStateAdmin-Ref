import React from 'react';

const Divider: React.FC = () => {
  return (
    <div className="flex w-full mt-10 items-center justify-center my-4">
      <div className="border-t border-black flex-grow"></div>
      <span className="mx-4 text-black text-[18px] font-light">OR</span>
      <div className="border-t border-black flex-grow"></div>
    </div>
  );
};

export default Divider;
